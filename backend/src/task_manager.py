import logging
import traceback
import json
import time
import asyncio
import datetime
import uuid
from aiostream import stream
from functools import wraps
from dotenv import load_dotenv
from celery.worker.state import total_count
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

from database import GenericDAL, Settings
from service_ai import ServiceAI
from vms import CameraClient, GenetecCameraClient, MilestoneCameraClient

load_dotenv()
FORENSIC_PAGINATION_ITEMS = int(os.getenv("FORENSIC_PAGINATION_ITEMS", "12"))

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
logger.addHandler(logging.StreamHandler())
file_handler = logging.FileHandler(f"/tmp/{__name__}.log")
file_handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))
logger.addHandler(file_handler)

celery_app = Celery(
    'forensic_tasks',
    broker=f'redis://{os.getenv("DB_HOST", "localhost")}:6379/0',
    backend=f'redis://{os.getenv("DB_HOST", "localhost")}:6379/0'
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
    worker_concurrency=4,               # Nombre de worker en parallel
    task_acks_late=True,                # Confirmer la tâche uniquement après exécution
    task_reject_on_worker_lost=True     # Rejeter les tâches si le worker s'arrête
)

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

class Redis:
    def __init__(self, db: int = 1):
        self.host = os.getenv("DB_HOST", "localhost")
        self.db = db
        self._redis = None

    async def __aenter__(self):
        self._redis = await aioredis.Redis.from_url(f'redis://{self.host}:6379/{self.db}')
        return self._redis

    async def __aexit__(self, exc_type, exc_value, traceback):
        if self._redis:
            await self._redis.close()
    
    def __enter__(self):
        self._redis = redis.Redis(host=self.host, port=6379, db=self.db)
        return self._redis

    def __exit__(self, exc_type, exc_value, traceback):
        if self._redis:
            self._redis.close()


class ResultsStore:
    def __init__(self, max_results: int = 5000):
        self.max_results = max_results
        self.__host = os.getenv("DB_HOST", "localhost")
        self.__redis = None
        self.__pool = None

    async def __get_redis(self) -> aioredis.Redis:
        if self.__pool is None:
            self.__pool = aioredis.ConnectionPool.from_url('redis://{self.__host}:6379/1')
        if self.__redis is None:
            self.__redis = aioredis.Redis(connection_pool=self.__pool)
        return self.__redis

    async def get_sorted_results(self, job_id: str, sort_by: str = "date", desc: bool = True, start: int = 0, end: int = -1) -> List[JobResult]:
        """
        Récupère tous les résultats d'un job et les trie selon le critère spécifié.

        Args:
            job_id: Identifiant du job
            sort_by: Critère de tri ('date' ou 'score')
            desc: Ordre décroissant si True, croissant si False
            start: Index de début
            end: Index de fin

        Returns:
            Liste triée des résultats
        """
        # Récupération de tous les résultats
        results = await self.get_results(job_id)

        # Tri selon le critère spécifié
        if sort_by == "score" and results:
            # Vérifier que le score est présent dans les métadonnées
            results = sorted(
                results,
                key=lambda x: float(x.metadata.get('score', 0)),
                reverse=desc
            )
        elif sort_by == "date" and results:
            # Tri par timestamp dans les métadonnées
            results = sorted(
                results,
                key=lambda x: x.metadata.get('timestamp', ''),
                reverse=desc
            )

        # Application de la pagination après le tri
        if end == -1:
            end = len(results)
        return results[start:end+1]

    async def get_frame(self, job_id: str, frame_uuid: str) -> Optional[bytes]:
        redis = await self.__get_redis()
        frame_key = f"task:{job_id}:frame:{frame_uuid}"
        return await redis.get(frame_key)

    async def add_result(self, result: JobResult) -> None:
        redis = await self.__get_redis()

        # Clés Redis pour cette tâche
        result_list_key = f"task:{result.job_id}:results"
        channel_name = f"task:{result.job_id}:updates"

        # Stocker les métadonnées du résultat (sans la frame)
        result_data = result.to_redis_message()

        # Publier le résultat sur le canal Redis
        await redis.publish(channel_name, json.dumps(result_data))

        if result.frame_uuid:
            await redis.lpush(result_list_key, json.dumps(result_data))
            await redis.ltrim(result_list_key, 0, self.max_results - 1)

        if result.frame and result.frame_uuid:
            # Stocker la frame séparément
            frame_key = f"task:{result.job_id}:frame:{result.frame_uuid}"
            await redis.set(frame_key, result.frame, ex=3600)  # Expire après 1h

            # Notifier que la frame a été stockée
            frame_notification = {
                "job_id": result.job_id,
                "frame_uuid": result.frame_uuid
            }
            await redis.publish(f"{channel_name}:frames", json.dumps(frame_notification))

    async def get_results(self, job_id: str, start: int = 0, end: int = -1) -> List[JobResult]:
        redis = await self.__get_redis()

        result_list_key = f"task:{job_id}:results"

        results_json = await redis.lrange(result_list_key, start, end)
        results = []
        
        for result_json in results_json:
            try:
                message = json.loads(result_json)
                logger.info("Parsed JSON message successfully.")
            except Exception as e:
                logger.error("Error parsing JSON message", exc_info=True)
                continue

            result = await JobResult.from_redis_message(message, redis)
            results.append(result)
            
        return results
    
    async def subscribe_to_results(self, job_id: str):
        redis = await self.__get_redis()
        pubsub = redis.pubsub()
        
        channel_name = f"task:{job_id}:updates"
        await pubsub.subscribe(channel_name)
        logger.info("Souscription aux mises à jour de résultats")

        try:
            while True:
                message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)

                if message is None:
                    task_status = TaskManager.get_job_status(job_id)
                    if task_status in [JobStatus.SUCCESS, JobStatus.FAILURE, JobStatus.REVOKED]:
                        for _ in range(5):
                            message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
                            if message:
                                break

                        if message is None:
                            break
                    continue
                
                try:
                    update_data = json.loads(message["data"])
                except Exception as ex:
                    logger.error(f"Erreur lors de la désérialisation du message: {ex}")
                    continue

                job_result = await JobResult.from_redis_message(update_data, redis_client=redis)
                yield job_result
        
        except Exception as e:
            logger.error(f"Erreur lors de la souscription aux mises à jour de résultats: {e}")
            logger.error(traceback.format_exc())
        finally:
            await pubsub.unsubscribe(channel_name)

