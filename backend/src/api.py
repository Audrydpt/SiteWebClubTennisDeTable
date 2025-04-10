import os
import traceback
import cv2
import json
import uuid
from fastapi.websockets import WebSocketState
import gunicorn
import uvicorn
import datetime
import time
import aiohttp
import threading
import asyncio
import logging

from pydantic import Field, create_model

from sqlalchemy import func, JSON, text
from sqlalchemy.inspection import inspect

from fastapi.staticfiles import StaticFiles
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Response, WebSocket, WebSocketDisconnect, HTTPException
from starlette.requests import Request

from gunicorn.app.base import BaseApplication

from task_manager import JobResult, ResultsStore, JobStatus, TaskManager

from typing import Annotated, Literal, Optional, Type, Union, List, Dict, Any
from enum import Enum

from swagger import get_custom_swagger_ui_html
from event_grabber import EventGrabber
from database import Dashboard, GenericDAL, Widget, Settings
from database import AcicAllInOneEvent, AcicCounting, AcicEvent, AcicLicensePlate, AcicNumbering, AcicOCR, AcicOccupancy, AcicUnattendedItem

from pydantic import BaseModel, Field, Extra

from vms import CameraClient

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
file_handler = logging.FileHandler(f"/tmp/{__name__}.log")
file_handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))
logger.addHandler(file_handler)

class ModelName(str, Enum):
    minute = "1 minute"
    quarter = "15 minutes"
    half = "30 minutes"
    hour = "1 hour"
    day = "1 day"
    week = "1 week"
    month = "1 month"
    trimester = "3 months"
    semester = "6 months"
    year = "1 year"
    lifetime = "100 years"



