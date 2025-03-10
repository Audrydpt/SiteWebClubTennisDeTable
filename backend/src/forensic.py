import asyncio
import datetime
from typing import List, Optional, Dict, Any, Union, AsyncGenerator, Tuple

import numpy as np
import cv2

from task_manager import Job, PriorityResultsObserver
from vms import CameraClient

class VehicleReplayJob(Job):
    """
    Job pour traiter les flux vidéo en fonction d'un ModelVehicle.
    Récupère les images à partir des sources et de la plage temporelle spécifiées.
    """
    def __init__(self, data: Dict[str, Any]):
        super().__init__()
        print("Starting job:", data)
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
    
    async def _execute(self) -> AsyncGenerator[Tuple[dict, bytes], None]:
        
        print("Processing Forensic")
        print("Sources:", self.sources)
        print("Time range:", self.time_from, self.time_to)
        if not self.sources:
            yield {"error": "Aucune source spécifiée"}, b""
            return
            
        # Traiter uniquement la première source pour l'instant
        source_guid = self.sources[0]
        
        try:
            async with CameraClient("192.168.20.72", 7778) as client:
                # Vérifier si la caméra existe
                system_info = await client.get_system_info()
                if source_guid not in system_info:
                    print(f"GUID de caméra non trouvé: {source_guid}")
                    yield {"error": f"GUID de caméra non trouvé: {source_guid}"}, b""
                    return
                
                # Récupérer le flux vidéo
                print("Starting replay")
                frame_count = 0
                async for img, time in client.start_replay(
                    source_guid, 
                    self.time_from, 
                    self.time_to
                ):
                    if self.cancel_event.is_set():
                        break
                    
                    # Calculer la progression
                    progress = self._calculate_progress(time, self.time_from, self.time_to)
                    
                    # Créer les métadonnées
                    metadata = {
                        "progress": progress,
                        "target": "vehicle",
                        "confidence": 50 + (frame_count % 50),
                        "timestamp": time.isoformat(),
                        "frame_number": frame_count
                    }
                    
                    # Encoder l'image en JPEG
                    _, encoded_image = cv2.imencode('.jpg', img)
                    frame = encoded_image.tobytes()
                    
                    frame_count += 1
                    yield metadata, frame
                
                # Si aucune image n'a été traitée
                if frame_count == 0:
                    yield {
                        "warning": "Aucune image disponible pour la période spécifiée",
                        "progress": 100,
                        "source": source_guid,
                        "from": self.time_from.isoformat(),
                        "to": self.time_to.isoformat()
                    }, b""
                
        except Exception as e:
            error_message = f"Erreur lors du traitement du flux vidéo: {str(e)}"
            print(error_message)
            yield {"error": error_message, "progress": 0}, b""
            raise