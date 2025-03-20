import logging
import traceback
import json
import time
import asyncio
import datetime
import uuid

from fastapi.websockets import WebSocketState
import numpy as np
import cv2
import redis
import os

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
file_handler = logging.FileHandler(f"/tmp/{__name__}.log")
file_handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))
logger.addHandler(file_handler)

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
        try:
            logger.info("Attempting to get Redis client")
            if self._redis is None:
                logger.info("Redis client not found, creating new Redis connection")
                self._redis = aioredis.Redis(connection_pool=redis_pool)
            else:
                logger.info("Returning existing Redis client")
            return self._redis
        except Exception as e:
            logger.info(f"Error while obtaining Redis client: {e}")
            raise
    
    async def add_result(self, result: JobResult) -> None:
        try:
            redis = await self._get_redis()
            logger.info("Obtained Redis connection successfully.")
        except Exception as e:
            logger.error(f"Error obtaining Redis connection: {e}")
            raise

        try:
            # Clés Redis pour cette tâche
            result_list_key = f"task:{result.job_id}:results"
            channel_name = f"task:{result.job_id}:updates"
            logger.info(f"Prepared Redis keys: {result_list_key} and {channel_name}.")
        except Exception as e:
            logger.error(f"Error preparing Redis keys: {e}")
            raise

        try:
            # Stocker les métadonnées du résultat (sans la frame)
            result_data = result.to_redis_message()
            await redis.lpush(result_list_key, json.dumps(result_data))
            await redis.ltrim(result_list_key, 0, self.max_results - 1)
            logger.info("Stored result metadata in Redis list successfully.")
        except Exception as e:
            logger.error(f"Error storing result metadata: {e}")
            raise

        try:
            # Publier le résultat sur le canal Redis
            await redis.publish(channel_name, json.dumps(result_data))
            logger.info("Published result data on Redis channel successfully.")
        except Exception as e:
            logger.error(f"Error publishing result data on Redis channel: {e}")
            raise

        if result.frame and result.frame_uuid:
            try:
                # Stocker la frame séparément
                frame_key = f"task:{result.job_id}:frame:{result.frame_uuid}"
                await redis.set(frame_key, result.frame, ex=3600)  # Expire après 1h
                logger.info("Stored frame data in Redis with expiration of 1 hour.")
            except Exception as e:
                logger.error(f"Error storing frame data: {e}")
                raise

            try:
                # Notifier que la frame a été stockée
                frame_notification = {
                    "job_id": result.job_id,
                    "frame_uuid": result.frame_uuid
                }
                await redis.publish(f"{channel_name}:frames", json.dumps(frame_notification))
                logger.info("Published frame notification on Redis channel frames successfully.")
            except Exception as e:
                logger.error(f"Error publishing frame notification: {e}")
                raise
    
    async def get_results(self, job_id: str, start: int = 0, end: int = -1) -> List[JobResult]:
        try:
            redis = await self._get_redis()
            logger.info("Obtained Redis connection successfully.")
        except Exception as e:
            logger.error("Error obtaining Redis connection", exc_info=True)
            raise

        try:
            result_list_key = f"task:{job_id}:results"
            logger.info(f"Prepared result_list_key: {result_list_key}.")
        except Exception as e:
            logger.error("Error preparing result_list_key", exc_info=True)
            raise

        try:
            results_json = await redis.lrange(result_list_key, start, end)
            logger.info("Retrieved results from Redis.")
        except Exception as e:
            logger.error("Error retrieving results from Redis", exc_info=True)
            raise

        results = []
        
        for result_json in results_json:
            try:
                message = json.loads(result_json)
                logger.info("Parsed JSON message successfully.")
            except Exception as e:
                logger.error("Error parsing JSON message", exc_info=True)
                continue

            try:
                result = await JobResult.from_redis_message(message, redis)
                logger.info("Created JobResult from message.")
                results.append(result)
            except Exception as e:
                logger.error("Error processing JobResult from message", exc_info=True)
                continue
            
        return results
    
    async def subscribe_to_results(self, job_id: str):
        """
        Souscrit aux mises à jour et yield des JobResult.
        """
        try:
            logger.info("Obtention du client Redis")
            redis = await self._get_redis()
        except Exception as e:
            logger.error(f"Erreur lors de l'obtention du client Redis: {e}")
            return

        try:
            logger.info("Création du pubsub Redis")
            pubsub = redis.pubsub()
        except Exception as e:
            logger.error(f"Erreur lors de la création du pubsub: {e}")
            return
        
        channel_name = f"task:{job_id}:updates"
        try:
            logger.info(f"Souscription au canal {channel_name}")
            await pubsub.subscribe(channel_name)
        except Exception as e:
            logger.error(f"Erreur lors de la souscription au canal {channel_name}: {e}")
            return

        logger.info("Souscription aux mises à jour de résultats")
        
        try:
            while True:
                try:
                    logger.info("Tentative de récupération d'un message")
                    message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
                    logger.info(f"Message récupéré: {message}")
                except Exception as e:
                    logger.error(f"Erreur lors de la récupération du message: {e}")
                    continue

                if message is None:
                    try:
                        task_status = TaskManager.get_job_status(job_id)
                        logger.info(f"Statut de la tâche {job_id}: {task_status}")
                    except Exception as e:
                        logger.error(f"Erreur lors de la récupération du statut de la tâche: {e}")
                        task_status = None

                    if task_status in [JobStatus.SUCCESS, JobStatus.FAILURE, JobStatus.REVOKED]:
                        for _ in range(5):
                            try:
                                message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
                                if message:
                                    logger.info(f"Message récupéré durant l'attente: {message}")
                                    break
                            except Exception as e:
                                logger.error(f"Erreur pendant l'attente du message: {e}")
                        if message is None:
                            logger.info("Aucun message supplémentaire, fin de la boucle")
                            break
                    continue
                
                try:
                    logger.info("Tentative de désérialisation du message")
                    update_data = json.loads(message["data"])
                    logger.info("Désérialisation réussie")
                except Exception as ex:
                    logger.error(f"Erreur lors de la désérialisation du message: {ex}")
                    continue

                try:
                    logger.info("Reconstitution du JobResult")
                    job_result = await JobResult.from_redis_message(update_data, redis_client=redis)
                    logger.info("JobResult reconstitué avec succès")
                except Exception as ex:
                    logger.error(f"Erreur lors de la reconstitution du JobResult: {ex}")
                    continue

                logger.info("Diffusion de la mise à jour")
                yield job_result
        
        except Exception as e:
            logger.error(f"Erreur lors de la souscription aux mises à jour de résultats: {e}")
            logger.error(traceback.format_exc())
        finally:
            try:
                logger.info(f"Désabonnement du canal {channel_name}")
                await pubsub.unsubscribe(channel_name)
            except Exception as e:
                logger.error(f"Erreur lors du désabonnement du canal {channel_name}: {e}")
        logger.info("Bye bye")