results_store = ResultsStore()

def run_async(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

        if loop.is_running():
            raise RuntimeError(
                "Attempted to call an async function from a sync function while an event loop is running. "
                "This can lead to deadlocks. Consider restructuring your code to use async throughout, "
                "or use a separate thread for this operation."
            )
        else:
            return loop.run_until_complete(func(*args, **kwargs))
    return wrapper

@celery_app.task(bind=True, name="task_manager.execute_job")
def execute_job(self, job_type: str, job_params: Dict[str, Any]):
    job_id = self.request.id
    logger.info(f"Starting execute_job: job_type={job_type}, job_id={job_id}")
    
    self.update_state(state=JobStatus.STARTED.value)
    
    async def execute_async():
        try:
            if job_type == "VehicleReplayJob" or job_type == "PersonReplayJob" or job_type == "MobilityReplayJob":
                cancel_event = asyncio.Event()
                job_params['job_id'] = job_id
                job = VehicleReplayJob(job_params, cancel_event=cancel_event)
            else:
                raise ValueError(f"Type de job non reconnu: {job_type}")
            
            async for metadata, frame in job._execute():
                result = JobResult(job_id=job_id, metadata=metadata, frame=frame)
                await results_store.add_result(result)
                
            final_result = JobResult(
                job_id=job_id,
                metadata={"type": "completed", "message": "Tâche terminée avec succès"},
                final=True
            )
            await results_store.add_result(final_result)
            return {"job_id": job_id, "status": JobStatus.SUCCESS.value}
            
        except TaskRevokedError:
            cancel_result = JobResult(
                job_id=job_id,
                metadata={"type": "cancelled", "message": "Tâche annulée"},
                final=True
            )
            await results_store.add_result(cancel_result)
            return {"job_id": job_id, "status": JobStatus.REVOKED.value}
            
        except Exception as e:
            logger.error(f"Erreur lors de l'exécution de la tâche: {traceback.format_exc()}")
            error_result = JobResult(
                job_id=job_id,
                metadata={
                    "type": "error",
                    "message": f"Erreur: {str(e)}",
                    "stacktrace": traceback.format_exc()
                },
                final=True
            )
            await results_store.add_result(error_result)
            return {"job_id": job_id, "status": JobStatus.FAILURE.value, "error": str(e)}
    
    res = run_async(execute_async)()
    logger.info(f"Task completed {res}")
    return res

class TaskManager:
    """Gestionnaire de tâches façade pour les opérations Celery/Redis"""

    @staticmethod
    async def get_sorted_results(job_id: str, sort_by: str = "date", desc: bool = True, start: int = 0, end: int = -1) -> List[JobResult]:
        """
        Récupère les résultats d'une tâche triés par date ou score.

        Args:
            job_id: Identifiant du job
            sort_by: Critère de tri ('date' ou 'score')
            desc: Ordre décroissant si True, croissant si False
            start: Index de début
            end: Index de fin

        Returns:
            Liste des résultats triés
        """
        return await results_store.get_sorted_results(job_id, sort_by, desc, start, end)
    
    @staticmethod
    def submit_job(job_type: str, job_params: Dict[str, Any]) -> str:
        try:
            task = execute_job.apply_async(args=[job_type, job_params])
            job_id = task.id

            with Redis(db=1) as redis_sync:
                job_key = f"task:{job_id}"
                created_at = datetime.datetime.now(datetime.timezone.utc).isoformat()

                redis_sync.hset(job_key, "created_at", created_at)
                redis_sync.hset(job_key, "job_type", job_type)

            return job_id

        except Exception as e:
            logger.error(f"Erreur lors de la soumission du job: {e}")
            raise
    
    @staticmethod
    async def cancel_job(job_id: str) -> bool:
        logger.info(f"Tentative d'annulation du job {job_id}")
        try:
            await asyncio.to_thread(celery_app.control.revoke, job_id, terminate=True)
        except Exception as rev_e:
            logger.error(f"Erreur lors de la révocation du job {job_id}: {rev_e}")
            return False
        
        try:
            logger.info("Sending cancellation notification to Redis")
            result = JobResult(
                job_id=job_id,
                metadata={"type": "cancelled", "message": "Tâche annulée manuellement"},
                final=True
            )
            await results_store.add_result(result)
            return True
        except Exception as send_e:
            logger.error(f"Erreur lors de l'envoi de la notification d'annulation pour le job {job_id}: {send_e}")
            return False

    @staticmethod
    def get_job_created(job_id: str) -> Optional[datetime.datetime]:
        try:
            with Redis(db=1) as redis_client:
                job_key = f"task:{job_id}"
                created_at = redis_client.hget(job_key, "created_at")
                if created_at:
                    return datetime.datetime.fromisoformat(created_at.decode('utf-8'))
            return None
        except Exception as e:
            logger.error(f"Erreur lors de la récupération de la date de création du job {job_id}: {e}")
            return None
        
    @staticmethod
    def get_job_total_pages(job_id: str) -> Optional[int]:
        try:
            with Redis(db=1) as redis_client:
                result_list_key = f"task:{job_id}:results"
                count = redis_client.llen(result_list_key)
                
                page_size = FORENSIC_PAGINATION_ITEMS
                total = (count + page_size - 1) // page_size if count > 0 else 0
                return total
        except Exception as e:
            logger.error(f"Erreur lors de la récupération du nombre total de pages pour le job {job_id}: {e}")
            return None

    @staticmethod
    def get_job_type(job_id: str) -> Optional[str]:
        try:
            with Redis(db=1) as redis_client:
                job_key = f"task:{job_id}"
                job_type = redis_client.hget(job_key, "job_type")

                if job_type:
                    return job_type.decode('utf-8')

            results = run_async(results_store.get_results)(job_id)
            if results:
                for result in results:
                    if "type" in result.metadata:
                        if result.metadata.get("type") == "person":
                            return "PersonReplayJob"
                        else:
                            return "VehicleReplayJob"

            return "UnknownJobType"
        except Exception as e:
            logger.error(f"Erreur lors de la récupération du type du job {job_id}: {e}")
            return None

    @staticmethod
    def get_job_count(job_id: str) -> Optional[int]:
        try:
            # Connexion à Redis pour récupérer les données
            with Redis(db=1) as redis_client:
                result_list_key = f"task:{job_id}:results"

                # Compter le nombre de résultats dans la liste
                count = redis_client.llen(result_list_key)

                # Si un compte existe déjà dans les métadonnées du job, le retourner
                job_key = f"task:{job_id}"
                stored_count = redis_client.hget(job_key, "job_count")

                if stored_count:
                    return int(stored_count.decode('utf-8'))

                # Sinon retourner le nombre de résultats dans la liste
                return int(count) if count > 0 else 0

        except Exception as e:
            logger.error(f"Erreur lors de la récupération du nombre de résultats du job {job_id}: {e}")
            logger.error(traceback.format_exc())
            return None

    @staticmethod
    def get_job_size(job_id: str) -> Optional[int]:
        try:
            # Connexion à Redis pour récupérer les données
            with Redis(db=1) as redis_client:
                result_list_key = f"task:{job_id}:results"

                # Récupérer le nombre de résultats
                nb_results = redis_client.llen(result_list_key)

                # Estimer la taille des métadonnées (approximation)
                metadata_size = 0
                results_json = redis_client.lrange(result_list_key, 0, min(5, nb_results-1))
                if results_json:
                    # Calculer la taille moyenne des métadonnées sur les premiers résultats
                    avg_size = sum(len(r) for r in results_json) / len(results_json)
                    metadata_size = int(avg_size * nb_results)

                # Estimer la taille des frames (en supposant une taille moyenne de 50Ko par frame)
                frame_pattern = f"task:{job_id}:frame:*"
                frame_keys = redis_client.keys(frame_pattern)
                frame_size = 0

                if frame_keys:
                    # Échantillonner quelques frames pour obtenir une taille moyenne
                    sample_size = min(5, len(frame_keys))
                    sample_keys = frame_keys[:sample_size]
                    sample_frames = [redis_client.get(key) for key in sample_keys]
                    avg_frame_size = sum(len(frame) if frame else 0 for frame in sample_frames) / sample_size
                    frame_size = int(avg_frame_size * len(frame_keys))

                # Taille totale estimée en kilooctets
                total_size_kb = (metadata_size + frame_size) // 1024

                return total_size_kb if total_size_kb > 0 else 1  # Retourner au moins 1Ko

        except Exception as e:
            logger.error(f"Erreur lors de la récupération de la taille du job {job_id}: {e}")
            logger.error(traceback.format_exc())
            return None

    @staticmethod
    def get_job_updated(job_id: str) -> Optional[datetime.datetime]:
        try:
            # Essayer d'abord de récupérer via Celery qui a l'information la plus précise
            task_result = AsyncResult(job_id)
            if hasattr(task_result, 'date_done') and task_result.date_done:
                return task_result.date_done

            # Si pas trouvé dans Celery, vérifier Redis pour les derniers résultats
            with Redis(db=1) as redis_client:
                result_list_key = f"task:{job_id}:results"

                # Récupérer le dernier résultat de la liste (le plus récent)
                last_result = redis_client.lindex(result_list_key, 0)

                if last_result:
                    try:
                        result_data = json.loads(last_result)
                        if "metadata" in result_data and "timestamp" in result_data["metadata"]:
                            return datetime.datetime.fromisoformat(result_data["metadata"]["timestamp"])
                    except (json.JSONDecodeError, ValueError):
                        pass

                # Sinon, utiliser la date de création comme fallback
                created_at = TaskManager.get_job_created(job_id)
                if created_at:
                    return created_at

                return datetime.datetime.now(datetime.timezone.utc)

        except Exception as e:
            logger.error(f"Erreur lors de la récupération de la date de mise à jour du job {job_id}: {e}")
            logger.error(traceback.format_exc())
            return None

    @staticmethod
    def get_job_status(job_id: str) -> JobStatus:
        try:
            result = AsyncResult(job_id)
        except Exception as e:
            logger.error(f"Error creating AsyncResult for job_id {job_id}: {e}")
            return JobStatus.REVOKED

        try:
            if result.failed():
                return JobStatus.FAILURE
            elif result.successful():
                return JobStatus.SUCCESS
        except Exception as e:
            logger.error(f"Error checking job status for job_id {job_id}: {e}")
            return JobStatus.REVOKED

        try:
            state_str = result.state.upper()
            return JobStatus[state_str]
        except KeyError:
            logger.warning(f"Unknown state for job {job_id}: {result.state}")
            return JobStatus.REVOKED
        except Exception as e:
            logger.error(f"Unexpected error while processing job status for job_id {job_id}: {e}")
            return JobStatus.REVOKED

    @staticmethod
    async def delete_task_data(job_id: str) -> dict:
        """
        Supprime toutes les données Redis associées à une tâche dans les bases 0 et 1.
        Retourne un dictionnaire avec le statut de l'opération.
        Lève une ValueError si aucune tâche n'est trouvée avec cet ID.
        """

        try:
            # Clés à supprimer dans DB1
            async with Redis(db=1) as redis_db1:
                job_key = f"task:{job_id}"
                result_list_key = f"task:{job_id}:results"

                # Vérifier si au moins une des clés existe dans DB1
                exists = await redis_db1.exists(job_key)
                results_exist = await redis_db1.exists(result_list_key)

                if not exists and not results_exist:
                    raise ValueError(f"Aucune tâche trouvée avec l'ID {job_id}")

                # Supprimer les métadonnées et résultats dans DB1
                await redis_db1.delete(job_key)
                await redis_db1.delete(result_list_key)

                # Supprimer toutes les frames associées dans DB1
                frame_pattern = f"task:{job_id}:frame:*"
                frame_keys = await redis_db1.keys(frame_pattern)
                if frame_keys:
                    await redis_db1.delete(*frame_keys)

                # Supprimer directement les clés Celery dans DB0
                async with Redis(db=0) as redis_db0:
                    celery_meta_key = f"celery-task-meta-{job_id}"
                    await redis_db0.delete(celery_meta_key)

                return {"success": True, "message": f"Tâche {job_id} supprimée avec succès"}
        except Exception as e:
            logger.error(f"Erreur lors de la suppression des données de la tâche {job_id}: {e}")
            return {"success": False, "message": str(e)}

    @staticmethod
    async def delete_all_task_data() -> dict:
        """
        Supprime toutes les données Redis associées à toutes les tâches dans les bases 0 et 1.
        Retourne un dictionnaire avec le statut de l'opération.
        """
        deleted_keys = 0
        deleted_tasks = 0

        try:
            async with Redis(db=1) as redis_db1:
                # Utiliser scan au lieu de keys pour éviter de bloquer Redis
                cursor = "0"
                task_ids = set()

                # Étape 1: Identifier toutes les tâches
                while cursor != 0:
                    cursor, keys = await redis_db1.scan(cursor=cursor, match="task:*:results", count=1000)
                    cursor = int(cursor)

                    for key in keys:
                        key_str = key.decode('utf-8') if isinstance(key, bytes) else key
                        parts = key_str.split(':')
                        if len(parts) >= 3 and parts[0] == 'task' and len(parts[1]) > 0:
                            task_ids.add(parts[1])

                logger.info(f"Suppression de {len(task_ids)} tâches identifiées")

                # Étape 2: Supprimer toutes les données associées aux tâches
                for task_id in task_ids:
                    # Supprimer les résultats de la tâche
                    deleted = await redis_db1.delete(f"task:{task_id}:results")
                    if deleted > 0:
                        deleted_keys += deleted

                    # Supprimer les frames associées
                    cursor_frames = "0"
                    while cursor_frames != 0:
                        cursor_frames, frame_keys = await redis_db1.scan(
                            cursor=cursor_frames,
                            match=f"task:{task_id}:frame:*",
                            count=1000
                        )
                        cursor_frames = int(cursor_frames)

                        if frame_keys:
                            deleted = await redis_db1.delete(*frame_keys)
                            deleted_keys += deleted

                    # Supprimer les autres métadonnées
                    deleted = await redis_db1.delete(f"task:{task_id}")
                    if deleted > 0:
                        deleted_keys += deleted

                    # Supprimer directement les métadonnées Celery dans DB0
                    async with Redis(db=0) as redis_db0:
                        celery_meta_key = f"celery-task-meta-{task_id}"
                        deleted = await redis_db0.delete(celery_meta_key)
                        if deleted > 0:
                            deleted_keys += deleted

                    deleted_tasks += 1

                return {
                    "success": True,
                    "message": f"Toutes les tâches supprimées avec succès ({deleted_tasks} tâches, {deleted_keys} clés)"
                }
        except Exception as e:
            logger.error(f"Erreur lors de la suppression des données de toutes les tâches: {e}")
            logger.error(traceback.format_exc())
            return {"success": False, "message": str(e)}
    
    @staticmethod
    async def get_job_error(job_id: str) -> Tuple[Optional[str], Optional[str]]:
        try:
            result = AsyncResult(job_id, app=celery_app)
        except Exception as e:
            logger.error("Failed to create AsyncResult for job %s: %s", job_id, e)
            return str(e), None
        
        try:
            if result.failed():
                try:
                    error_data = await results_store.get_results(job_id, 0, 0)
                except Exception as e:
                    logger.error("Error retrieving results from Redis for job %s: %s", job_id, e)
                    error_data = None

                if error_data and len(error_data) > 0:
                    metadata = error_data[0].metadata
                    return metadata.get("message"), metadata.get("stacktrace")
                
                logger.info("No error metadata found in Redis for job %s. Using Celery error result", job_id)
                return str(result.result), None
                
            return None, None
        except Exception as e:
            logger.error("Error processing job error details for job %s: %s", job_id, e)
            return str(e), None
    
    @staticmethod
    async def get_jobs() -> List[str]:
        all_tasks: Set[str] = set()
        try:
            inspect = celery_app.control.inspect()
            active_tasks = inspect.active() or {}

            for tasks in active_tasks.values():
                for task in tasks:
                    task_id = task.get('id')
                    all_tasks.add(task_id)
        except Exception as e:
            logger.error("Erreur lors de la récupération des tâches actives: %s", e)

        try:
            async with Redis(db=1) as redis_client:
                keys = await redis_client.keys("task:*:results")
                for key in keys:
                    key_str = key.decode('utf-8') if isinstance(key, bytes) else str(key)
                    parts = key_str.split(':')
                    if len(parts) >= 2:
                        all_tasks.add(parts[1])
        except Exception as e:
            logger.error("Erreur lors de la récupération des tâches depuis Redis: %s", e)

        return list(all_tasks)
    
    @staticmethod
    async def get_job_results(job_id: str) -> List[JobResult]:
        return await results_store.get_results(job_id)

    @staticmethod
    async def get_frame(job_id: str, frame_uuid: str) -> Optional[bytes]:
        return await results_store.get_frame(job_id, frame_uuid)
    
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
                previous_results = await results_store.get_results(job_id)
                for result in previous_results:
                    if websocket.client_state == WebSocketState.DISCONNECTED:
                        break
                    
                    if result.metadata:
                        await websocket.send_json(result.metadata)
                    if result.frame:
                        await websocket.send_bytes(result.frame)

            # S'abonner aux nouvelles mises à jour
            async for update in results_store.subscribe_to_results(job_id):
                if websocket.client_state == WebSocketState.DISCONNECTED:
                    break
 
                if update.metadata:
                    await websocket.send_json(update.metadata)
                if update.frame:
                    await websocket.send_bytes(update.frame)
                
                if update.final:
                    break
                                   
        except WebSocketDisconnect:
            logger.info(f"Client WebSocket déconnecté pour le job {job_id}")
        except Exception as e:
            logger.error(f"Erreur lors du streaming des résultats pour le job {job_id}: {e}")
            logger.error(traceback.format_exc())
            
            # Essayer d'envoyer un message d'erreur si le websocket est encore connecté
            if websocket.client_state != WebSocketState.DISCONNECTED:
                logger.info(f"Envoi d'un message d'erreur pour le job {job_id}")
                await websocket.send_json({
                    "type": "error",
                    "message": f"Erreur de streaming: {str(e)}"
                })





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

        # TODO: Gérer le conf d'apparance et attribut séparément
        self.confidence = self.appearances.get("confidence","medium") if self.appearances else "medium"
        self.class_score = data.get("class_score", None)
        self.global_score = data.get("global_score", None)

        match self.confidence :
            case "high":
                self.top_type = 2
                self.top_color = 2
                self.threshold_type = 0.40
                self.threshold_color = 0.40

                if not self.class_score:
                     self.class_score = 0.1
                if not self.global_score:
                    self.global_score = 0.1

            case "medium":
                self.top_type = 3
                self.top_color = 3
                self.threshold_type = 0.20
                self.threshold_color = 0.20

                if not self.class_score:
                     self.class_score = 0.05
                if not self.global_score:
                    self.global_score = 0.05

            case "low":
                self.top_type = 4
                self.top_color = 4
                self.threshold_type = 0.10
                self.threshold_color = 0.10

                if not self.class_score:
                     self.class_score = 0.01
                if not self.global_score:
                    self.global_score = 0.01
            
            case _ : 
                    raise ValueError("unknown confidence strategy")
        
        #set path to save thumbnails
        self.save_path = data.get("save_thumbnail_path", "/var/lib/postgresql/16/main")
        self.time_format = data.get("time_format", '%Y-%m-%dT%H:%M')

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
            total_duration = (to_time - from_time).total_seconds()

            if total_duration <= 0:
                logger.error(f"Invalid time range: {from_time} - {to_time}")
                return 100.0

            elapsed = (current - from_time).total_seconds()
            progress = min(100.0, max(0.0, (elapsed / total_duration) * 100.0))
            return progress

        except Exception as e:
            logger.error(f"Error in _calculate_progress: {e}")
            return 100.0
    
    def __calculate_iou(self, box1, box2):
        top1, bottom1, left1, right1 = box1
        top2, bottom2, left2, right2 = box2

        x_left = max(left1, left2)
        y_top = max(top1, top2)
        x_right = min(right1, right2)
        y_bottom = min(bottom1, bottom2)

        if x_right < x_left or y_bottom < y_top:
            return 0.0

        intersection_area = (x_right - x_left) * (y_bottom - y_top)

        box1_area = (right1 - left1) * (bottom1 - top1)
        box2_area = (right2 - left2) * (bottom2 - top2)

        union_area = box1_area + box2_area - intersection_area
        if union_area <= 0:
            return 0.0

        return intersection_area / union_area
    
    def _filter_detections(self, bbox, probabilities: Dict[str, float]):
        size = self._filter_detections_size(bbox)
        detector = self._filter_detections_classes(probabilities)
        return size * detector
    
    def _filter_detections_size(self, bbox):
        top, bottom, left, right = bbox

        min_size = 16 # below this size, the object is too small and the model is not reliable
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
            if self.type == "vehicle":
                # maybe the type is available also in probabilities given classes ? 
                type_score = 1.0
                wanted_type = self.appearances.get("type", [])
                if len(wanted_type) > 0:
                    type_score = 0.0

                    detected_type = appearances.get("type", {})
                    filtered_detected_type = {k: v for k, v in detected_type.items() if v > self.threshold_type}    #filter conf too low
                    filtered_detected_type = dict(list(filtered_detected_type.items())[:self.top_type])             # keep top x results

                    for t in wanted_type:
                        type_score = max(type_score, filtered_detected_type.get(t, 0.0))
                
                color_score = 1.0
                wanted_color = self.appearances.get("color", [])
                if len(wanted_color) > 0:
                    color_score = 0.0

                    detected_color = appearances.get("color", {})
                    filtered_detected_color = {k: v for k, v in detected_color.items() if v > self.threshold_color} #filter conf too low
                    filtered_detected_color = dict(list(filtered_detected_color.items())[:self.top_color])          # keep top x results
                    for c in wanted_color:
                        color_score = max(color_score, filtered_detected_color.get(c, 0.0))

                logger.info(f"config: {self.appearances} - found: {appearances} - wanted {wanted_type} -> {type_score} - score: {wanted_color} -> {color_score}")
                return type_score * color_score
            elif self.type == "mobility":
                return 1.0
            elif self.type == "person":
                
                gender_score = 1.0
                wanted_gender = self.appearances.get("gender", [])
                if len(wanted_gender) > 0:
                    gender_score = 0.0

                    # TODO: Samy, plz only use gender and not gender_attr
                    detected_gender = {}
                    if "gender_attr" in appearances:
                        detected_gender = appearances.get("gender_attr", {})
                    else:
                        detected_gender = appearances.get("gender", {})
                    
                    # if only one gender is detected, set the other to 1 - the detected gender
                    if "male" in detected_gender and not "female" in detected_gender:
                        detected_gender["female"] = 1 - detected_gender["male"]
                    if "female" in detected_gender and not "male" in detected_gender:
                        detected_gender["male"] = 1 - detected_gender["female"]
                        
                    for g in wanted_gender:
                        gender_score = max(gender_score, detected_gender.get(g, 0.0))
                
                age_score = 1.0
                wanted_age = self.appearances.get("age", [])
                if len(wanted_age) > 0:
                    age_score = 0.0

                    # TODO: Samy, plz only use age and not age_attr
                    detected_age = {}
                    if "age_attr" in appearances:
                        detected_age = appearances.get("age_attr", {})
                    else:
                        detected_age = appearances.get("age", {})

                    for c in wanted_age:
                        age_score = max(age_score, detected_age.get(c, 0.0))

                return gender_score * age_score
            else:
                logger.error(f"Unknown type: {self.type}")
                return 0.0
        
        except Exception as e:
            logger.error(f"Error in appearance filter: {e}")
            return 1.0
    
    def _filter_classification_attributes(self, probabilities: Dict[str, float], attributes: Dict[str, Dict[str,float]]):
        try:
            if self.type == "vehicle":
                return 1.0
            elif self.type == "mobility":
                return 1.0
            elif self.type == "person":
                upper_score = 1.0
                wanted_upper = self.attributes.get("upper", {}).get("type", [])
                if len(wanted_upper) > 0:
                    upper_score = 0.0
                    detected_upper = attributes.get("upper", {}).get("type", {})
                    for u in wanted_upper:
                        upper_score = max(upper_score, detected_upper.get(u, 0.0))

                lower_score = 1.0
                wanted_lower = self.attributes.get("lower", {}).get("type", [])
                if len(wanted_lower) > 0:
                    lower_score = 0.0
                    detected_lower = attributes.get("lower", {}).get("type", {})
                    for l in wanted_lower:
                        lower_score = max(lower_score, detected_lower.get(l, 0.0))
                return upper_score * lower_score
            else:
                logger.error(f"Unknown type: {self.type}")
                return 0.0
        except Exception as e:
            logger.error(f"Error in attributes filter: {e}")
            return 1.0
    
    async def __process_image(self, forensic, img, time, previous_boxes, progress, source_guid):
        detections = await forensic.detect(img)
        current_boxes = []
        for index, detection in enumerate(detections): #index seulement pour les tests, à virer plus tard
            if self.cancel_event.is_set():
                return
            
            bbox = forensic.get_pixel_bbox(img, detection)
            probabilities = detection["bbox"]["probabilities"]

            obj_score = self._filter_detections(bbox, probabilities)
            if obj_score <= 0.1:
                continue

            current_boxes.append(bbox)

            is_duplicate = False
            for prev_box in previous_boxes:
                iou = self.__calculate_iou(bbox, prev_box)
                if iou > 0.2:
                    is_duplicate = True
                    break
            if is_duplicate:
                continue

            thumbnail = forensic.get_thumbnail(img, detection)
            if thumbnail is None:
                continue
            
            attributes = await forensic.classify(thumbnail, self.type)
            cls_score = self._filter_classification(probabilities, attributes, attributes)
            if cls_score <= self.class_score:
                continue

            global_score = obj_score * cls_score
            if global_score <= self.global_score:
                continue

            metadata = {
                "type": "detection",
                "progress": progress,
                "camera": source_guid,
                "score": global_score,
                "timestamp": time.isoformat(),
                "source": source_guid,
                "attributes": attributes
            }
            export = forensic.get_thumbnail(img, detection, 1.1)
            if export is None:
                continue
            
            _, encoded_image = cv2.imencode('.jpg', export)
            frame_bytes = encoded_image.tobytes()

            if False:
                path = "/var/lib/postgresql/16/main"
                name = f"{source_guid}:{time.strftime('%Y-%m-%dT%H:%M')}"
                os.makedirs(f"{path}/thumbnail/", exist_ok=True)
                cv2.imwrite(f"{path}/thumbnail/{name}.jpg", thumbnail)
                #cv2.imwrite(f"{ self.save_path}/thumbnail/{name}_{index}.jpg", thumbnail) #seulement pour les tests

            yield metadata, frame_bytes, current_boxes

    async def __process_stream(self, source_guid) -> AsyncGenerator[Tuple[dict, Optional[bytes]], None]:
        try:

            dal = GenericDAL()
            ai_settings = await dal.async_get(Settings, key_index= "ai")
            if not ai_settings or len(ai_settings) != 1:
                raise Exception("AI settings not found")
            
            settings_dict = ai_settings[0].value_index
            ai_host = settings_dict.get("ip", None)
            ai_port = settings_dict.get("port", None)
            ai_object = settings_dict.get("object", None)
            ai_vehicle = settings_dict.get("vehicle", None)
            ai_person = settings_dict.get("person", None)
            

            async with ServiceAI(ai_host, ai_port, ai_object, ai_vehicle, ai_person) as forensic:
                logger.info("Connected to AI Service")

                
                vms_settings = await dal.async_get(Settings, key_index= "vms")
                if not vms_settings or len(vms_settings) != 1:
                    raise Exception("VMS settings not found")
                
                settings_dict = vms_settings[0].value_index
                logger.info(f"Settings: {vms_settings}")
                vms_host = settings_dict.get("ip", None)
                vms_port = settings_dict.get("port", None)
                vms_username = settings_dict.get("username", None)
                vms_password = settings_dict.get("password", None)
                vms_type = settings_dict.get("type", None)

                VMS = CameraClient.create(vms_host, vms_port, vms_username, vms_password, vms_type)
                async with VMS() as client:
                    logger.info("Connected to VMS")

                    system_info = await client.get_system_info()
                    if source_guid not in system_info:
                        logger.info(f"GUID de caméra non trouvé: {source_guid}")
                        yield {"type": "error", "message": f"GUID de caméra non trouvé: {source_guid}"}, None
                        return

                    previous_boxes = []
                    frame_count = 0
                    if self.cancel_event.is_set():
                        return
                    
                    next_progress_to_send = self.time_from
                    
                    async for img, time in client.start_replay(
                        source_guid, 
                        self.time_from, 
                        self.time_to
                    ):
                        if self.cancel_event.is_set():
                            return
                        
                        progress = self._calculate_progress(time, self.time_from, self.time_to)
                        frame_count += 1

                        if next_progress_to_send > time:
                            yield {"type": "progress", "progress": progress, "guid": source_guid, "timestamp": time.isoformat()}, None
                            next_progress_to_send = time + datetime.timedelta(seconds=5)
                        
                        async for metadata, frame_bytes, current_boxes in self.__process_image(forensic, img, time, previous_boxes, progress,source_guid):
                            previous_boxes = current_boxes
                            yield metadata, frame_bytes
                                            
                    if frame_count == 0:
                        logger.info(f"No image processed for camera: {source_guid}")
                        yield {"type": "warning", "message": f"Pas d'image à traiter pour la caméra: {source_guid}"}, None
        except Exception as ex:
            stacktrace = traceback.format_exc()
            logger.error(f"Exception in __process_stream: {stacktrace}")
            yield {"type": "error", "message": f"Exception in stream processing: {ex}"}, None
        finally:
            yield {"type": "progress", "progress": 100, "guid": source_guid, "timestamp": self.time_to.isoformat()}, None
        
        logger.info("Stream processing completed")

    async def _execute(self) -> AsyncGenerator[Tuple[dict, Optional[bytes]], None]:
        logger.info(f"Processing Forensic job {self.job_id}")
        logger.info(f"Sources: {self.sources}")
        logger.info(f"Time range: {self.time_from} - {self.time_to}")
        
        if not self.sources:
            logger.error("No sources provided, yielding error result")
            yield {"type": "error", "message": "Aucune source spécifiée"}, None
            return
        
        try:
            # TODO: await asyncio.gather() pour traiter plusieurs flux en parallèle
            sequential = True
            if sequential:
                for source_guid in self.sources:
                    if self.cancel_event.is_set():
                        logger.info(f"Cancellation flagged before processing source: {source_guid}")
                        return
                        
                    async for metadata, frame in self.__process_stream(source_guid):
                        if self.cancel_event.is_set():
                            logger.info(f"Cancellation flagged during processing source: {source_guid}")
                            return
                        
                        yield metadata, frame
            else:

                xs = stream.flatmap(
                    stream.iterate(self.sources),
                    self.__process_stream,
                    task_limit=2
                )

                async with xs.stream() as result_stream:
                    async for metadata, frame in result_stream:
                        if self.cancel_event.is_set():
                            logger.info(f"Cancellation flagged during parallel processing")
                            return
                            
                        yield metadata, frame
            
            logger.info("All sources processed")

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

async def test_process_stream():
    from datetime import datetime, timezone, timedelta
    data = {}

    data["save_thumbnail_path"] = "/tmp"
    data["time_format"] = '%Y-%m-%dT%H:%M:%S.%f'

    data["sources"] = ['00000001-0000-babe-0000-00408cec7f31']

    start = datetime(2025, 3, 21, 14, 0, 0, tzinfo=timezone(timedelta(hours=1)))
    time_range = {
        "time_from": start ,
        "time_to": start + timedelta(minutes=5)
    }
    data["timerange"] = time_range
    data["type"] = "vehicle"
    data["appearances"] = {"confidence" : "low", "type" : ["car"], "color" : ["black"]}


    replay = VehicleReplayJob(data=data)
    print("Starting")
    for source in data["sources"] :
        async for response in replay._VehicleReplayJob__process_stream(source):
            if response[1] :
                print(f"\n\n response : {response[0]}")
        

async def test_process_image():

    from datetime import datetime, timezone, timedelta
    data = {}

    data["save_thumbnail_path"] = "/tmp"
    data["sources"] = 'test'

    #start = datetime.now(timezone.utc)
    start = datetime(2025, 3, 21, 14, 0, 0, tzinfo=timezone(timedelta(hours=1)))
    time_range = {
        "time_from": start,
        "time_to": start + timedelta(minutes=2)
    }
    data["timerange"] = time_range
    data["type"] = "vehicle"
    data["appearances"] = {"confidence" : "low", "type" : ["motorbike"], "color" : ["black"]}


    async with ServiceAI() as forensic :
        replay = VehicleReplayJob(data=data)
        print("Starting")
        await forensic.get_version()

        #params
        current_boxes = []
        previous_boxes = []
        progress = 0.
        source_guid = "test"
        time = start
        img_path = "test.jpg"

        img = cv2.imread(img_path)

        async for metadata, frame_bytes, current_boxes in replay._VehicleReplayJob__process_image(forensic, img, time, previous_boxes, progress, source_guid):
            previous_boxes = current_boxes
            print(f"metadata : {metadata}")

"""
def main():
    if True:
        asyncio.run(test_process_stream())
    else:
        asyncio.run(test_process_image())

if __name__ == "__main__":
    main()
"""