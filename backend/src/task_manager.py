import logging
import traceback
import json
import time
import asyncio
import datetime
import uuid

import numpy as np
import cv2
import redis

from celery import Celery
from celery.result import AsyncResult
from celery.exceptions import TaskRevokedError
import redis.asyncio as aioredis

from enum import Enum
from typing import Dict, Any, Optional, List, Tuple, AsyncGenerator, Set
from dataclasses import dataclass, field

from fastapi import WebSocket, WebSocketDisconnect

from service_ai import ServiceAI
from vms import CameraClient

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
logger.addHandler(logging.StreamHandler())
logger.addHandler(logging.FileHandler(f"/tmp/{__name__}.log"))

celery_app = Celery(
    'forensic_tasks',
    broker='redis://localhost:6379/0',
    backend='redis://localhost:6379/0'
)
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600,               # 1 hour max
    worker_prefetch_multiplier=1,       # Un worker ne prend qu'une tâche à la fois
    task_acks_late=True,                # Confirmer la tâche uniquement après exécution
    task_reject_on_worker_lost=True     # Rejeter les tâches si le worker s'arrête
)

redis_pool = aioredis.ConnectionPool.from_url('redis://localhost:6379/1')

class JobStatus(str, Enum):
    PENDING = "PENDING"                 # Tâche créée, pas encore préparée pour l'exécution
    RECEIVED = "RECEIVED"               # Tâche reçue, prête à être exécutée
    STARTED = "STARTED"                 # Tâche en cours d'exécution
    SUCCESS = "SUCCESS"                 # Tâche terminée avec succès
    FAILURE = "FAILURE"                 # Tâche échouée
    REVOKED = "REVOKED"                 # Tâche annulée
    RETRY = "RETRY"                     # Tâche en cours de nouvelle tentative après échec

@dataclass
class JobResult:
    job_id: str
    metadata: Dict[str, Any]
    frame: Optional[bytes] = None
    frame_uuid: Optional[str] = None
    final: bool = False
    
    def to_redis_message(self) -> Dict[str, Any]:
        if self.frame is not None and not self.frame_uuid:
            self.frame_uuid = str(uuid.uuid4())
            
        # Les frames binaires sont publiées séparément
        message = {
            "job_id": self.job_id,
            "metadata": self.metadata,
            "frame_uuid": self.frame_uuid,
            "final": self.final
        }
        return message
    
    @classmethod
    async def from_redis_message(cls, message: Dict[str, Any], redis_client=None) -> 'JobResult':
        job_id = message.get("job_id")
        metadata = message.get("metadata", {})
        frame_uuid = message.get("frame_uuid")
        final = message.get("final", False)
        
        # Récupérer la frame si un UUID est présent et un client Redis fourni
        frame = None
        if frame_uuid and redis_client:
            frame_key = f"task:{job_id}:frame:{frame_uuid}"
            frame = await redis_client.get(frame_key)
            
        return cls(
            job_id=job_id,
            metadata=metadata,
            frame=frame,
            frame_uuid=frame_uuid,
            final=final
        )

