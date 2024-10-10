from fastapi.routing import APIRoute
from pydantic import create_model
from sqlalchemy import func
import uvicorn
from fastapi import Depends, FastAPI, HTTPException, Query
from typing import Annotated, Any, List, Dict, Optional, Type
from sqlalchemy.inspection import inspect
from enum import Enum


from event_grabber import EventGrabber
from database import Base, GenericDAL
from database import AcicAllInOneEvent, AcicCounting, AcicEvent, AcicLicensePlate, AcicNumbering, AcicOCR, AcicOccupancy, AcicUnattendedItem

class ModelName(str, Enum):
    minute = "1 minute"
    hour = "1 hour"
    day = "1 day"
    week = "1 week"
    month = "1 month"
    year = "1 year"

# Please follow: https://www.belgif.be/specification/rest/api-guide/#resource-uri
class FastAPIServer:
    def __init__(self, event_grabber:EventGrabber):
        self.event_grabber = event_grabber
        self.app = FastAPI(docs_url="/", redoc_url=None)
        self.__define_endpoints()

    def __define_endpoints(self):
        self.__create_endpoint("AcicUnattendedItem", AcicUnattendedItem)
        self.__create_endpoint("AcicCounting", AcicCounting)
        self.__create_endpoint("AcicNumbering", AcicNumbering)
        self.__create_endpoint("AcicOccupancy", AcicOccupancy)
        self.__create_endpoint("AcicLicensePlate", AcicLicensePlate)
        self.__create_endpoint("AcicOCR", AcicOCR)
        self.__create_endpoint("AcicAllInOneEvent", AcicAllInOneEvent)
        self.__create_endpoint("AcicEvent", AcicEvent)

        @self.app.get("/servers/grabbers", tags=["servers"])
        async def get_all_servers():
            try:
                ret = []

                for grabber in self.event_grabber.get_grabbers():
                    ret.append({
                        "type": grabber.hosttype,
                        "host": grabber.acichost,
                        "ports": {
                            "http": grabber.acicaliveport,
                            "https": 443,
                            "streaming": grabber.acichostport
                        }
                    })
                
                return ret


            except ValueError as e:
                raise HTTPException(status_code=500, detail=str(e))


    def __create_endpoint(self, path: str, model_class: Type):

        query = {}
        for column in inspect(model_class).mapper.column_attrs:
            if column.key not in ['id', 'timestamp'] and 'url' not in column.key:
                python_type = column.expression.type.python_type
                query[column.key] = (Optional[python_type], None)
        
        FilterParam = create_model(f"{model_class.__name__}Query", **query)

        @self.app.get("/test/" + path, tags=["test_do_not_use"])
        async def get_all(query: Annotated[FilterParam, Query()]): # type: ignore
            try:
                dal = GenericDAL()

                # Récupérer les colonnes de la classe de modèle
                fields = [column.key for column in inspect(model_class).mapper.column_attrs if column.key != 'id']

                filter_kwargs = {}
                filter_kwargs.update({k: v for k, v in query if v is not None})

                ret = []
                for row in dal.get(model_class, **filter_kwargs):
                    row_data = {field: getattr(row, field) for field in fields}
                    ret.append(row_data)

                return ret
            except ValueError as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.get("/dashboard/" + path, tags=["dashboard"])
        async def get_bucket(aggregate: ModelName = Query(ModelName.hour)):
            try:
                dal = GenericDAL()

                ret = []
                for row in dal.get_bucket(model_class, _func=func.count(model_class.id), _time=aggregate):
                    ret.append({
                        "timestamp": row[0],
                        "count": row[1]
                    })

                return ret
            except ValueError as e:
                raise HTTPException(status_code=500, detail=str(e))
        

    def start(self, host="0.0.0.0", port=5000):
        uvicorn.run(self.app, host=host, port=port)