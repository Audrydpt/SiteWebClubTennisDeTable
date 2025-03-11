import logging
import asyncio
import datetime
from typing import List, Optional, Dict, Any, Union, AsyncGenerator, Tuple

import numpy as np
import cv2
import traceback

from service_ai import ServiceAI
from task_manager import Job, PriorityResultsObserver
from vms import CameraClient

class VehicleReplayJob(Job):
    """
    Job pour traiter les flux vidéo en fonction d'un ModelVehicle.
    Récupère les images à partir des sources et de la plage temporelle spécifiées.
    """
    def __init__(self, data: Dict[str, Any]):
        super().__init__()

        self.logger = logging.getLogger(__name__)
        self.logger.setLevel(logging.INFO)
        self.logger.addHandler(logging.StreamHandler())
        self.logger.addHandler(logging.FileHandler("/tmp/forensic.log"))

        self.logger.info(f"Starting job with data: {data}")
        self.data = data
        self.sources = data.get("sources", [])
        self.timerange = data.get("timerange", {})

        self.time_from = self.timerange.get("time_from").astimezone(datetime.timezone.utc)
        self.time_to = self.timerange.get("time_to").astimezone(datetime.timezone.utc)
        
        # Vérification des paramètres requis
        if not self.sources:
            raise ValueError("Au moins une source (GUID de caméra) doit être spécifiée")
        
        if not self.time_from or not self.time_to:
            raise ValueError("La plage temporelle (time_from et time_to) doit être spécifiée")
        
        # Pour stocker les résultats par priorité
        self.results = PriorityResultsObserver(10)
        self.add_observer(self.results)
        
    def _calculate_progress(self, current_time: str, from_time: datetime.datetime, to_time: datetime.datetime) -> float:
        try:
            current = datetime.datetime.fromisoformat(current_time)
        except (ValueError, TypeError):
            return 0.0
            
        total_duration = (to_time - from_time).total_seconds()
        if total_duration <= 0:
            return 100.0
            
        elapsed = (current - from_time).total_seconds()
        progress = min(100.0, max(0.0, (elapsed / total_duration) * 100.0))
        return progress
    

    def _filter(self):
        self._filter_detections()
        self._filter_classification()
    
    def _filter_detections(self):
        pass

    def _filter_classification(self):
        pass

    async def _execute(self) -> AsyncGenerator[Tuple[dict, bytes], None]:
        
        self.logger = logging.getLogger(__name__)
        self.logger.setLevel(logging.INFO)
        self.logger.addHandler(logging.StreamHandler())
        self.logger.addHandler(logging.FileHandler("/tmp/forensic.log"))
        self.logger.info(f"Processing Forensic")
        self.logger.info(f"Sources: {self.sources}")
        self.logger.info(f"Time range: {self.time_from} - {self.time_to}")
        if not self.sources:
            yield {"error": "Aucune source spécifiée"}, b""
            return
            
        # Traiter uniquement la première source pour l'instant
        source_guid = self.sources[0]
        self.logger.info(f"Starting query for source: {source_guid}")
        
        try:
            self.logger.info(f"Connecting to Camera")
            async with CameraClient("192.168.20.72", 7778) as client:
                # Vérifier si la caméra existe
                self.logger.info(f"Getting system info")
                system_info = await client.get_system_info()
                if source_guid not in system_info:
                    self.logger.info(f"GUID de caméra non trouvé: {source_guid}")
                    yield {"error": f"GUID de caméra non trouvé: {source_guid}"}, b""
                    return
                
                self.logger.info(f"Connecting to AI Service")
                async with ServiceAI() as forensic:
                    await forensic.get_version()
                
                    self.logger.info(f"Starting replay")
                    frame_count = 0
                    async for img, time in client.start_replay(
                        source_guid, 
                        self.time_from, 
                        self.time_to
                    ):
                        if self.cancel_event.is_set():
                            break
                        
                        self.logger.info(f"got a frame")
                        # Calculer la progression
                        progress = self._calculate_progress(time, self.time_from, self.time_to)
                        frame_count += 1

                        detections = await forensic.detect(img)
                        self.logger.info(f"Detections: {detections}")

                        for detection in detections:
                            self.logger.info(f"Detection: {detection}")
                            probabilities = detection["bbox"]["probabilities"]
                            top_class = max(probabilities, key=probabilities.get)
                            self.logger.info(f"Detection: {top_class} ({probabilities[top_class]})")

                            thumbnail = forensic.get_thumbnail(img, detection)

                            # Créer les métadonnées
                            metadata = {
                                "progress": progress,
                                "target": top_class,
                                "confidence": probabilities[top_class],
                                "probabilities": probabilities,
                                "timestamp": time.isoformat(),
                            }
                            
                            # Encoder l'image en JPEG
                            _, encoded_image = cv2.imencode('.jpg', thumbnail)
                            frame = encoded_image.tobytes()
                            yield metadata, frame
                    
                    # Si aucune image n'a été traitée
                    if frame_count == 0:
                        raise "No frames available"
        except Exception as e:
            error_message = f"Erreur lors du traitement du flux vidéo: {type(e).__name__}"
            stacktrace = traceback.format_exc()
            self.logger.info(stacktrace)
            yield {"error": error_message, "progress": 0, "stacktrace": stacktrace}, b""
            raise e
