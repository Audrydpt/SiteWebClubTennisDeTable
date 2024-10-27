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
from database import Dashboard, GenericDAL, Widget
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
        
        self.__registered_dashboard = {}
        self.__define_endpoints()

    def __define_endpoints(self):

        @self.app.get("/", include_in_schema=False)
        async def custom_swagger_ui_html():
            return get_custom_swagger_ui_html(openapi_url="openapi.json", title=self.app.title + " - Swagger UI",)

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

        @self.app.get("/dashboard/widgets", tags=["/dashboard"])
        async def get_dashboard():
            return self.__registered_dashboard

        self.__create_tabs()
        self.__create_widgets()
    
    def __create_tabs(self):
        @self.app.get("/dashboard/tabs", tags=["/dashboard/tabs"])
        async def get_tabs():
            try:

                ret = {}
                dal = GenericDAL()
                for row in dal.get(Dashboard):
                    data = {}
                    for column in inspect(Dashboard).mapper.column_attrs:
                        if column.key not in ['id', 'timestamp']:
                            data[column.key] = getattr(row, column.key)

                    ret[row.id] = data
                return ret

            except ValueError as e:
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.post("/dashboard/tabs", tags=["/dashboard/tabs"])
        async def add_tab(title: str):
            try:
                dal = GenericDAL()
                tab = Dashboard(title=title)
                return dal.add(tab)
            except ValueError as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.put("/dashboard/tabs/{id}", tags=["/dashboard/tabs"])
        async def update_tab(id: str, title: str):
            try:
                dal = GenericDAL()
                obj = dal.get(Dashboard, id=id)
                if obj is None or len(obj) != 1:
                    raise HTTPException(status_code=404, detail="Tab not found")
                obj[0].title = title
                return dal.update(obj[0])
            except ValueError as e:
                raise HTTPException(status_code=500, detail=str(e))
            
        @self.app.delete("/dashboard/tabs/{id}", tags=["/dashboard/tabs"])
        async def delete_tab(id: str):
            try:
                dal = GenericDAL()
                obj = dal.get(Dashboard, id=id)
                if obj is None or len(obj) != 1:
                    raise HTTPException(status_code=404, detail="Tab not found")
                return dal.remove(obj[0])
            except ValueError as e:
                raise HTTPException(status_code=500, detail=str(e))
        
    def __create_widgets(self):
        fields = {}
        for column in inspect(Widget).mapper.column_attrs:
            if column.key not in ['id', 'dashboard_id']: 
                python_type = column.expression.type.python_type
                fields[column.key] = (python_type, Field(description=f"The {column.key} of the widget") )

        Model = create_model('WidgetModel', **fields)

        @self.app.get("/dashboard/tabs/{id}/widgets", tags=["/dashboard/tabs/widgets"])
        async def get_widgets(id: str):
            try:
                dal = GenericDAL()
                return dal.get(Widget, dashboard_id=id)

            except ValueError as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.post("/dashboard/tabs/{id}/widgets", tags=["/dashboard/tabs/widgets"])
        async def add_widget(id: str, data: Model):
            try:
                dal = GenericDAL()
                dashboard = dal.get(Dashboard, id=id)
                if not dashboard or len(dashboard) != 1:
                    raise HTTPException(status_code=404, detail="Dashboard tab not found")
                
                widget = Widget(
                    dashboard_id=id,
                    **data.dict()
                )
                return dal.add(widget)
            except ValueError as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.put("/dashboard/tabs/{id}/widgets", tags=["/dashboard/tabs/widgets"])
        async def update_all_widgets(id: str, data: list[Model]):
            try:
                dal = GenericDAL()
                
                dashboard = dal.get(Dashboard, id=id)
                if not dashboard or len(dashboard) != 1:
                    raise HTTPException(status_code=404, detail="Dashboard tab not found")
                    
                current_widgets = dal.get(Widget, dashboard_id=id)
                for widget in current_widgets:
                    dal.remove(widget)
                    
                for widget_data in data:
                    widget = Widget(
                        dashboard_id=id,
                        **widget_data.dict()
                    )
                    dal.add(widget)
                    
                return True
                
            except ValueError as e:
                raise HTTPException(status_code=500, detail=str(e))
            
        @self.app.put("/dashboard/tabs/{id}/widgets/{widget_id}", tags=["/dashboard/tabs/widgets"])
        async def update_widget(id: str, widget_id: str, data: Model):
            try:
                dal = GenericDAL()
                
                widget = dal.get(Widget, id=widget_id)
                if widget is None or len(widget) != 1:
                    raise HTTPException(status_code=404, detail="Widget not found")
                    
                widget = widget[0]
                if str(widget.dashboard_id) != id:
                    raise HTTPException(status_code=400, detail="Widget does not belong to specified dashboard")
                    
                for field, value in data.dict().items():
                    setattr(widget, field, value)
                
                return dal.update(widget)
                
            except ValueError as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.delete("/dashboard/tabs/{id}/widgets/{widget_id}", tags=["/dashboard/tabs/widgets"])
        async def delete_widget(id: str, widget_id: str):
            try:
                dal = GenericDAL()
                obj = dal.get(Widget, id=widget_id)
                if obj is None or len(obj) != 1:
                    raise HTTPException(status_code=404, detail="Widget not found")
                return dal.remove(obj[0])
            except ValueError as e:
                raise HTTPException(status_code=500, detail=str(e))
        
    def __create_endpoint(self, path: str, model_class: Type):
        query = {}
        for column in inspect(model_class).mapper.column_attrs:
            if column.key not in ['id', 'timestamp'] and 'url' not in column.key:
                python_type = column.expression.type.python_type
                query[column.key] = (Optional[python_type], Field(default=None, description=f"Filter by {column.key}"))

                if path not in self.__registered_dashboard:
                    self.__registered_dashboard[path] = []
                self.__registered_dashboard[path].append(column.key)
        
        aggregate = (ModelName, Field(default=ModelName.hour, description="The time interval to aggregate the data"))
        group = (str, Field(default=None, description="The column to group by"))
        date = (datetime.datetime, Field(default=None, description="The timestamp to filter by"))
        
        AggregateParam = create_model(f"{model_class.__name__}Aggregate", aggregate=aggregate, group_by=group, time_from=date, time_to=date, **query)
        @self.app.get("/dashboard/widgets/" + path, tags=["/dashboard"])
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

    def start(self, host="0.0.0.0", port=5000):
        uvicorn.run(self.app, host=host, port=port, root_path="/front-api")