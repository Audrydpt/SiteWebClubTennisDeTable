import logging
import traceback
import asyncio
from queue import Empty
import threading
import numpy as np
import uuid
import multiprocessing
import multiprocessing.managers
import signal
import atexit
import cv2
import heapq
from typing import Dict, Callable, Optional, Any, Coroutine, List, Set, Union, Tuple, AsyncGenerator
from enum import Enum, auto
from dataclasses import dataclass, field
from abc import ABC, abstractmethod

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
logger.addHandler(logging.StreamHandler())
logger.addHandler(logging.FileHandler(f"/tmp/{__name__}.log"))

class JobStatus(str, Enum):
    PENDING = "Pending"
    RUNNING = "Running"
    COMPLETED = "Completed"
    FAILED = "Failed"
    CANCELLED = "Cancelled"

@dataclass
class JobResult:
    job_id: str
    metadata: dict
    frame: bytes
    final: bool = False
    
    def __lt__(self, other):
        return self.metadata.get('confidence', 0) < other.metadata.get('confidence', 0)

class JobObserver(ABC):    
    @abstractmethod
    async def on_job_update(self, result: JobResult) -> None:
        pass

class PriorityResultsObserver(JobObserver):
    def __init__(self, max_results: int = 10):
        self.max_results = max_results
        self.results = []
    
    async def on_job_update(self, result: JobResult) -> None:
        if len(self.results) < self.max_results:
            heapq.heappush(self.results, result)
        else:
            if result.metadata is not None:
                if result.metadata.get('confidence', 0) > self.results[0].metadata.get('confidence', 0):
                    heapq.heappushpop(self.results, result)
    
    def get_results(self) -> List[JobResult]:
        return sorted(self.results, reverse=True)

    def clear(self):
        self.results = []

class WebSocketObserver(JobObserver):    
    def __init__(self, websocket):
        self.websocket = websocket
        
    async def on_job_update(self, result: JobResult) -> None:
        try:
            if result.metadata is not None:
                await self.websocket.send_json(result.metadata)
            if result.frame is not None:
                await self.websocket.send_bytes(result.frame)
        except Exception as e:
            print(f"Erreur d'envoi WebSocket: {e}")

class SharedQueueObserver(JobObserver):
    _manager = None
    
    @classmethod
    def get_manager(cls):
        if cls._manager is None:
            cls._manager = multiprocessing.Manager()
        return cls._manager
    
    def __init__(self):
        self.queue = self.get_manager().Queue(maxsize=100)
        
    async def on_job_update(self, result: JobResult) -> None:
        try:
            self.queue.put(result)
            logger.info(f"Résultat ajouté à la file partagée: {result.metadata}")
        except Exception as e:
            logger.error(f"Erreur d'ajout à la file partagée: {e}")
            logger.error(traceback.format_exc())
            print(f"Error adding to queue: {e}")
    
    async def get(self, timeout=0.1):
        try:
            logger.info("Attente de résultat dans la file partagée")
            return self.queue.get(timeout=timeout)
        except Empty:
            return None