class ResultsStore:
    def __init__(self, max_results: int = 100):
        self.max_results = max_results
        self._redis = None
        
    async def _get_redis(self) -> aioredis.Redis:
        if self._redis is None:
            self._redis = aioredis.Redis(connection_pool=redis_pool)
        return self._redis
    
    async def add_result(self, result: JobResult) -> None:
        redis = await self._get_redis()
        
        # Clés Redis pour cette tâche
        result_list_key = f"task:{result.job_id}:results"
        channel_name = f"task:{result.job_id}:updates"
        
        # Stocker les métadonnées du résultat (sans la frame)
        result_data = result.to_redis_message()
        await redis.lpush(result_list_key, json.dumps(result_data))
        await redis.ltrim(result_list_key, 0, self.max_results - 1)
        
        # Publier le résultat sur le canal Redis
        await redis.publish(channel_name, json.dumps(result_data))
        
        # Si une frame est présente, la stocker séparément et notifier
        if result.frame and result.frame_uuid:
            frame_key = f"task:{result.job_id}:frame:{result.frame_uuid}"
            await redis.set(frame_key, result.frame, ex=3600)  # Expire après 1h
            frame_notification = {
                "job_id": result.job_id,
                "frame_uuid": result.frame_uuid
            }
            await redis.publish(f"{channel_name}:frames", json.dumps(frame_notification))
    
    async def get_results(self, job_id: str, start: int = 0, end: int = -1) -> List[JobResult]:
        redis = await self._get_redis()
        result_list_key = f"task:{job_id}:results"
        
        results_json = await redis.lrange(result_list_key, start, end)
        results = []
        
        for result_json in results_json:
            message = json.loads(result_json)
            result = await JobResult.from_redis_message(message, redis)
            results.append(result)
            
        return results
    
    async def subscribe_to_results(self, job_id: str):
        """
        Souscrit aux mises à jour et yield des JobResult.
        """
        redis = await self._get_redis()
        pubsub = redis.pubsub()
        channel_name = f"task:{job_id}:updates"
        await pubsub.subscribe(channel_name)
        
        try:
            while True:
                message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
                if message is None:
                    # Si aucun message n'est trouvé, on vérifie si la tâche est terminée.
                    task_status = TaskManager.get_job_status(job_id)
                    if task_status in [JobStatus.SUCCESS, JobStatus.FAILURE, JobStatus.REVOKED]:
                        # On attend quelques instants supplémentaires pour être sûr de ne rien rater.
                        for _ in range(5):
                            message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
                            if message:
                                break
                        if message is None:
                            break
                    continue
                
                # On s'assure qu'il s'agit bien d'un message complet de type metadata.
                try:
                    update_data = json.loads(message["data"])
                except Exception as ex:
                    continue
                
                # Reconstituer le JobResult complet.
                job_result = await JobResult.from_redis_message(update_data, redis_client=redis)
                yield job_result
                
        finally:
            await pubsub.unsubscribe(channel_name)

results_store = ResultsStore()

@celery_app.task(bind=True, name="task_manager.execute_job")
def execute_job(self, job_type: str, job_params: Dict[str, Any]):   
    job_id = self.request.id
    logger.info(f"Exécution du job {job_type} avec l'ID {job_id}")
    
    # Publier l'état initial
    self.update_state(state=JobStatus.STARTED.value)
    
    try:
        if job_type == "VehicleReplayJob":
            cancel_event = asyncio.Event()
            job_params['job_id'] = job_id  # Transmettre l'ID de la tâche
            job = VehicleReplayJob(job_params, cancel_event=cancel_event)
        else:
            raise ValueError(f"Type de job non reconnu: {job_type}")
        
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        async def process_job_results():
            try:
                async for metadata, frame in job._execute():
                    result = JobResult(
                        job_id=job_id,
                        metadata=metadata,
                        frame=frame
                    )
                    await results_store.add_result(result)
                    
                    if cancel_event.is_set() or TaskManager.get_job_status(job_id) == JobStatus.REVOKED:
                        logger.info(f"Job {job_id} annulé pendant l'exécution")
                        raise TaskRevokedError()
            except asyncio.CancelledError:
                logger.info(f"Job {job_id} annulé")
                cancel_event.set()
                raise TaskRevokedError()
            
            # Notification finale
            final_result = JobResult(
                job_id=job_id,
                metadata={"type": "completed", "message": "Tâche terminée avec succès"},
                final=True
            )
            await results_store.add_result(final_result)
                
        loop.run_until_complete(process_job_results())
        loop.close()
        
        return {"job_id": job_id, "status": JobStatus.SUCCESS.value}
    
    except TaskRevokedError:
        logger.info(f"Job {job_id} révoqué")
        
        # Envoyer une notification d'annulation
        async def send_cancellation():
            result = JobResult(
                job_id=job_id,
                metadata={"type": "cancelled", "message": "Tâche annulée"},
                final=True
            )
            await results_store.add_result(result)
            
        asyncio.run(send_cancellation())
        return {"job_id": job_id, "status": JobStatus.REVOKED.value}
    
    except Exception as e:
        logger.error(f"Erreur dans le job {job_id}: {e}")
        logger.error(traceback.format_exc())
        
        async def send_error():
            result = JobResult(
                job_id=job_id,
                metadata={
                    "type": "error",
                    "message": f"Erreur: {str(e)}",
                    "stacktrace": traceback.format_exc()
                },
                final=True
            )
            await results_store.add_result(result)
            
        asyncio.run(send_error())
        return {"job_id": job_id, "status": JobStatus.FAILURE.value, "error": str(e)}

