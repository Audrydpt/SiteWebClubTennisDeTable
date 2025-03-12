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

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
logger.addHandler(logging.StreamHandler())
logger.addHandler(logging.FileHandler(f"/tmp/{__name__}.log"))

class VehicleReplayJob(Job):
    """
    Job pour traiter les flux vidéo en fonction d'un ModelVehicle.
    Récupère les images à partir des sources et de la plage temporelle spécifiées.
    """
    def __init__(self, data: Dict[str, Any]):
        super().__init__()

        logger.info(f"Starting job with data: {data}")
        self.data = data
        self.sources = data.get("sources", [])
        self.timerange = data.get("timerange", {})

        self.time_from = self.timerange.get("time_from").astimezone(datetime.timezone.utc)
        self.time_to = self.timerange.get("time_to").astimezone(datetime.timezone.utc)

        self.type = data.get("type", None)
        
        # Vérification des paramètres requis
        if not self.sources:
            logger.error("Au moins une source (GUID de caméra) doit être spécifiée")
            raise ValueError("Au moins une source (GUID de caméra) doit être spécifiée")
        
        if not self.time_from or not self.time_to:
            logger.error("La plage temporelle (time_from et time_to) doit être spécifiée")
            raise ValueError("La plage temporelle (time_from et time_to) doit être spécifiée")
        
        # Pour stocker les résultats par priorité
        self.results = PriorityResultsObserver(100)
        self.add_observer(self.results)
    
    def cancel(self) -> None:
        super().cancel()
        self.results.clear()
        
    def _calculate_progress(self, current: datetime.datetime, from_time: datetime.datetime, to_time: datetime.datetime) -> float:
        total_duration = (to_time - from_time).total_seconds()
        if total_duration <= 0:
            logger.error(f"Invalid time range: {from_time} - {to_time}")
            return 100.0
            
        elapsed = (current - from_time).total_seconds()
        progress = min(100.0, max(0.0, (elapsed / total_duration) * 100.0))
        logger.info(f"Elapsed: {elapsed}, Total: {total_duration}, Progress: {progress}")
        return progress
    
    def __calculate_iou(self, box1, box2):
        # Coordonnées des boîtes
        top1, bottom1, left1, right1 = box1
        top2, bottom2, left2, right2 = box2
        
        # Calculer l'intersection
        x_left = max(left1, left2)
        y_top = max(top1, top2)
        x_right = min(right1, right2)
        y_bottom = min(bottom1, bottom2)
        
        # Vérifier s'il y a intersection
        if x_right < x_left or y_bottom < y_top:
            return 0.0
        
        intersection_area = (x_right - x_left) * (y_bottom - y_top)
        
        # Calculer l'union
        box1_area = (right1 - left1) * (bottom1 - top1)
        box2_area = (right2 - left2) * (bottom2 - top2)
        
        union_area = box1_area + box2_area - intersection_area
        
        # Éviter la division par zéro
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
            raise ValueError(f"Unknown type: {self.type}")
        
        # keep only allowed classes in the probabilities
        for key in list(probabilities.keys()):
            if key not in allowed_classes:
                del probabilities[key]
        
        return max(probabilities.values()) if probabilities else 0


    def _filter_classification(self):
        # TODO
        return 1.0
    
    async def __process_stream(self, source_guid) -> AsyncGenerator[Tuple[dict, bytes], None]:
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
                async for img, time in client.start_replay(
                    source_guid, 
                    self.time_from, 
                    self.time_to
                ):
                    if self.cancel_event.is_set():
                        return
                    
                    logger.info(f"got a frame")
                    # Calculer la progression
                    progress = self._calculate_progress(time, self.time_from, self.time_to)
                    frame_count += 1
                    yield {"type": "progress", "progress": progress}, None

                    detections = await forensic.detect(img)
                    logger.debug(f"Detections: {detections}")

                    current_boxes = []
                    for detection in detections:
                        logger.debug(f"Detection: {detection}")
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
                            if iou > 0.01:
                                logger.debug(f"Ignoring duplicate detection with IoU: {iou}")
                                is_duplicate = True
                                break
                        if is_duplicate:
                            continue

                        # Créer les métadonnées
                        metadata = {
                            "progress": progress,
                            "score": score,
                            "timestamp": time.isoformat(),
                        }
                        
                        # Encoder l'image en JPEG
                        thumbnail = forensic.get_thumbnail(img, detection, 1.025)
                        if thumbnail is None:
                            continue
                        
                        _, encoded_image = cv2.imencode('.jpg', thumbnail)
                        frame = encoded_image.tobytes()

                        yield metadata, frame
                    previous_boxes = current_boxes
                
                # Si aucune image n'a été traitée
                if frame_count == 0:
                    logger.info(f"Pas d'image à traiter: {source_guid}")
                    yield {"type": "error", "message": f"Pas d'image à traiter: {source_guid}"}, None
                    return

    async def _execute(self) -> AsyncGenerator[Tuple[dict, bytes], None]:
        logger.info(f"Processing Forensic")
        logger.info(f"Sources: {self.sources}")
        logger.info(f"Time range: {self.time_from} - {self.time_to}")
        if not self.sources:
            yield {"type": "error", "message": "Aucune source spécifiée"}, None
            return
        
        try:
            
            for source_guid in self.sources:
                logger.info(f"Starting query for source: {source_guid}")
                async for message, frame in self.__process_stream(source_guid):
                    yield message, frame

        except Exception as e:
            error_message = f"Erreur lors du traitement du flux vidéo: {type(e).__name__}"
            stacktrace = traceback.format_exc()
            logger.info(stacktrace)
            yield {"type": "error", "message": error_message, "stacktrace": stacktrace}, None
            logger.error(error_message)
            logger.error(stacktrace)
            raise e