class Job:   
    """
    Classe abstraite représentant une tâche asynchrone.
    Les jobs s'exécutent de manière asynchrone et peuvent notifier 
    des observateurs lors des mises à jour. Chaque job accumule ses
    meilleurs résultats dans une file de priorité basée sur le niveau
    de confiance.
    """
    def __init__(self):
        self.job_id = str(uuid.uuid4())
        self.status = JobStatus.PENDING
        self.error = None
        self.stacktrace = None
        self.observers: Set[JobObserver] = set()
        self.cancel_event = asyncio.Event()
        self.task = None
        
    def add_observer(self, observer: JobObserver) -> None:
        self.observers.add(observer)
        
    def remove_observer(self, observer: JobObserver) -> None:
        self.observers.discard(observer)
        
    async def notify_observers(self, metadata: dict, frame: bytes, final: bool = False) -> None:        
        last_result = JobResult(
            job_id=self.job_id,
            metadata=metadata,
            frame=frame,
            final=final
        )
        
        for observer in self.observers:
            try:
                await observer.on_job_update(last_result)
            except Exception as e:
                print(f"Erreur de notification: {e}")
    
    async def run(self) -> None:
        try:
            self.status = JobStatus.RUNNING
            async for metadata, frame in self._execute():
                if self.cancel_event.is_set():
                    self.status = JobStatus.CANCELLED
                    logger.info(f"Job {self.job_id} annulé")
                    await self.notify_observers(
                        {"type": "progress", "progress": 1, "message": "Job annulé"}, 
                        None, 
                        final=True
                    )
                    return
                
                await self.notify_observers(metadata, frame)
                
            self.status = JobStatus.COMPLETED
            logger.info(f"Job {self.job_id} terminé")
            await self.notify_observers(
                {"type": "progress", "progress": 1, "message": "Job terminé"}, 
                None, 
                final=True
            )
            
        except Exception as e:
            self.status = JobStatus.FAILED
            logger.error(f"Job {self.job_id} échoué: {e}")
            self.error = str(e)
            self.stacktrace = traceback.format_exc()
            await self.notify_observers(
                {"type": "progress", "progress": 1, "message": f"Job échoué: {e}"}, 
                None, 
                final=True
            )
    
    async def _execute(self) -> AsyncGenerator[Tuple[dict, bytes], None]:
        """
        Méthode abstraite à implémenter par les sous-classes.
        Doit être un générateur asynchrone qui produit des tuples (metadata, frame).
        """
        raise NotImplementedError("Les sous-classes doivent implémenter cette méthode")
    
    def cancel(self) -> None:
        self.cancel_event.set()

class TaskManager:
    """
    Gère l'exécution asynchrone des tâches dans un thread séparé.
    Fournit une interface pour soumettre, annuler et surveiller des jobs.
    Implémente un pattern Singleton pour garantir une instance unique.
    """
    _instance = None
    _initialized = False
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(TaskManager, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        if TaskManager._initialized:
            return
            
        TaskManager._initialized = True
        
        self.jobs: Dict[str, Job] = {}
        self._async_worker = AsyncWorker(self)
        self._tasks: List[asyncio.Task] = []
        
    def start(self) -> None:
        if not self._async_worker.is_alive():
            self._async_worker.start()
            
    def stop(self) -> None:
        for job_id in list(self.jobs.keys()):
            self.cancel_job(job_id)
        
        self._async_worker.stop()
    
    def submit_job(self, job: Job) -> str:
        if not self._async_worker.is_alive():
            self.start()
            
        self.jobs[job.job_id] = job
        
        if self._async_worker.loop:
            task = asyncio.run_coroutine_threadsafe(
                job.run(), 
                self._async_worker.loop
            )
            job.task = task
        
        return job.job_id
    
    def cancel_job(self, job_id: str) -> bool:
        if job_id in self.jobs:

            self.jobs[job_id].cancel()
            
            if self.jobs[job_id].task and not self.jobs[job_id].task.done():
                self.jobs[job_id].task.cancel()
                self.jobs[job_id].status = JobStatus.CANCELLED
                logger.info(f"Task for job {job_id} cancelled in the event loop")
            
            return True
        return False
        
    def get_job_status(self, job_id: str) -> Optional[JobStatus]:
        if job_id in self.jobs:
            return self.jobs[job_id].status
        return None
    
    def get_job_error(self, job_id: str) -> Optional[str]:
        if job_id in self.jobs:
            return self.jobs[job_id].error, self.jobs[job_id].stacktrace
        return None, None
    
    def get_jobs(self) -> List[str]:
        return list(self.jobs.keys())
    
    def get_job(self, job_id: str) -> Optional[Job]:
        return self.jobs.get(job_id, None)
        
    def add_observer(self, job_id: str, observer: JobObserver) -> bool:
        if job_id in self.jobs:
            self.jobs[job_id].add_observer(observer)
            return True
        return False
        
    def remove_observer(self, job_id: str, observer: JobObserver) -> bool:
        if job_id in self.jobs:
            self.jobs[job_id].remove_observer(observer)
            return True
        return False

class AsyncWorker(threading.Thread):  
    """
    Thread dédié à l'exécution de la boucle d'événements asyncio.
    Permet d'exécuter des coroutines asyncio dans un thread séparé
    du thread principal, offrant une meilleure gestion des ressources.
    """  
    def __init__(self, task_manager):
        super().__init__(daemon=True)
        self.task_manager = task_manager
        self.loop = None
        self._running = False
        
    def run(self):
        self.loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self.loop)
        self._running = True
        
        try:
            self.loop.run_forever()
        finally:
            self.loop.close()
            self._running = False
            
    def stop(self):
        if self.loop and self._running:
            self.loop.call_soon_threadsafe(self.loop.stop)
            self.join(timeout=1)