results_store = ResultsStore()

@celery_app.task(bind=True, name="task_manager.execute_job")
def execute_job(self, job_type: str, job_params: Dict[str, Any]):   
    job_id = self.request.id
    logger.info(f"Starting execute_job: job_type={job_type}, job_id={job_id}")
    
    # Publier l'état initial
    logger.info("Updating state to STARTED")
    self.update_state(state=JobStatus.STARTED.value)
    
    try:
        if job_type == "VehicleReplayJob":
            logger.info("Job type is VehicleReplayJob, creating cancel_event")
            cancel_event = asyncio.Event()
            job_params['job_id'] = job_id  # Transmettre l'ID de la tâche
            logger.info("Instantiating VehicleReplayJob")
            job = VehicleReplayJob(job_params, cancel_event=cancel_event)
        else:
            error_message = f"Type de job non reconnu: {job_type}"
            logger.error(error_message)
            raise ValueError(error_message)
        
        logger.info("Creating new asyncio event loop")
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        async def process_job_results():
            logger.info(f"Starting asynchronous processing of job results for job {job_id}")
            try:
                async for metadata, frame in job._execute():
                    logger.info(f"Processing update for job {job_id}: metadata={metadata}")
                    result = JobResult(
                        job_id=job_id,
                        metadata=metadata,
                        frame=frame
                    )
                    logger.info("Adding result to Redis")
                    await results_store.add_result(result)
                    
                    if cancel_event.is_set() or TaskManager.get_job_status(job_id) == JobStatus.REVOKED:
                        logger.info(f"Job {job_id} cancelled during execution")
                        raise TaskRevokedError()
            except asyncio.CancelledError:
                logger.info(f"Job {job_id} cancelled via asyncio.CancelledError")
                cancel_event.set()
                raise TaskRevokedError()
            
            # Notification finale
            logger.info(f"Sending final completion result for job {job_id}")
            final_result = JobResult(
                job_id=job_id,
                metadata={"type": "completed", "message": "Tâche terminée avec succès"},
                final=True
            )
            await results_store.add_result(final_result)
                
        logger.info("Running process_job_results in event loop")
        loop.run_until_complete(process_job_results())
        loop.close()
        
        logger.info(f"Job {job_id} executed successfully")
        return {"job_id": job_id, "status": JobStatus.SUCCESS.value}
    
    except TaskRevokedError:
        logger.info(f"Job {job_id} revoked")
        
        # Envoyer une notification d'annulation
        async def send_cancellation():
            logger.info(f"Sending cancellation notification for job {job_id}")
            result = JobResult(
                job_id=job_id,
                metadata={"type": "cancelled", "message": "Tâche annulée"},
                final=True
            )
            await results_store.add_result(result)
            
        asyncio.run(send_cancellation())
        return {"job_id": job_id, "status": JobStatus.REVOKED.value}
    
    except Exception as e:
        logger.error(f"Error in job {job_id}: {e}")
        logger.error(traceback.format_exc())
        
        async def send_error():
            logger.info(f"Sending error notification for job {job_id}")
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
        try:
            logger.info(f"Soumission d'un nouveau job de type {job_type}")
            try:
                logger.info("Appel de execute_job.apply_async")
                task = execute_job.apply_async(args=[job_type, job_params])
                logger.info(f"Job soumis avec succès, id: {task.id}")
            except Exception as e:
                logger.error(f"Erreur lors de l'appel de execute_job.apply_async: {e}")
                raise
            return task.id
        except Exception as e:
            logger.error(f"Erreur lors de la soumission du job: {e}")
            raise
    
    @staticmethod
    async def cancel_job(job_id: str) -> bool:
        logger.info(f"Tentative d'annulation du job {job_id}")
        try:
            logger.info("Revoking job using celery_app.control.revoke")
            await asyncio.to_thread(celery_app.control.revoke, job_id, terminate=True)
            logger.info(f"Job {job_id} revoked successfully")
        except Exception as rev_e:
            logger.error(f"Erreur lors de la révocation du job {job_id}: {rev_e}")
            return False
        
        try:
            logger.info("Sending cancellation notification to Redis")
            async def send_cancellation():
                try:
                    logger.info("Creating cancellation JobResult")
                    result = JobResult(
                        job_id=job_id,
                        metadata={"type": "cancelled", "message": "Tâche annulée manuellement"},
                        final=True
                    )
                    logger.info("Adding cancellation result to Redis")
                    await results_store.add_result(result)
                    logger.info("Cancellation result added successfully")
                except Exception as inner_e:
                    logger.error(f"Erreur lors de l'ajout du résultat d'annulation pour le job {job_id}: {inner_e}")
                    raise
                await send_cancellation()
                logger.info(f"Cancellation notification for job {job_id} sent successfully")
                return True
        except Exception as send_e:
            logger.error(f"Erreur lors de l'envoi de la notification d'annulation pour le job {job_id}: {send_e}")
            return False
    
    @staticmethod
    def get_job_status(job_id: str) -> JobStatus:
        try:
            logger.info(f"Obtaining AsyncResult for job_id: {job_id}")
            result = AsyncResult(job_id)
        except Exception as e:
            logger.error(f"Error creating AsyncResult for job_id {job_id}: {e}")
            return JobStatus.REVOKED

        try:
            if result.failed():
                logger.info(f"Job {job_id} has failed")
                return JobStatus.FAILURE
            elif result.successful():
                logger.info(f"Job {job_id} has succeeded")
                return JobStatus.SUCCESS
        except Exception as e:
            logger.error(f"Error checking job status for job_id {job_id}: {e}")
            return JobStatus.REVOKED

        try:
            logger.info(f"Job {job_id} state before conversion: {result.state}")
            state_str = result.state.upper()
            logger.info(f"Converted state for job {job_id}: {state_str}")
            return JobStatus[state_str]
        except KeyError:
            logger.warning(f"Unknown state for job {job_id}: {result.state}")
            return JobStatus.REVOKED
        except Exception as e:
            logger.error(f"Unexpected error while processing job status for job_id {job_id}: {e}")
            return JobStatus.REVOKED
    
    @staticmethod
    async def get_job_error(job_id: str) -> Tuple[Optional[str], Optional[str]]:
        try:
            logger.info("Creating AsyncResult for job %s", job_id)
            result = AsyncResult(job_id, app=celery_app)
        except Exception as e:
            logger.error("Failed to create AsyncResult for job %s: %s", job_id, e)
            return str(e), None
        
        try:
            logger.info("Checking if job %s failed", job_id)
            if result.failed():
                logger.info("Job %s failed. Attempting to retrieve error data from Redis", job_id)
                try:
                    logger.info("Calling results_store.get_results for job %s", job_id)
                    error_data = await results_store.get_results(job_id, 0, 0)
                    logger.info("Retrieved error data from Redis for job %s: %s", job_id, error_data)
                except Exception as e:
                    logger.error("Error retrieving results from Redis for job %s: %s", job_id, e)
                    error_data = None

                if error_data and len(error_data) > 0:
                    metadata = error_data[0].metadata
                    logger.info("Found error metadata for job %s", job_id)
                    return metadata.get("message"), metadata.get("stacktrace")
                
                logger.info("No error metadata found in Redis for job %s. Using Celery error result", job_id)
                return str(result.result), None
                
                logger.info("Job %s did not fail", job_id)
            return None, None
        except Exception as e:
            logger.error("Error processing job error details for job %s: %s", job_id, e)
            return str(e), None
    
    @staticmethod
    async def get_jobs() -> List[str]:
        all_tasks: Set[str] = set()
        try:
            logger.info("Starting retrieval of active tasks from Celery")
            try:
                inspect = celery_app.control.inspect()
                logger.info("Obtained inspect object from Celery: %s", inspect)
            except Exception as e:
                logger.error("Error while creating inspect object: %s", e)
                raise

            try:
                active_tasks = inspect.active() or {}
                logger.info("Active tasks retrieved: %s", active_tasks)
            except Exception as e:
                logger.error("Error while retrieving active tasks: %s", e)
                raise

            try:
                for tasks in active_tasks.values():
                    for task in tasks:
                        task_id = task.get('id')
                        logger.info("Adding active task id: %s", task_id)
                        all_tasks.add(task_id)
            except Exception as e:
                logger.error("Error while iterating over active tasks: %s", e)
                raise
        except Exception as e:
            logger.error("Erreur lors de la récupération des tâches actives: %s", e)

        try:
            logger.info("Connecting to Redis to retrieve completed tasks")
            redis_client = aioredis.Redis(connection_pool=redis_pool)
            logger.info("Connected to Redis")
            try:
                keys = await redis_client.keys("task:*:results")
                logger.info("Keys retrieved from Redis: %s", keys)
            except Exception as e:
                logger.error("Erreur lors de la récupération des clés Redis: %s", e)
                keys = []
            try:
                for key in keys:
                    try:
                        key_str = key.decode('utf-8') if isinstance(key, bytes) else str(key)
                        logger.info("Processing Redis key: %s", key_str)
                        parts = key_str.split(':')
                        if len(parts) >= 2:
                            logger.info("Adding task id from key: %s", parts[1])
                            all_tasks.add(parts[1])
                    except Exception as e:
                        logger.error("Error processing key %s: %s", key, e)
            except Exception as e:
                logger.error("Error iterating over Redis keys: %s", e)
            try:
                await redis_client.close()
                logger.info("Redis connection closed successfully")
            except Exception as e:
                logger.error("Error closing Redis connection: %s", e)
        except Exception as e:
            logger.error("Erreur lors de la récupération des tâches depuis Redis: %s", e)

        logger.info("Total tasks collected: %s", all_tasks)
        return list(all_tasks)
    
    @staticmethod
    async def get_job_results(job_id: str) -> List[JobResult]:
        return await results_store.get_results(job_id)
    
    @staticmethod
    async def stream_job_results(websocket: WebSocket, job_id: str, send_old_results: bool = True):
        """
        Diffuse les résultats d'une tâche vers un WebSocket.
        Envoie l'historique des résultats puis s'abonne aux mises à jour.
        """
        try:

            logger.info(f"Client WebSocket connecté pour le job {job_id}")

            # Envoyer les résultats précédents
            if send_old_results:
                logger.info(f"Envoi des résultats précédents pour le job {job_id}")
                previous_results = await results_store.get_results(job_id)
                logger.info(f"Résultats précédents récupérés pour le job {job_id}")
                for result in previous_results:
                    if websocket.client_state == WebSocketState.DISCONNECTED:
                        logger.info(f"Client WebSocket déconnecté pour le job {job_id}")
                        break
                    
                    if result.metadata:
                        logger.info(f"Envoi des métadonnées pour le job {job_id}")
                        await websocket.send_json(result.metadata)
                    if result.frame:
                        logger.info(f"Envoi de la frame pour le job {job_id}")
                        await websocket.send_bytes(result.frame)
                logger.info(f"Envoi des résultats précédents terminé pour le job {job_id}")

            # S'abonner aux nouvelles mises à jour
            logger.info(f"Souscription aux mises à jour pour le job {job_id}")
            async for update in results_store.subscribe_to_results(job_id):
                logger.info(f"Envoi de la mise à jour pour le job {job_id}")
                if websocket.client_state == WebSocketState.DISCONNECTED:
                    logger.info(f"Client WebSocket déconnecté pour le job {job_id}")
                    break
 
                if update.metadata:
                    logger.info(f"Envoi des métadonnées pour le job {job_id}")
                    await websocket.send_json(update.metadata)
                if update.frame:
                    logger.info(f"Envoi de la frame pour le job {job_id}")
                    await websocket.send_bytes(update.frame)
                
                if update.final:
                    logger.info(f"Fin de la diffusion pour le job {job_id}")
                    break
            
            logger.info(f"Fin de la diffusion pour le job {job_id}")
                           
        except WebSocketDisconnect:
            logger.info(f"Client WebSocket déconnecté pour le job {job_id}")
        except Exception as e:
            logger.error(f"Erreur lors du streaming des résultats pour le job {job_id}: {e}")
            logger.error(traceback.format_exc())
            
            # Essayer d'envoyer un message d'erreur si le websocket est encore connecté
            try:
                if websocket.client_state != WebSocketState.DISCONNECTED:
                    logger.info(f"Envoi d'un message d'erreur pour le job {job_id}")
                    await websocket.send_json({
                        "type": "error",
                        "message": f"Erreur de streaming: {str(e)}"
                    })
            except:
                logger.info(f"Erreur lors de l'envoi du message d'erreur pour le job {job_id}")
        finally:
            logger.info(f"Finally {job_id}")
        logger.info("bye")

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
        self.appearances = data.get("appearances", None)
        self.attributes = data.get("attributes", None)
        self.context = data.get("context", None)
        
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
        try:
            logger.info("Calculating total_duration")
            total_duration = (to_time - from_time).total_seconds()
            logger.info(f"Total duration: {total_duration} seconds")

            if total_duration <= 0:
                logger.error(f"Invalid time range: {from_time} - {to_time}")
                return 100.0

            logger.info("Calculating elapsed time")
            elapsed = (current - from_time).total_seconds()
            logger.info(f"Elapsed time: {elapsed} seconds")

            logger.info("Calculating progress percentage")
            progress = min(100.0, max(0.0, (elapsed / total_duration) * 100.0))
            logger.info(f"Computed progress: {progress}%")
            return progress

        except Exception as e:
            logger.error(f"Error in _calculate_progress: {e}")
            return 100.0
    
    def __calculate_iou(self, box1, box2):
        try:
            logger.info("Unpacking box1 and box2")
            top1, bottom1, left1, right1 = box1
            top2, bottom2, left2, right2 = box2
        except Exception as e:
            logger.error(f"Error unpacking boxes: {e}")
            return 0.0

        try:
            logger.info("Calculating intersection coordinates")
            x_left = max(left1, left2)
            y_top = max(top1, top2)
            x_right = min(right1, right2)
            y_bottom = min(bottom1, bottom2)
        except Exception as e:
            logger.error(f"Error calculating intersection coordinates: {e}")
            return 0.0

        try:
            logger.info("Checking if boxes intersect")
            if x_right < x_left or y_bottom < y_top:
                logger.info("No intersection found")
                return 0.0
        except Exception as e:
            logger.error(f"Error checking intersection condition: {e}")
            return 0.0

        try:
            logger.info("Calculating intersection area")
            intersection_area = (x_right - x_left) * (y_bottom - y_top)
        except Exception as e:
            logger.error(f"Error calculating intersection area: {e}")
            return 0.0

        try:
            logger.info("Calculating areas of box1 and box2")
            box1_area = (right1 - left1) * (bottom1 - top1)
            box2_area = (right2 - left2) * (bottom2 - top2)
        except Exception as e:
            logger.error(f"Error calculating box areas: {e}")
            return 0.0

        try:
            logger.info("Calculating union area")
            union_area = box1_area + box2_area - intersection_area
            if union_area <= 0:
                logger.info("Union area is zero or negative")
                return 0.0
        except Exception as e:
            logger.error(f"Error calculating union area: {e}")
            return 0.0

        try:
            logger.info("Calculating IoU")
            iou = intersection_area / union_area
        except Exception as e:
            logger.error(f"Error calculating IoU: {e}")
            return 0.0

        logger.info("Returning IoU value")
        return iou
    
    def _filter_detections(self, bbox, probabilities: Dict[str, float]):
        size = self._filter_detections_size(bbox)
        detector = self._filter_detections_classes(probabilities)
        return size * detector
    
    def _filter_detections_size(self, bbox):
        top, bottom, left, right = bbox

        min_size = 32 # below this size, the object is too small and the model is not reliable
        max_size = 64 # trained model size

        width = right - left
        height = bottom - top
        min_dim = min(width, height)

        if min_dim < min_size:
            return 0.0

        # lerp based on min_dim between min_size and max_size
        return max(0.0, min(1.0, (min_dim - min_size) / (max_size - min_size)))
    
    def _filter_detections_classes(self, probabilities: Dict[str, float]):
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

    def _filter_classification(self, probabilities: Dict[str, float], appearances: Dict[str, Dict[str,float]], attributes: Dict[str, Dict[str,float]]):
        appearance = self._filter_classification_appearance(probabilities, appearances)
        attributes = self._filter_classification_attributes(probabilities, attributes)
        return appearance * attributes
    
    def _filter_classification_appearance(self, probabilities: Dict[str, float], appearances: Dict[str, Dict[str,float]]):
        try:
            confidence = self.appearances.get("confidence", "medium")
            # high, topconf = wanted stuff, otherwise 0.
            # medium, topconf = wanted or nearby, otherwise 0.
            # low, return max(wanted, nearby).

            # maybe the type is available also in probabilities given classes ? 
            type_score = 1.0
            wanted_type = self.appearances.get("type", [])
            if len(wanted_type) > 0:
                type_score = 0.0
                for t in wanted_type:
                    type_score = max(type_score, appearances.get("type", {}).get(t, 1.0))
            
            color_score = 1.0
            wanted_color = self.appearances.get("color", [])
            if len(wanted_color) > 0:
                color_score = 0.0
                for c in wanted_color:
                    color_score = max(color_score, appearances.get("color", {}).get(c, 1.0))

            logger.info(f"config: {self.appearances} - found: {appearances} - wanted {wanted_type} -> {type_score} - score: {wanted_color} -> {color_score}")
            return type_score * color_score
        
        except Exception as e:
            logger.error(f"Error in appearance filter: {e}")
            return 1.0
    
    def _filter_classification_attributes(self, probabilities: Dict[str, float], attributes: Dict[str, Dict[str,float]]):
        return 1.0
    
    async def __process_stream(self, source_guid) -> AsyncGenerator[Tuple[dict, Optional[bytes]], None]:
        try:
            logger.info("Step 1: Connecting to AI Service")
            async with ServiceAI() as forensic:
                logger.info("Connected to AI Service")

                logger.info("Step 2: Connecting to VMS")
                async with CameraClient("192.168.20.72", 7778) as client:
                    logger.info("Connected to VMS")

                    logger.info("Step 3: Getting system info")
                    system_info = await client.get_system_info()
                    if source_guid not in system_info:
                        logger.info(f"GUID de caméra non trouvé: {source_guid}")
                        yield {"type": "error", "message": f"GUID de caméra non trouvé: {source_guid}"}, None
                        return

                    logger.info("Step 4: Starting replay")
                    previous_boxes = []
                    frame_count = 0
                    
                    if self.cancel_event.is_set():
                        return
                    
                    async for img, time in client.start_replay(
                        source_guid, 
                        self.time_from, 
                        self.time_to
                    ):
                        if self.cancel_event.is_set():
                            return
                        
                        logger.info(f"Received a frame at {time}")
                        progress = self._calculate_progress(time, self.time_from, self.time_to)
                        frame_count += 1
                        
                        logger.info("Yielding progress update")
                        yield {"type": "progress", "progress": progress}, None
                        
                        logger.info("Step 5: Detecting objects")
                        detections = await forensic.detect(img)
                        logger.info(f"Detections count: {len(detections)}")

                        current_boxes = []
                        for detection in detections:
                            if self.cancel_event.is_set():
                                return
                            
                            bbox = forensic.get_pixel_bbox(img, detection)
                            probabilities = detection["bbox"]["probabilities"]

                            obj_score = self._filter_detections(bbox, probabilities)
                            if obj_score <= 0.01:
                                continue

                            current_boxes.append(bbox)

                            is_duplicate = False
                            for prev_box in previous_boxes:
                                iou = self.__calculate_iou(bbox, prev_box)
                                if iou > 0.2:  # Seuil pour réduire les faux positifs
                                    logger.info(f"Ignoring duplicate detection with IoU: {iou}")
                                    is_duplicate = True
                                    break
                            if is_duplicate:
                                continue

                            thumbnail = forensic.get_thumbnail(img, detection)
                            if thumbnail is None:
                                continue
                            
                            logger.info("Step 6: Classifying thumbnail")
                            attributes = await forensic.classify(thumbnail)
                            cls_score = self._filter_classification(probabilities, attributes, attributes)
                            if cls_score <= 0.01:
                                continue

                            metadata = {
                                "type": "detection",
                                "progress": progress,
                                "camera": source_guid,
                                "score": obj_score * cls_score,
                                "timestamp": time.isoformat(),
                                "source": source_guid,
                                "attributes": attributes
                            }
                            export = forensic.get_thumbnail(img, detection, 1.1)
                            if export is None:
                                continue
                            
                            _, encoded_image = cv2.imencode('.jpg', export)
                            frame_bytes = encoded_image.tobytes()

                            logger.info("Step 7: Saving thumbnail to disk")
                            path = "/var/lib/postgresql/16/main"
                            name = f"{source_guid}:{time.strftime('%Y-%m-%dT%H:%M')}"
                            os.makedirs(f"{path}/thumbnail/", exist_ok=True)
                            cv2.imwrite(f"{path}/thumbnail/{name}.jpg", thumbnail)

                            yield metadata, frame_bytes
                            
                        logger.info("Updating previous boxes for the next frame")
                        previous_boxes = current_boxes
                    
                    if frame_count == 0:
                        logger.info(f"No image processed for camera: {source_guid}")
                        yield {"type": "warning", "message": f"Pas d'image à traiter pour la caméra: {source_guid}"}, None
        except Exception as ex:
            logger.error(f"Exception in __process_stream: {ex}")
            yield {"type": "error", "message": f"Exception in stream processing: {ex}"}, None
        
        logger.info("Stream processing completed")

    async def _execute(self) -> AsyncGenerator[Tuple[dict, Optional[bytes]], None]:
        logger.info(f"Processing Forensic job {self.job_id}")
        logger.info(f"Sources: {self.sources}")
        logger.info(f"Time range: {self.time_from} - {self.time_to}")
        
        if not self.sources:
            logger.info("No sources provided, yielding error result")
            yield {"type": "error", "message": "Aucune source spécifiée"}, None
            return
        
        try:
            logger.info("Beginning processing of all sources")
            # TODO: await asyncio.gather() pour traiter plusieurs flux en parallèle
            for source_guid in self.sources:
                if self.cancel_event.is_set():
                    logger.info(f"Cancellation flagged before processing source: {source_guid}")
                    return
                    
                logger.info(f"Starting query for source: {source_guid}")
                async for metadata, frame in self.__process_stream(source_guid):
                    if self.cancel_event.is_set():
                        logger.info(f"Cancellation flagged during processing source: {source_guid}")
                        return
                    
                    logger.info(f"Yielding update from source: {source_guid} with metadata: {metadata}")
                    yield metadata, frame
            
            logger.info("All sources processed, yielding final completion result")
            yield {
                "type": "completed", 
                "message": "Analyse terminée avec succès",
                "progress": 100
            }, None

        except Exception as e:
            error_message = f"Erreur lors du traitement du flux vidéo: {str(e)}"
            stacktrace = traceback.format_exc()
            logger.error("An exception occurred during _execute processing")
            logger.error(error_message)
            logger.error(stacktrace)
            
            logger.info("Yielding error result due to exception")
            yield {
                "type": "error", 
                "message": error_message, 
                "stacktrace": stacktrace,
                "progress": 100
            }, None
            
            raise