class TaskManager:
    """Gestionnaire de tâches façade pour les opérations Celery/Redis"""
    
    @staticmethod
    def submit_job(job_type: str, job_params: Dict[str, Any]) -> str:
        logger.info(f"Soumission d'un nouveau job de type {job_type}")
        task = execute_job.apply_async(args=[job_type, job_params])
        return task.id
    
    @staticmethod
    async def cancel_job(job_id: str) -> bool:
        logger.info(f"Tentative d'annulation du job {job_id}")
        try:
            await asyncio.to_thread(celery_app.control.revoke, job_id, terminate=True)
            
            async def send_cancellation():
                result = JobResult(
                    job_id=job_id,
                    metadata={"type": "cancelled", "message": "Tâche annulée manuellement"},
                    final=True
                )
                await results_store.add_result(result)
                
            await send_cancellation()
            return True
        except Exception as e:
            logger.error(f"Erreur lors de l'annulation du job {job_id}: {e}")
            return False
    
    @staticmethod
    def get_job_status(job_id: str) -> JobStatus:
        result = AsyncResult(job_id)
        
        if result.failed():
            return JobStatus.FAILURE
        elif result.successful():
            return JobStatus.SUCCESS
 
        try:
            state_str = result.state.upper()
            return JobStatus[state_str]
        except KeyError:
            logger.warning(f"État inconnu pour la tâche {job_id}: {result.state}")
            return JobStatus.REVOKED
    
    @staticmethod
    async def get_job_error(job_id: str) -> Tuple[Optional[str], Optional[str]]:
        try:
            result = AsyncResult(job_id, app=celery_app)
            if result.failed():
                # Tenter de récupérer les résultats d'erreur stockés dans Redis
                error_data = await results_store.get_results(job_id, 0, 0)
                if error_data and len(error_data) > 0:
                    metadata = error_data[0].metadata
                    return metadata.get("message"), metadata.get("stacktrace")
                    
                # Sinon, utiliser l'erreur Celery
                return str(result.result), None
            return None, None
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des détails d'erreur du job {job_id}: {e}")
            return str(e), None
    
    @staticmethod
    async def get_jobs() -> List[str]:
        all_tasks: Set[str] = set()
        try:
            # Récupérer les tâches actives via Celery
            inspect = celery_app.control.inspect()
            active_tasks = inspect.active() or {}
            for tasks in active_tasks.values():
                all_tasks.update(task['id'] for task in tasks)
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des tâches actives: {e}")

        try:
            # Récupérer les tâches terminées depuis Redis à partir des clés "task:*:results"
            redis = aioredis.Redis(connection_pool=redis_pool)
            keys = await redis.keys("task:*:results")
            for key in keys:
                key_str = key.decode('utf-8') if isinstance(key, bytes) else str(key)
                parts = key_str.split(':')
                if len(parts) >= 2:
                    all_tasks.add(parts[1])
            await redis.close()
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des tâches depuis Redis: {e}")

        return list(all_tasks)
    
    @staticmethod
    async def get_job_results(job_id: str) -> List[JobResult]:
        return await results_store.get_results(job_id)
    
    @staticmethod
    async def stream_job_results(websocket: WebSocket, job_id: str):
        """
        Diffuse les résultats d'une tâche vers un WebSocket.
        Envoie l'historique des résultats puis s'abonne aux mises à jour.
        """
        try:
            # Envoyer les résultats précédents
            previous_results = await results_store.get_results(job_id)
            for result in previous_results:
                # Envoyer les métadonnées
                await websocket.send_json({
                    "type": "history",
                    "data": {
                        "job_id": result.job_id,
                        "metadata": result.metadata,
                        "frame_uuid": result.frame_uuid,
                        "final": result.final
                    }
                })
                
                # Envoyer la frame si présente
                if result.frame:
                    await websocket.send_bytes(result.frame)
            
            # S'abonner aux nouvelles mises à jour
            async for update in results_store.subscribe_to_results(job_id):
                if update["type"] == "metadata":
                    await websocket.send_json(update["data"])
                elif update["type"] == "frame":
                    await websocket.send_bytes(update["frame"])
                    
                    # Vérifier si le websocket est toujours connecté
                    if websocket.client_state.DISCONNECTED:
                        break
        
        except WebSocketDisconnect:
            logger.info(f"Client WebSocket déconnecté pour le job {job_id}")
        except Exception as e:
            logger.error(f"Erreur lors du streaming des résultats pour le job {job_id}: {e}")
            logger.error(traceback.format_exc())
            
            # Essayer d'envoyer un message d'erreur si le websocket est encore connecté
            try:
                if not websocket.client_state.DISCONNECTED:
                    await websocket.send_json({
                        "type": "error",
                        "message": f"Erreur de streaming: {str(e)}"
                    })
            except:
                pass