class TaskManagerServer(multiprocessing.managers.BaseManager):
    pass

class SharedTaskManager:
    """
    Singleton pour accéder au TaskManager partagé entre les workers.
    Cette classe utilise multiprocessing.managers pour partager l'instance
    entre tous les processus, permettant aux workers FastAPI de communiquer
    avec le même TaskManager.
    """
    
    _instance = None
    _manager = None
    _task_manager = None
    
    @classmethod
    def initialize(cls, address=('127.0.0.1', 50000), authkey=b'task_manager'):
        """
        Initialise le TaskManager partagé.
        À appeler UNE SEULE FOIS avant de démarrer les workers FastAPI.
        """
        if cls._instance is not None:
            return cls._instance
        
        # Enregistrer le TaskManager comme ressource partagée
        TaskManagerServer.register('get_task_manager', callable=lambda: TaskManager())
        
        cls._manager = TaskManagerServer(address=address, authkey=authkey)
        cls._manager.start()
        cls._task_manager = cls._manager.get_task_manager()
        cls._task_manager.start()
        
        def cleanup():
            if cls._task_manager:
                cls._task_manager.stop()
            if cls._manager:
                cls._manager.shutdown()
        
        atexit.register(cleanup)
        signal.signal(signal.SIGTERM, lambda signum, frame: cleanup())
        signal.signal(signal.SIGINT, lambda signum, frame: cleanup())
        
        cls._instance = cls
        return cls._instance
    
    @classmethod
    def get_manager(cls):
        """
        Récupère l'instance du TaskManager depuis les workers FastAPI.
        """
        if cls._task_manager is None:
            if cls._manager is None:
                TaskManagerServer.register('get_task_manager')
                cls._manager = TaskManagerServer(address=('127.0.0.1', 50000), authkey=b'task_manager')
                cls._manager.connect()
                cls._task_manager = cls._manager.get_task_manager()
        
        return cls._task_manager

class CounterJob(Job):    
    def __init__(self, duration: int, target: str = "objet"):
        super().__init__()
        self.duration = duration
        self.target = target
        self.image = cv2.imread("/backend/assets/test.jpg")
        if self.image is None:
            self.image = np.ones((640, 480, 3), dtype=np.uint8)
        self.data = PriorityResultsObserver(5)
        self.add_observer(self.data)
        
    async def _execute(self):
        for i in range(self.duration):
            if self.cancel_event.is_set():
                break
                
            await asyncio.sleep(1)
                        
            metadata = {
                "progress": (i+1)*100//self.duration,
                "target": self.target,
                "confidence": i * 10
            }
            
            # Encoder l'image en JPEG
            _, encoded_image = cv2.imencode('.jpg', self.image)
            frame = encoded_image.tobytes()
            
            print(f"Job {self.job_id}: {metadata}")
            yield metadata, frame


