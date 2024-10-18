import os
import datetime
from fastapi.staticfiles import StaticFiles


from pydantic import Field, create_model
from sqlalchemy import func
import uvicorn
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from typing import Annotated, Optional, Type
from sqlalchemy.inspection import inspect
from enum import Enum

from swagger import get_custom_swagger_ui_html
from event_grabber import EventGrabber
from database import GenericDAL
from database import AcicAllInOneEvent, AcicCounting, AcicEvent, AcicLicensePlate, AcicNumbering, AcicOCR, AcicOccupancy, AcicUnattendedItem

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
            })

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

        self.__define_endpoints()

    def __define_endpoints(self):

        @self.app.get("/", include_in_schema=False)
        async def custom_swagger_ui_html():
            return get_custom_swagger_ui_html(openapi_url=self.app.openapi_url, title=self.app.title + " - Swagger UI",)

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
        
        self.__create_endpoint("AcicUnattendedItem", AcicUnattendedItem)
        self.__create_endpoint("AcicCounting", AcicCounting)
        self.__create_endpoint("AcicNumbering", AcicNumbering)
        self.__create_endpoint("AcicOccupancy", AcicOccupancy)
        self.__create_endpoint("AcicLicensePlate", AcicLicensePlate)
        self.__create_endpoint("AcicOCR", AcicOCR)
        self.__create_endpoint("AcicAllInOneEvent", AcicAllInOneEvent)
        self.__create_endpoint("AcicEvent", AcicEvent)


    def __create_endpoint(self, path: str, model_class: Type):

        query = {}
        for column in inspect(model_class).mapper.column_attrs:
            if column.key not in ['id', 'timestamp'] and 'url' not in column.key:
                python_type = column.expression.type.python_type
                query[column.key] = (Optional[python_type], Field(default=None, description=f"Filter by {column.key}"))

        aggregate = (ModelName, Field(default=ModelName.hour, description="The time interval to aggregate the data"))
        group = (str, Field(default=None, description="The column to group by"))
        date = (datetime.datetime, Field(default=None, description="The timestamp to filter by"))
        
        AggregateParam = create_model(f"{model_class.__name__}Aggregate", aggregate=aggregate, group_by=group, time_from=date, time_to=date, **query)
        @self.app.get("/dashboard/" + path, tags=["dashboard"])
        async def get_bucket(kwargs: Annotated[AggregateParam, Query()]):
            try:
                time = kwargs.aggregate
                between = kwargs.time_from, kwargs.time_to
                group_by = kwargs.group_by.split(",") if kwargs.group_by is not None else None
                where = {k: v for k, v in kwargs if v is not None and k in query}

                dal = GenericDAL()

                ret = []
                for row in dal.get_bucket(model_class, _func=func.count(model_class.id), _time=time, _group=group_by, _between=between, **where):
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


        FilterParam = create_model(f"{model_class.__name__}Query", **query)
        @self.app.get("/test/" + path, tags=["test_do_not_use"])
        async def get_all(kwargs: Annotated[FilterParam, Query()]):
            try:
                where = {k: v for k, v in kwargs if v is not None and k in query}
                fields = [column.key for column in inspect(model_class).mapper.column_attrs if column.key != 'id']

                dal = GenericDAL()

                ret = []
                for row in dal.get(model_class, **where):
                    row_data = {field: getattr(row, field) for field in fields}
                    ret.append(row_data)

                return ret
            except ValueError as e:
                raise HTTPException(status_code=500, detail=str(e))
        

    def start(self, host="0.0.0.0", port=5000):
        uvicorn.run(self.app, host=host, port=port)