class VehicleReplayJob:
    """
    Job pour traiter les flux vidéo en fonction d'un ModelVehicle.
    """
    def __init__(self, data: Dict[str, Any], cancel_event=None):
        logger.info(f"Starting job with data: {data}")
        self.data = data
        self.sources = data.get("sources", [])
        self.timerange = data.get("timerange", {})

        self.time_from = self.timerange.get("time_from").astimezone(datetime.timezone.utc)
        self.time_to = self.timerange.get("time_to").astimezone(datetime.timezone.utc)

        self.type = data.get("type", None)
        
        # Récupère l'ID de job Celery s'il est fourni, sinon génère un UUID
        self.job_id = data.get("job_id", str(uuid.uuid4()))
        
        # Initialise l'événement d'annulation si fourni, sinon crée-en un nouveau
        self.cancel_event = cancel_event or asyncio.Event()
        
        if not self.sources:
            logger.error("Au moins une source (GUID de caméra) doit être spécifiée")
            raise ValueError("Au moins une source (GUID de caméra) doit être spécifiée")
        
        if not self.time_from or not self.time_to:
            logger.error("La plage temporelle (time_from et time_to) doit être spécifiée")
            raise ValueError("La plage temporelle (time_from et time_to) doit être spécifiée")
        
    def _calculate_progress(self, current: datetime.datetime, from_time: datetime.datetime, to_time: datetime.datetime) -> float:
        total_duration = (to_time - from_time).total_seconds()
        if total_duration <= 0:
            logger.error(f"Invalid time range: {from_time} - {to_time}")
            return 100.0
            
        elapsed = (current - from_time).total_seconds()
        progress = min(100.0, max(0.0, (elapsed / total_duration) * 100.0))
        return progress
    
    def __calculate_iou(self, box1, box2):
        top1, bottom1, left1, right1 = box1
        top2, bottom2, left2, right2 = box2
        
        x_left = max(left1, left2)
        y_top = max(top1, top2)
        x_right = min(right1, right2)
        y_bottom = min(bottom1, bottom2)
        
        # Vérifier s'il y a intersection
        if x_right < x_left or y_bottom < y_top:
            return 0.0
        
        intersection_area = (x_right - x_left) * (y_bottom - y_top)
        
        box1_area = (right1 - left1) * (bottom1 - top1)
        box2_area = (right2 - left2) * (bottom2 - top2)
        
        union_area = box1_area + box2_area - intersection_area
        
        if union_area <= 0:
            return 0.0
        
        return intersection_area / union_area
    
    def _filter(self, bbox, probabilities: Dict[str, float]):
        size = self._filter_size(bbox)
        detector = self._filter_detections(probabilities)
        classifier = self._filter_classification()
        return size * detector * classifier
    
    def _filter_size(self, bbox):
        top, bottom, left, right = bbox

        min_size = 64  # below this size, the object is too small and the model is not reliable
        max_size = 224 # trained model size

        width = right - left
        height = bottom - top
        min_dim = min(width, height)

        if min_dim < min_size:
            return 0.0

        # lerp based on min_dim between min_size and max_size
        return max(0.0, min(1.0, (min_dim - min_size) / (max_size - min_size)))
    
    def _filter_detections(self, probabilities: Dict[str, float]):
        allowed_classes = set()
        
        if self.type == "vehicle":
            coco = {"car", "truck", "bus", "motorcycle"}
            voc = {"car", "bus", "motorbike"}
            obj365 = {"car", "sports car", "suv", "van", "truck", "pickup truck", "heavy truck", "bus", "fire truck", "ambulance", "machinery vehicle", "motorcycle"}
            miotcd = {"car", "pickup truck", "single unit truck", "articulated truck", "work van", "bus", "motorcycle", "motorized vehicle"}

            allowed_classes = coco | voc | obj365 | miotcd
        elif self.type == "mobility":
            coco = {"bicycle", "skateboard", "surfboard", "skis", "snowboard"}
            voc = {"bicycle"}
            obj365 = {"bicycle", "scooter", "tricycle", "rickshaw", "carriage", "hoverboard", "skateboard"}
            miotcd = {"bicycle", "non-motorized vehicle"}
            openimages = {"bicycle", "skateboard", "scooter", "snowboard", "skis"}

            allowed_classes = coco | voc | obj365 | miotcd | openimages
        elif self.type == "person":
            coco = {"person"}
            voc = {"person"}
            obj365 = {"person"}
            miotcd = {"pedestrian"}
            openimages = {"person", "man", "woman", "boy", "girl"}
            visual_genome = {"person", "man", "young man", "old man", "woman", "young woman", "old woman", "child", "boy", "girl"}
                
            allowed_classes = coco | voc | obj365 | miotcd | openimages | visual_genome
        else:
            logger.error(f"Unknown type: {self.type}")
            return 0.0
        
        # keep only allowed classes in the probabilities
        filtered_probs = {}
        for key, value in probabilities.items():
            if key.lower() in allowed_classes:
                filtered_probs[key] = value
        
        return max(filtered_probs.values()) if filtered_probs else 0.0

    def _filter_classification(self):
        # TODO: Implémenter le filtre de classification
        return 1.0
    
    async def __process_stream(self, source_guid) -> AsyncGenerator[Tuple[dict, Optional[bytes]], None]:
        logger.info(f"Connecting to AI Service")
        async with ServiceAI() as forensic:
            logger.info(f"Connected to AI Service")

            logger.info(f"Connecting to VMS")
            async with CameraClient("192.168.20.72", 7778) as client:
                logger.info(f"Connected to VMS")

                # Vérifier si la caméra existe
                logger.info(f"Getting system info")
                system_info = await client.get_system_info()
                if source_guid not in system_info:
                    logger.info(f"GUID de caméra non trouvé: {source_guid}")
                    yield {"type": "error", "message": f"GUID de caméra non trouvé: {source_guid}"}, None
                    return
            
                logger.info(f"Starting replay")
                previous_boxes = []
                frame_count = 0
                
                # Vérifier l'annulation
                if self.cancel_event.is_set():
                    return
                
                async for img, time in client.start_replay(
                    source_guid, 
                    self.time_from, 
                    self.time_to
                ):
                    # Vérifier l'annulation
                    if self.cancel_event.is_set():
                        return
                    
                    logger.info(f"got a frame at {time}")
                    # Calculer la progression
                    progress = self._calculate_progress(time, self.time_from, self.time_to)
                    frame_count += 1
                    
                    # Envoyer une mise à jour de progression sans image
                    yield {"type": "progress", "progress": progress}, None

                    # Vérifier l'annulation avant analyse
                    if self.cancel_event.is_set():
                        return
                    
                    # Détecter les objets
                    detections = await forensic.detect(img)
                    logger.debug(f"Detections: {len(detections)}")

                    current_boxes = []
                    for detection in detections:
                        # Vérifier l'annulation pendant le traitement
                        if self.cancel_event.is_set():
                            return
                            
                        bbox = forensic.get_pixel_bbox(img, detection)
                        probabilities = detection["bbox"]["probabilities"]

                        score = self._filter(bbox, probabilities)
                        if score <= 0.01:
                            continue

                        current_boxes.append(bbox)

                        # Vérifier si la boîte est similaire à une boîte précédente
                        is_duplicate = False
                        for prev_box in previous_boxes:
                            iou = self.__calculate_iou(bbox, prev_box)
                            if iou > 0.2:  # Seuil plus élevé pour réduire les faux positifs
                                logger.debug(f"Ignoring duplicate detection with IoU: {iou}")
                                is_duplicate = True
                                break
                        if is_duplicate:
                            continue

                        # Créer les métadonnées
                        metadata = {
                            "type": "detection",
                            "progress": progress,
                            "camera": source_guid,
                            "score": score,
                            "timestamp": time.isoformat(),
                            "source": source_guid,
                        }
                        
                        # Extraire et encoder la vignette
                        thumbnail = forensic.get_thumbnail(img, detection, 1.1)
                        if thumbnail is None:
                            continue
                        
                        _, encoded_image = cv2.imencode('.jpg', thumbnail)
                        frame_bytes = encoded_image.tobytes()

                        # Renvoyer les métadonnées et la frame
                        yield metadata, frame_bytes
                        
                    # Mettre à jour les boîtes précédentes
                    previous_boxes = current_boxes
                
                # Si aucune image n'a été traitée
                if frame_count == 0:
                    logger.warning(f"Pas d'image à traiter pour: {source_guid}")
                    yield {"type": "warning", "message": f"Pas d'image à traiter pour la caméra: {source_guid}"}, None

    async def _execute(self) -> AsyncGenerator[Tuple[dict, Optional[bytes]], None]:
        logger.info(f"Processing Forensic job {self.job_id}")
        logger.info(f"Sources: {self.sources}")
        logger.info(f"Time range: {self.time_from} - {self.time_to}")
        
        if not self.sources:
            yield {"type": "error", "message": "Aucune source spécifiée"}, None
            return
        
        try:
            for source_guid in self.sources:
                # Vérifier annulation avant de démarrer une nouvelle source
                if self.cancel_event.is_set():
                    return
                    
                logger.info(f"Starting query for source: {source_guid}")
                
                # Indiquer le démarrage d'une nouvelle source
                yield {
                    "type": "info", 
                    "message": f"Traitement de la source: {source_guid}",
                    "source": source_guid
                }, None
                
                # Traiter cette source
                async for metadata, frame in self.__process_stream(source_guid):
                    # Vérifier l'annulation à chaque itération
                    if self.cancel_event.is_set():
                        return
                    
                    # Passer les résultats au générateur parent
                    yield metadata, frame
            
            # Envoyer une notification de succès final
            yield {
                "type": "completed", 
                "message": "Analyse terminée avec succès",
                "progress": 100
            }, None

        except Exception as e:
            error_message = f"Erreur lors du traitement du flux vidéo: {str(e)}"
            stacktrace = traceback.format_exc()
            logger.error(error_message)
            logger.error(stacktrace)
            
            yield {
                "type": "error", 
                "message": error_message, 
                "stacktrace": stacktrace,
                "progress": 100
            }, None
            
            raise