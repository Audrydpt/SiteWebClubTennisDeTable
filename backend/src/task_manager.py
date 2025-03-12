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
        self.future = None  # The concurrent.futures.Future in the main thread
        
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
                logger.error(f"Error notifying observer: {e}")
    
    async def run(self) -> None:
        try:
            self.status = JobStatus.RUNNING
            async for metadata, frame in self._execute():
                # Check here for cancellation
                if self.cancel_event.is_set():
                    self.status = JobStatus.CANCELLED
                    logger.info(f"Job {self.job_id} cancelled during execution")
                    await self.notify_observers(
                        {"type": "cancelled", "progress": 100, "message": "Job cancelled"}, 
                        None, 
                        final=True
                    )
                    return
                
                await self.notify_observers(metadata, frame)
                
            # Check again after all execution is done
            if self.cancel_event.is_set():
                self.status = JobStatus.CANCELLED
            else:
                self.status = JobStatus.COMPLETED
                
            logger.info(f"Job {self.job_id} completed with status {self.status}")
            await self.notify_observers(
                {"type": "progress", "progress": 100, "message": f"Job {self.status.lower()}"}, 
                None, 
                final=True
            )
            
        except asyncio.CancelledError:
            # This exception is raised when the task is cancelled
            self.status = JobStatus.CANCELLED
            logger.info(f"Job {self.job_id} cancelled via CancelledError")
            await self.notify_observers(
                {"type": "cancelled", "progress": 100, "message": "Job cancelled"}, 
                None, 
                final=True
            )
        except Exception as e:
            self.status = JobStatus.FAILED
            logger.error(f"Job {self.job_id} failed: {e}")
            self.error = str(e)
            self.stacktrace = traceback.format_exc()
            logger.error(self.stacktrace)
            await self.notify_observers(
                {"type": "error", "progress": 100, "message": f"Job failed: {e}"}, 
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
        """Set the cancel event to signal the job to stop."""
        logger.info(f"Setting cancel event for job {self.job_id}")
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
        self._async_worker = None
        
    def start(self) -> None:
        if self._async_worker is None:
            self._async_worker = AsyncWorker(self)
        
        if not self._async_worker.is_alive():
            self._async_worker.start()
            
    def stop(self) -> None:
        # Cancel all running jobs first
        for job_id in list(self.jobs.keys()):
            self.cancel_job(job_id)
        
        # Then stop the worker
        self._async_worker.stop()
        self._async_worker = None
    
    def submit_job(self, job: Job) -> str:
        if not self._async_worker.is_alive():
            self.start()
            
        self.jobs[job.job_id] = job
        
        # Use the improved submit_coroutine method
        if self._async_worker.loop:
            future = self._async_worker.submit_coroutine(
                job.run(), 
                job.job_id
            )
            job.future = future  # Store the future for reference
        
        return job.job_id
    
    def cancel_job(self, job_id: str) -> bool:
        """
        Cancel a job with the given ID.
        Returns True if the job was found and cancellation was initiated,
        False otherwise.
        """
        logger.info(f"Attempting to cancel job {job_id}")
        
        if job_id not in self.jobs:
            logger.warning(f"Attempted to cancel nonexistent job: {job_id}")
            return False
        
        job = self.jobs[job_id]
        
        # Set the cancel event to signal all parts of the job to stop
        logger.info(f"Setting cancel event for job {job_id}")
        job.cancel()
        
        # Use the worker's cancel_task method to cancel the task in the worker loop
        if self._async_worker.is_alive():
            logger.info(f"Requesting task cancellation in worker for job {job_id}")
            result = self._async_worker.cancel_task(job_id)
            logger.info(f"Cancellation request result: {result}")
        
        # Update job status
        job.status = JobStatus.CANCELLED
        
        # Notify observers of cancellation
        if self._async_worker.loop:
            asyncio.run_coroutine_threadsafe(
                self._notify_cancellation(job_id),
                self._async_worker.loop
            )
        
        return True
    
    async def _notify_cancellation(self, job_id: str) -> None:
        """Helper to notify job observers about cancellation"""
        if job_id in self.jobs:
            job = self.jobs[job_id]
            
            try:
                await job.notify_observers(
                    {"type": "cancelled", "message": "Job cancelled by user request"}, 
                    None, 
                    final=True
                )
            except Exception as e:
                logger.error(f"Error notifying observers of cancellation: {e}")
    
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
        self._task_map = {}  # Maps future_id -> actual asyncio Task
        
    def run(self):
        self.loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self.loop)
        self._running = True
        
        try:
            self.loop.run_forever()
        finally:
            # Cancel all pending tasks when loop is stopped
            pending = asyncio.all_tasks(self.loop)
            for task in pending:
                task.cancel()
            
            # Run loop until all tasks are cancelled
            if pending:
                self.loop.run_until_complete(asyncio.gather(*pending, return_exceptions=True))
                
            self.loop.close()
            self._running = False
            
    def stop(self):
        if self.loop and self._running:
            # Cancel all tasks before stopping loop
            def cancel_all():
                for task_id, task in list(self._task_map.items()):
                    logger.info(f"Cancelling task {task_id} during worker shutdown")
                    if not task.done():
                        task.cancel()
            
            self.loop.call_soon_threadsafe(cancel_all)
            self.loop.call_soon_threadsafe(self.loop.stop)
            self.join(timeout=2)
    
    def submit_coroutine(self, coro, job_id):
        """
        Submit a coroutine to be executed in this worker's event loop,
        and return a Future that will eventually contain the result.
        """
        future = asyncio.run_coroutine_threadsafe(coro, self.loop)
        
        # We need to create a proper Task in the worker loop and track it
        def create_task_and_link():
            task = asyncio.create_task(coro)
            self._task_map[job_id] = task
            
            # When the task completes, remove it from the map
            def on_task_done(t):
                if job_id in self._task_map:
                    del self._task_map[job_id]
            
            task.add_done_callback(on_task_done)
            
            # Cancel the Future if the Task is cancelled
            def on_task_cancelled(t):
                if not future.done():
                    future.cancel()
            
            task.add_done_callback(on_task_cancelled)
            return task
        
        # We can't directly return the task because it's in a different thread/loop,
        # but we need it to properly cancel the task
        self.loop.call_soon_threadsafe(create_task_and_link)
        return future
    
    def cancel_task(self, job_id):
        """
        Cancel a task that's running in this worker's event loop.
        """
        def do_cancel():
            if job_id in self._task_map:
                task = self._task_map[job_id]
                if not task.done():
                    logger.info(f"Cancelling task {job_id} in worker loop")
                    task.cancel()
                    return True
            return False
        
        if self.loop and self._running:
            return self.loop.call_soon_threadsafe(do_cancel)
        return False

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