# Please follow: https://www.belgif.be/specification/rest/api-guide/#resource-uri
class FastAPIServer:
    def __init__(self, event_grabber:EventGrabber):
        self.event_grabber = event_grabber
        self.app = FastAPI(
            docs_url=None, redoc_url=None,
            swagger_ui_parameters={
                "persistAuthorization": True
            },
            servers=[
                {"description": "production", "url": "/front-api"},
                {"description": "development", "url": "/"},
            ])

        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

        if os.path.exists("/backend/assets"):
            self.app.mount("/static", StaticFiles(directory="/backend/assets/"), name="static")
        else:
            os.makedirs("assets", exist_ok=True)
            self.app.mount("/static", StaticFiles(directory="assets/"), name="static")

        self.__registered_dashboard = {}
        self.__define_endpoints()

    def __define_endpoints(self):

        @self.app.get("/", include_in_schema=False)
        async def custom_swagger_ui_html():
            return get_custom_swagger_ui_html(openapi_url="openapi.json", title=self.app.title + " - Swagger UI",)

        @self.app.get("/servers/grabbers", tags=["servers"])
        async def get_all_servers(health: Optional[bool] = False):
            try:
                ret = []

                for grabber in self.event_grabber.get_grabbers():
                    status = dict()
                    status["type"] = grabber.hosttype
                    status["host"] = grabber.acichost
                    status["ports"] = {
                        "http": grabber.acicaliveport,
                        "https": 443,
                        "streaming": grabber.acichostport
                    }

                    if health:
                        status["health"] = {
                            "is_alive": grabber.is_alive(),
                            "is_longrunning": grabber.is_long_running(),
                            "is_reachable": grabber.is_reachable(timeout=0.2),
                            "is_streaming": grabber.is_streaming(timeout=0.2)
                        }

                    ret.append(status)

                return ret

            except ValueError as e:
                raise HTTPException(status_code=500, detail=str(e))

        self.__create_endpoint("AcicUnattendedItem", AcicUnattendedItem)
        self.__create_endpoint("AcicCounting", AcicCounting)
        self.__create_endpoint("AcicNumbering", AcicNumbering, agg_func=func.avg(AcicNumbering.count))
        self.__create_endpoint("AcicOccupancy", AcicOccupancy, agg_func=func.avg(AcicOccupancy.value))
        self.__create_endpoint("AcicLicensePlate", AcicLicensePlate)
        self.__create_endpoint("AcicOCR", AcicOCR)
        self.__create_endpoint("AcicAllInOneEvent", AcicAllInOneEvent)
        self.__create_endpoint("AcicEvent", AcicEvent)

        @self.app.get("/dashboard/widgets", tags=["dashboard"])
        async def get_dashboard():
            return self.__registered_dashboard

        self.__create_tabs()
        self.__create_widgets()
        self.__create_settings()
        self.__create_health()
        self.__create_forensic()
        self.__create_vms()

    def __create_health(self):
        @self.app.get("/health", tags=["health"], include_in_schema=False)
        async def health():
            grabbers = {}
            for grabber in self.event_grabber.get_grabbers():
                grabbers[grabber.acichost] = "ok" if grabber.is_long_running() else "error"

            return {
                "api": "ok",
                "database": "ok",
                "grabbers": grabbers
            }

        @self.app.get("/health/aiServer/{ip}", tags=["health"])
        async def health_ai_server(ip: str):
            try:
                username = "administrator"
                password = "ACIC"

                async with aiohttp.ClientSession() as session:
                    # Premier appel pour obtenir l'adresse AI
                    ai_service_url = f"https://{ip}/api/aiService"
                    async with session.get(
                        ai_service_url, 
                        auth=aiohttp.BasicAuth(username, password),
                        headers={"Accept": "application/json"},
                        ssl=False,
                        timeout=aiohttp.ClientTimeout(total=3)
                    ) as response:
                        if response.status != 200:
                            return {"status": "error", "message": "Impossible to get AI IP"}
                        
                        ai_data = await response.json()
                        ai_ip = ai_data["address"]
                        ai_port = ai_data["port"]
                    
                    # Deuxième appel pour vérifier le service AI
                    describe_url = f"http://{ai_ip}:{ai_port}/describe"
                    async with session.get(
                        describe_url, 
                        timeout=aiohttp.ClientTimeout(total=3)
                    ) as describe_response:
                        if describe_response.status == 200:
                            return {"status": "ok"}
                        else:
                            return {"status": "error", "message": "AI service /describe endpoint not responding"}

            except aiohttp.ClientError as e:
                return {"status": "error", "message": f"Request failed: {str(e)}"}
            except asyncio.TimeoutError:
                return {"status": "error", "message": "Request timed out"}
        
        @self.app.get("/health/lprServer/{ip}", tags=["health"])
        async def health_lpr_server(ip: str):
            try:
                username = "administrator"
                password = "ACIC"

                async with aiohttp.ClientSession() as session:
                    # Premier appel pour obtenir l'adresse LPR
                    ai_service_url = f"https://{ip}/api/lprService"
                    async with session.get(
                        ai_service_url, 
                        auth=aiohttp.BasicAuth(username, password),
                        headers={"Accept": "application/json"},
                        ssl=False,
                        timeout=aiohttp.ClientTimeout(total=3)
                    ) as response:
                        if response.status != 200:
                            return {"status": "error", "message": "Impossible to get AI IP"}
                        
                        ai_data = await response.json()
                        ai_ip = ai_data["address"]
                        ai_port = ai_data["port"]
                    
                    # Deuxième appel pour vérifier le service LPR
                    describe_url = f"http://{ai_ip}:{ai_port}/describe"
                    async with session.get(
                        describe_url, 
                        timeout=aiohttp.ClientTimeout(total=3)
                    ) as describe_response:
                        if describe_response.status == 200:
                            return {"status": "ok"}
                        else:
                            return {"status": "error", "message": "LPR service /describe endpoint not responding"}

            except aiohttp.ClientError as e:
                return {"status": "error", "message": f"Request failed: {str(e)}"}
            except asyncio.TimeoutError:
                return {"status": "error", "message": "Request timed out"}

        @self.app.get("/health/secondaryServer/{ip}", tags=["health"])
        async def health_secondary_server(ip: str):
            try:
                async with aiohttp.ClientSession() as session:
                    describe_url = f"http://{ip}:8080/ConfigTool.html"
                    async with session.get(
                        describe_url, 
                        timeout=aiohttp.ClientTimeout(total=3)
                    ) as describe_response:
                        if describe_response.status == 401:
                            return {"status": "ok", "message": "Secondary server is reachable"}
                        else:
                            return {"status": "error", "message": f"Unexpected response: {describe_response.status}"}

            except asyncio.TimeoutError:
                return {"status": "error", "message": "Timeout"}
            except aiohttp.ClientConnectorError:
                return {"status": "error", "message": "Connection error"}
            except aiohttp.ClientError as e:
                return {"status": "error", "message": f"Request failed: {str(e)}"}

        @self.app.get("/health/worker", tags=["health"])
        async def test_worker():
            worker_pid = os.getpid()
            thread_id = threading.get_ident()
            
            # Simuler un traitement qui prend du temps, mais qui n'est pas bloquant
            start_time = time.time()
            await asyncio.sleep(5)  # Non-bloquant
            processing_time = time.time() - start_time
            
            return {
                "worker_pid": worker_pid,
                "thread_id": thread_id,
                "timestamp": time.time(),
                "processing_time": processing_time
            }
        
        @self.app.get("/health/worker/blocking", tags=["health"])
        def test_worker_blocking():            
            # Obtenir des informations sur le processus et le thread
            worker_pid = os.getpid()
            thread_id = threading.get_ident()
            
            # Simuler un traitement bloquant
            start_time = time.time()
            time.sleep(5)  # Bloquant
            processing_time = time.time() - start_time
            
            return {
                "worker_pid": worker_pid,
                "thread_id": thread_id,
                "timestamp": time.time(),
                "processing_time": processing_time,
                "type": "blocking"
            }

    def __create_forensic(self):
        
        class TimeRange(BaseModel):
            time_from: datetime.datetime
            time_to: datetime.datetime
        
        Confidence = Literal["low", "medium", "high"]
        Color = Literal["brown", "red", "orange", "yellow", "green", "cyan", "blue", "purple", "pink", "white", "gray", "black"]

        class Model(BaseModel):
            sources: List[str]
            timerange: TimeRange
        
        class MMR(BaseModel):
            brand: str
            model: Optional[List[str]] = None
        
        class VehiculeApperance(BaseModel):
            type: Optional[List[str]] = None
            color: Optional[List[Color]] = None
            confidence: Confidence
        
        class VehiculeAttributes(BaseModel):
            mmr: Optional[List[MMR]] = None
            plate: Optional[str] = None
            other: Dict[str, bool]
            confidence: Confidence
        
        class ModelVehicle(Model):
            type: Literal["vehicle"]
            appearances: VehiculeApperance
            attributes: VehiculeAttributes
            context: Dict[str, Any]
        
        class Hair(BaseModel):
            length: Optional[List[Literal["none", "short", "medium", "long"]]] = None
            color: Optional[List[Literal["black", "brown", "blonde", "gray", "white", "other"]]] = None
            style: Optional[List[Literal["straight", "wavy", "curly"]]] = None

        class PersonApperance(BaseModel):
            gender: Optional[List[Literal["male", "female"]]] = None
            seenAge: Optional[List[Literal["child", "teen", "adult", "senior"]]] = None
            realAge: Optional[int] = None
            build: Optional[List[Literal["slim", "average", "athletic", "heavy"]]] = None
            height: Optional[List[Literal["short", "average", "tall"]]] = None
            hair: Hair
            confidence: Confidence
        
        class UpperPersonAttributes(BaseModel):
            color: Optional[List[Color]] = None
            type: Optional[List[Literal["shirt", "jacket", "coat", "sweater", "dress", "other"]]] = None
        
        class LowerPersonAttributes(BaseModel):
            color: Optional[List[Color]] = None
            type: Optional[List[Literal["pants", "shorts", "skirt", "dress", "other"]]] = None
            
        class PersonAttributes(BaseModel):
            upper: UpperPersonAttributes
            lower: LowerPersonAttributes
            other: Dict[str, bool]
            confidence: Confidence

        class ModelPerson(Model):
            type: Literal["person"]
            appearances: PersonApperance
            attributes: PersonAttributes
            context: Dict[str, Any]
                
        @self.app.get("/forensics", tags=["forensics"])
        async def get_tasks():
            try:
                tasks = {}
                for job_id in await TaskManager.get_jobs():
                    status = TaskManager.get_job_status(job_id)
                    created = TaskManager.get_job_created(job_id)
                    updated = TaskManager.get_job_updated(job_id)
                    job_type = TaskManager.get_job_type(job_id)
                    size = TaskManager.get_job_size(job_id)
                    count = TaskManager.get_job_count(job_id)

                    task_info = {
                        "status": status,
                        "type": job_type,
                        "created": created,
                        "updated": updated,
                        "count": count,
                        "size": size,

                    }
                    
                    if status == JobStatus.FAILURE:
                        error, stacktrace = await TaskManager.get_job_error(job_id)
                        task_info["error"] = error
                        task_info["stacktrace"] = stacktrace
                        
                    tasks[job_id] = task_info
                    
                return {"tasks": tasks}
            except Exception as e:
                logger.error(f"Erreur lors de la récupération des tâches: {e}")
                logger.error(traceback.format_exc())
                raise HTTPException(status_code=500, detail=traceback.format_exc())

        @self.app.post("/forensics", tags=["forensics"])
        async def start_task(request: Request, data: Union[ModelVehicle, ModelPerson]):
            try:
                job_params = data.model_dump()
                
                # Soumettre la tâche appropriée selon le type
                if data.type == "vehicle":
                    job_id = TaskManager.submit_job("VehicleReplayJob", job_params)
                elif data.type == "person":
                    raise HTTPException(status_code=400, detail="Person not supported yet")
                else:
                    raise HTTPException(status_code=400, detail="Type non supporté")
                    
                return {"guid": job_id}
            
            except ValueError as e:
                logger.error(f"Erreur de validation: {e}")
                raise HTTPException(status_code=400, detail=str(e))
            except Exception as e:
                logger.error(f"Erreur lors du démarrage de la tâche: {e}")
                logger.error(traceback.format_exc())
                raise HTTPException(status_code=500, detail=f"Erreur serveur: {str(e)}")
        
        @self.app.websocket("/forensics/{guid}")
        async def task_updates(websocket: WebSocket, guid: str):
            logger.info(f"start of task_updates")
            try:
                # Accepter la connexion WebSocket
                logger.info(f"Client connecté pour la tâche {guid}")
                await websocket.accept()
                logger.info(f"Client accepté pour la tâche {guid}")
                
                # Valider que la tâche existe
                status = TaskManager.get_job_status(guid)
                if not status:
                    await websocket.close(code=1000, reason="Tâche introuvable")
                    return
               
                # Utiliser la fonction de streaming du TaskManager
                logger.info(f"Démarrage du streaming pour la tâche {guid}")
                try:
                    await TaskManager.stream_job_results(websocket, guid, False)
                    logger.info(f"Streaming terminé pour la tâche {guid}")
                except WebSocketDisconnect:
                    logger.info(f"Client déconnecté pour la tâche {guid} (WebSocketDisconnect)")
                except asyncio.CancelledError:
                    logger.info(f"Streaming annulé pour la tâche {guid} (CancelledError)")
                except Exception as e:
                    logger.error(f"Erreur pendant le streaming de la tâche {guid}: {e}")
                    logger.error(traceback.format_exc())
                    if websocket.client_state != WebSocketState.DISCONNECTED:
                        logger.info(f"Envoi d'un message d'erreur pour la tâche {guid}")
                        await websocket.send_json({
                            "type": "error",
                            "message": f"Erreur de streaming: {str(e)}"
                        })
                logger.info(f"Fin du streaming pour la tâche {guid}")

            except WebSocketDisconnect:
                logger.info(f"Client déconnecté pour la tâche {guid} (WebSocketDisconnect2)")
            
            except Exception as e:
                logger.error(f"Erreur WebSocket pour la tâche {guid}: {e}")
                logger.error(traceback.format_exc())
                
                # Tenter d'envoyer un message d'erreur avant de fermer
                try:
                    if websocket.client_state != WebSocketState.DISCONNECTED:
                        logger.info(f"Envoi d'un message d'erreur pour la tâche {guid}")
                        await websocket.send_json({
                            "type": "error",
                            "message": f"Erreur: {str(e)}"
                        })
                        await websocket.close(code=1011, reason="Erreur serveur")
                except:
                    logger.info(f"Erreur lors de la fermeture de la connexion pour la tâche {guid}")
            
            finally:
                logger.info(f"Client déconnecté pour la tâche {guid}")
                # S'assurer que la connexion est fermée
                if websocket.client_state != WebSocketState.DISCONNECTED:
                    await websocket.close(code=1000, reason="Streaming terminé")
            
            logger.info(f"end of task_updates")

        @self.app.delete("/forensics", tags=["forensics"])
        async def stop_all_task():
            try:
                cancelled = []
                for job_id in await TaskManager.get_jobs():
                    if TaskManager.get_job_status(job_id) in [JobStatus.PENDING, JobStatus.RECEIVED, JobStatus.STARTED, JobStatus.RETRY]:
                        await TaskManager.cancel_job(job_id)
                        cancelled.append(job_id)
                        
                return {"status": "ok", "cancelled_tasks": cancelled}
            
            except Exception as e:
                logger.error(f"Erreur lors de l'arrêt de toutes les tâches: {e}")
                logger.error(traceback.format_exc())
                raise HTTPException(status_code=500, detail=f"Erreur serveur: {str(e)}")
        
        @self.app.delete("/forensics/{guid}", tags=["forensics"])
        async def stop_task(guid: str):
            try:
                status = TaskManager.get_job_status(guid)
                if not status:
                    raise HTTPException(status_code=404, detail="Tâche introuvable")
                    
                if status in [JobStatus.PENDING, JobStatus.RECEIVED, JobStatus.STARTED, JobStatus.RETRY]:
                    success = await TaskManager.cancel_job(guid)
                    if success:
                        return {"guid": guid, "status": "cancelled"}
                    else:
                        raise HTTPException(status_code=500, detail="Échec de l'annulation")
                else:
                    return {"guid": guid, "status": status}
            
            except Exception as e:
                logger.error(f"Erreur lors de l'arrêt de la tâche {guid}: {e}")
                logger.error(traceback.format_exc())
                raise HTTPException(status_code=500, detail=f"Erreur serveur: {str(e)}")
        
        @self.app.get("/forensics/{guid}", tags=["forensics"])
        async def get_task(guid: str):
            try:
                status = TaskManager.get_job_status(guid)
                if not status:
                    raise HTTPException(status_code=404, detail="Tâche introuvable")
                    
                results = await TaskManager.get_job_results(guid)
                
                # Ne pas inclure les données binaires dans la réponse
                for result in results:
                    result.frame = None
                        
                return {
                    "guid": guid,
                    "status": status,
                    "results": results
                }
            
            except Exception as e:
                logger.error(f"Erreur lors de la récupération des résultats de la tâche {guid}: {e}")
                logger.error(traceback.format_exc())
                raise HTTPException(status_code=500, detail=traceback.format_exc())
        
        @self.app.get("/forensics/{guid}/frames/{frameId}", tags=["forensics"])
        async def get_frame(guid: str, frameId: str):
            try:
                frame = await TaskManager.get_frame(guid, frameId)

                if frame is None:
                    raise HTTPException(status_code=404, detail="Frame not found")

                return Response(content=frame, status_code=200, headers={"Content-Type": "image/jpeg"})
            except Exception as e:
                logger.error(f"Erreur lors de la récupération de la frame {frameId} pour la tâche {guid}: {e}")
                logger.error(traceback.format_exc())
                raise HTTPException(status_code=500, detail=traceback.format_exc())

    def __create_vms(self):
        async def get_vms_config():
            dal = GenericDAL()
            settings = await dal.async_get(Settings, key_index= "vms")
            if not settings or len(settings) != 1:
                raise Exception("VMS settings not found")
                
            settings_dict = settings[0].value_index
            logger.info(f"Settings: {settings_dict} {settings}")
            vms_host = settings_dict.get("ip", None)
            vms_port = settings_dict.get("port", None)
            vms_username = settings_dict.get("username", None)
            vms_password = settings_dict.get("password", None)
            vms_type = settings_dict.get("type", None)
            
            return vms_host, vms_port, vms_username, vms_password, vms_type

        @self.app.get("/vms/cameras", tags=["vms"])
        async def get_cameras():
            try:
                vms_host, vms_port, vms_username, vms_password, vms_type = await get_vms_config()
                if vms_host is None or vms_port is None:
                    raise HTTPException(status_code=400, detail="VMS IP or port not configured. Please configure VMS settings before trying to access cameras.")
                
                VMS = CameraClient.create(vms_host, vms_port, vms_username, vms_password, vms_type)
                async with VMS() as client:
                    return await client.get_system_info()
            except Exception as e:
                raise HTTPException(status_code=500, detail=traceback.format_exc())

        @self.app.get("/vms/cameras/{guuid}/live", tags=["vms"])
        async def get_live(guuid: str):
            vms_host, vms_port, vms_username, vms_password, vms_type = await get_vms_config()
            if vms_host is None or vms_port is None:
                raise HTTPException(status_code=400, detail="VMS IP or port not configured. Please configure VMS settings before trying to access cameras.")
            
            return HTTPException(status_code=501, detail="Not implemented")
            try:
                VMS = CameraClient.create(vms_host, vms_port, vms_username, vms_password, vms_type)
                async with VMS() as client:
                    streams = client.start_live(guuid)
                    img = await anext(streams)
                    _, bytes = cv2.imencode('.jpg', img)
                    return Response(content=bytes.tobytes(), status_code=200, headers={"Content-Type": "image/jpeg"})

            except Exception as e:
                raise HTTPException(status_code=500, detail=traceback.format_exc())

        @self.app.get("/vms/cameras/{guuid}/replay", tags=["vms"])
        async def get_replay(guuid: str, from_time: datetime.datetime, to_time: datetime.datetime, gap: int = 0):
            try:
                vms_host, vms_port, vms_username, vms_password, vms_type = await get_vms_config()
                if vms_host is None or vms_port is None:
                    raise HTTPException(status_code=400, detail="VMS IP or port not configured. Please configure VMS settings before trying to access cameras.")
                
                VMS = CameraClient.create(vms_host, vms_port, vms_username, vms_password, vms_type)
                async with VMS() as client:
                    streams = client.start_replay(guuid, from_time, to_time, gap)
                    img, _ = await anext(streams)
                    _, bytes = cv2.imencode('.jpg', img)
                    return Response(content=bytes.tobytes(), status_code=200, headers={"Content-Type": "image/jpeg"})
            except Exception as e:
                raise HTTPException(status_code=500, detail=traceback.format_exc())

    def __create_tabs(self):
        Model = create_model('TabModel',
            title=(str, Field(description="The title of the dashboard tab")),
            order=(Optional[int], Field(default=None, description="The order of the tab"))
        )

        @self.app.get("/dashboard/tabs", tags=["dashboard/tabs"])
        async def get_tabs():
            try:
                ret = {}
                dal = GenericDAL()
                query = await dal.async_get(Dashboard, _order='order')
                for row in query:
                    data = {}
                    for column in inspect(Dashboard).mapper.column_attrs:
                        if column.key not in ['id', 'timestamp']:
                            data[column.key] = getattr(row, column.key)

                    ret[row.id] = data
                return ret

            except ValueError as e:
                raise HTTPException(status_code=500, detail=traceback.format_exc())

        @self.app.post("/dashboard/tabs", tags=["dashboard/tabs"])
        async def add_tab(data: Model):
            try:
                dal = GenericDAL()
                tab = Dashboard(**data.dict(exclude_unset=True))
                guid = await dal.async_add(tab)
                tab.id = guid
                return tab
            except ValueError as e:
                raise HTTPException(status_code=500, detail=traceback.format_exc())

        @self.app.put("/dashboard/tabs/{id}", tags=["dashboard/tabs"])
        async def update_tab(id: str, data: Model):
            try:
                dal = GenericDAL()
                obj = await dal.async_get(Dashboard, id=id)
                if obj is None or len(obj) != 1:
                    raise HTTPException(status_code=404, detail="Tab not found")

                for field, value in data.dict(exclude_unset=True).items():
                    setattr(obj[0], field, value)

                return await dal.async_update(obj[0])
            except ValueError as e:
                raise HTTPException(status_code=500, detail=traceback.format_exc())

        @self.app.delete("/dashboard/tabs/{id}", tags=["dashboard/tabs"])
        async def delete_tab(id: str):
            try:
                dal = GenericDAL()
                obj = await dal.async_get(Dashboard, id=id)
                if obj is None or len(obj) != 1:
                    raise HTTPException(status_code=404, detail="Tab not found")
                return await dal.async_remove(obj[0])
            except ValueError as e:
                raise HTTPException(status_code=500, detail=traceback.format_exc())

    async def create_materialized_view(self, widget_id: str, table: str, aggregation: str, group_by: str = None):
        """Create a materialized view for a widget"""
        try:
            #Build the SQL query based on widget config
            group_clause = f", {group_by}" if group_by else ""
            group_by_clause = f"GROUP BY bucket{group_clause}" if group_by else "GROUP BY bucket"

            #Construct the SQL query
            sql = f"""
            CREATE MATERIALIZED VIEW "widget_{widget_id}" WITH (timescaledb.continuous) AS
            SELECT time_bucket('{aggregation}', timestamp) AS bucket,
                   count(timestamp) as counts
                   {group_by if group_by else ''}
            FROM {table.lower()}
            {group_by_clause};
            """

            sql2 = f"""
            SELECT add_continuous_aggregate_policy('widget_{widget_id}'::regclass,
              start_offset => NULL, 
              end_offset => '{aggregation}'::interval,
              schedule_interval => '{aggregation}'::interval);
            """
            # Execute the statement using SQLAlchemy
            session = GenericDAL.AsyncSession()
            conn = await session.connection()
            await conn.execution_options(isolation_level="AUTOCOMMIT").execute(text(sql))
            await conn.execution_options(isolation_level="AUTOCOMMIT").execute(text(sql2))

            logger.info(f"Create materialized view {widget_id} with aggregation {aggregation} for widget {widget_id}")
            return True
        except Exception as e:
            logger.error(f'Failed to create materialized view for widget {widget_id}: {e}')
            logger.error(traceback.format_exc())
            return False
        
    def __create_widgets(self):
        fields = {}
        for column in inspect(Widget).mapper.column_attrs:
            if column.key not in ['id', 'dashboard_id']:
                python_type = column.expression.type.python_type
                if isinstance(column.expression.type, JSON):
                    fields[column.key] = (Optional[Union[Dict[str, Any], List[Dict[str, Any]]]], Field(default=None))
                elif column.expression.nullable:
                    fields[column.key] = (Optional[python_type], Field(default=None, description=f"The {column.key} of the widget"))
                else:
                    fields[column.key] = (python_type, Field(description=f"The {column.key} of the widget") )

        Model = create_model('WidgetModel', **fields)

        @self.app.get("/dashboard/tabs/{id}/widgets", tags=["dashboard/tabs/widgets"])
        async def get_widgets(id: str):
            try:
                dal = GenericDAL()
                return await dal.async_get(Widget, dashboard_id=id, _order='order')

            except ValueError as e:
                raise HTTPException(status_code=500, detail=traceback.format_exc())

        @self.app.post("/dashboard/tabs/{id}/widgets", tags=["dashboard/tabs/widgets"])
        async def add_widget(id: str, data: Model):
            try:
                dal = GenericDAL()
                dashboard = await dal.async_get(Dashboard, id=id)
                if not dashboard or len(dashboard) != 1:
                    raise HTTPException(status_code=404, detail="Dashboard tab not found")

                widget = Widget(
                    dashboard_id=id,
                    **data.dict()
                )
                guid = await dal.async_add(widget)
                widget.id = guid

                # creation de la vue matérialisée
                await self.create_materialized_view(
                    str(guid),
                    widget.table,
                    widget.aggregation,
                    widget.groupBy if hasattr(widget, "groupBy") else None
                )

                return widget
            except ValueError as e:
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.put("/dashboard/tabs/{id}/widgets", tags=["dashboard/tabs/widgets"])
        async def update_all_widgets(id: str, data: list[Model]):
            try:
                dal = GenericDAL()

                dashboard = await dal.async_get(Dashboard, id=id)
                if not dashboard or len(dashboard) != 1:
                    raise HTTPException(status_code=404, detail="Dashboard tab not found")

                current_widgets = await dal.async_get(Widget, dashboard_id=id)
                for widget in current_widgets:
                    await dal.async_remove(widget)

                for widget_data in data:
                    widget = Widget(
                        dashboard_id=id,
                        **widget_data.dict()
                    )
                    await dal.async_add(widget)

                return True

            except ValueError as e:
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.patch("/dashboard/tabs/{id}/widgets", tags=["dashboard/tabs/widgets"])
        async def patch_all_widgets(id: str, data: list[dict]):
            try:
                dal = GenericDAL()

                # Verify dashboard exists
                dashboard = await dal.async_get(Dashboard, id=id)
                if not dashboard or len(dashboard) != 1:
                    raise HTTPException(status_code=404, detail="Dashboard tab not found")

                # Validate all widgets must have an id
                for widget_data in data:
                    if 'id' not in widget_data:
                        raise HTTPException(status_code=400, detail="Each widget must have an id")

                # Validate and prepare widgets
                widgets_to_update = []
                for widget_data in data:
                    widget_id = widget_data.pop('id')  # Remove id from update data

                    # Get existing widget
                    widget = await dal.async_get(Widget, id=widget_id)
                    if widget is None or len(widget) != 1:
                        raise HTTPException(status_code=404, detail=f"Widget {widget_id} not found")

                    widget = widget[0]
                    # Verify widget belongs to the specified dashboard
                    if str(widget.dashboard_id) != id:
                        raise HTTPException(
                            status_code=400,
                            detail=f"Widget {widget_id} does not belong to specified dashboard"
                        )

                    # Update fields in memory
                    for field, value in widget_data.items():
                        if hasattr(widget, field):
                            setattr(widget, field, value)

                    widgets_to_update.append(widget)

                # All validations passed, perform updates
                return [await dal.async_update(widget) for widget in widgets_to_update]

            except ValueError as e:
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.put("/dashboard/tabs/{id}/widgets/{widget_id}", tags=["dashboard/tabs/widgets"])
        async def update_widget(id: str, widget_id: str, data: Model):
            try:
                dal = GenericDAL()

                widget = await dal.async_get(Widget, id=widget_id)
                if widget is None or len(widget) != 1:
                    raise HTTPException(status_code=404, detail="Widget not found")

                widget = widget[0]
                if str(widget.dashboard_id) != id:
                    raise HTTPException(status_code=400, detail="Widget does not belong to specified dashboard")

                for field, value in data.dict().items():
                    setattr(widget, field, value)

                res = await dal.async_update(widget)
                return res

            except ValueError as e:
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.delete("/dashboard/tabs/{id}/widgets/{widget_id}", tags=["dashboard/tabs/widgets"])
        async def delete_widget(id: str, widget_id: str):
            try:
                dal = GenericDAL()
                obj = await dal.async_get(Widget, id=widget_id)
                if obj is None or len(obj) != 1:
                    raise HTTPException(status_code=404, detail="Widget not found")
                return await dal.async_remove(obj[0])
            except ValueError as e:
                raise HTTPException(status_code=500, detail=str(e))

    def __create_settings(self):
        """Create endpoints to manage dashboard settings"""
        
        Model = create_model('SettingsModel',
            value=(Union[Dict[str, Any], List[Any], str, int, bool, None], Field(description="Setting value (can be any JSON value)"))
        )

        @self.app.get("/dashboard/settings", tags=["dashboard/settings"])
        async def get_settings():
            try:
                dal = GenericDAL()
                settings = await dal.async_get(Settings)
                
                # Return the first settings object
                result = {}
                for setting in settings:
                    result[setting.key_index] = setting.value_index
                
                return result

            except ValueError as e:
                logger.error(f"Error retrieving dashboard settings: {str(e)}")
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.put("/dashboard/settings/{key}", tags=["dashboard/settings"])
        async def update_settings(key: str, data: Model):
            """Update a specific setting by key"""
            try:
                dal = GenericDAL()
                settings = await dal.async_get(Settings)
                
                setting = next((s for s in settings if s.key_index == key), None)
                
                if not setting:
                    logger.error(f"Setting parameter '{key}' not found")
                    raise HTTPException(
                        status_code=404, 
                        detail=f"Setting '{key}' not found"
                    )
                
                setting.value_index = data.value
                await dal.async_update(setting)
            
                return {"status": "success", "key": key, "value": data.value}
                
            except ValueError as e:
                logger.error(f"Error updating setting '{key}': {str(e)}")
                raise HTTPException(status_code=500, detail=str(e))
        
    def __create_endpoint(self, path: str, model_class: Type, agg_func=None):
        query = {}
        for column in inspect(model_class).mapper.column_attrs:
            if column.key not in ['id', 'timestamp'] and 'url' not in column.key:
                python_type = column.expression.type.python_type
                query[column.key] = (Optional[Union[python_type, List[python_type]]], Field(default=None, description=f"Filter by {column.key}"))

                if path not in self.__registered_dashboard:
                    self.__registered_dashboard[path] = []
                self.__registered_dashboard[path].append(column.key)

        aggregate = (ModelName, Field(default=ModelName.hour, description="The time interval to aggregate the data"))
        group = (str, Field(default=None, description="The column to group by"))
        date = (datetime.datetime, Field(default=None, description="The timestamp to filter by"))

        AggregateParam = create_model(f"{model_class.__name__}Aggregate", aggregate=aggregate, group_by=group, time_from=date, time_to=date, **query)
        @self.app.get("/dashboard/widgets/" + path, tags=["dashboard"])
        async def get_bucket(kwargs: Annotated[AggregateParam, Query()]):
            try:
                time = kwargs.aggregate
                between = kwargs.time_from, kwargs.time_to
                group_by = kwargs.group_by.split(",") if kwargs.group_by is not None else None
                where = {k: v for k, v in kwargs if v is not None and k in query}

                dal = GenericDAL()

                aggregation = agg_func if agg_func is not None else func.count(model_class.id)

                cursor = await dal.async_get_bucket(model_class, _func=aggregation, _time=time, _group=group_by, _between=between, **where)

                ret = []
                for row in cursor:
                    data = {
                        "timestamp": row[0],
                        "count": row[1]
                    }
                    if group_by is not None:
                        for idx, group in enumerate(group_by):
                            data[group] = row[idx + 2]

                    ret.append(data)

                return ret
            except ValueError as e:
                raise HTTPException(status_code=500, detail=str(e))

    def start(self, host="0.0.0.0", port=5020):
        uvicorn.run(self.app, host=host, port=port, root_path="/front-api", ws_ping_interval=30, ws_ping_timeout=30)

class ThreadedFastAPIServer(BaseApplication):
    def __init__(self, event_grabber, threads=1, workers=2):
        self.api_server = FastAPIServer(event_grabber)
        self.options = {
            "workers": workers,
            "worker_connections": workers*256,
            "threads": threads,
            "worker_class": "uvicorn.workers.UvicornWorker",
            "preload_app": True,
            "accesslog": "-",
            "errorlog": "-",
            "loglevel": "info",
            "worker_options": {
                "ws_ping_interval": 30,
                "ws_ping_timeout": 30
            }
        }
        super().__init__()

    def load_config(self):
        for key, value in self.options.items():
            if key in self.cfg.settings and value is not None:
                self.cfg.set(key.lower(), value)

    def load(self):
        return self.api_server.app
    
    def start(self, host="0.0.0.0", port=5020):
        self.options["bind"] = f"{host}:{port}"
        if "root_path" not in self.options:
            self.options["root_path"] = "/front-api"

        self.load_config()
        self.run()