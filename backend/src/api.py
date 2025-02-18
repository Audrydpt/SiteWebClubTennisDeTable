import os
import datetime
from fastapi.staticfiles import StaticFiles


from pydantic import Field, create_model
from sqlalchemy import func, JSON
import uvicorn
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from typing import Annotated, Literal, Optional, Type, Union, List, Dict, Any
from sqlalchemy.inspection import inspect
from enum import Enum

from swagger import get_custom_swagger_ui_html
from event_grabber import EventGrabber
from database import Dashboard, GenericDAL, Widget
from database import AcicAllInOneEvent, AcicCounting, AcicEvent, AcicLicensePlate, AcicNumbering, AcicOCR, AcicOccupancy, AcicUnattendedItem

import requests

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

        @self.app.get("/health", include_in_schema=False)
        async def health():
            grabbers = {}
            for grabber in self.event_grabber.get_grabbers():
                grabbers[grabber.acichost] = "ok" if grabber.is_long_running() else "error"

            return {
                "api": "ok",
                "database": "ok",
                "grabbers": grabbers
            }


        @self.app.get("/health/aiServer/{ip}")
        async def health_ai_server(ip: str):
            try:
                username = "administrator"
                password = "ACIC"

                ai_service_url = f"https://{ip}/api/aiService"
                response = requests.get(ai_service_url, auth=(username, password), headers={"Accept": "application/json"},
                                        verify=False, timeout=3)

                if response.status_code != 200:
                    return {"status": "error", "message": "Impossible to get AI IP"}

                ai_data = response.json()
                ai_ip = ai_data["address"]
                ai_port = ai_data["port"]

                describe_url = f"http://{ai_ip}:{ai_port}/describe"
                describe_response = requests.get(describe_url, timeout=3)

                if describe_response.status_code == 200:
                    return {"status": "ok"}
                else:
                    return {"status": "error", "message": "AI service /describe endpoint not responding"}

            except requests.exceptions.RequestException as e:
                return {"status": "error", "message": f"Request failed: {str(e)}"}

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
                            "last_ping": grabber.time_last_ping,
                            "last_event": grabber.time_last_event,
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

        @self.app.get("/dashboard/widgets", tags=["/dashboard"])
        async def get_dashboard():
            return self.__registered_dashboard

        self.__create_tabs()
        self.__create_widgets()

    def __create_tabs(self):
        Model = create_model('TabModel',
            title=(str, Field(description="The title of the dashboard tab")),
            order=(Optional[int], Field(default=None, description="The order of the tab"))
        )

        @self.app.get("/dashboard/tabs", tags=["/dashboard/tabs"])
        async def get_tabs():
            try:
                ret = {}
                dal = GenericDAL()
                query = dal.get(Dashboard, _order='order')
                for row in query:
                    data = {}
                    for column in inspect(Dashboard).mapper.column_attrs:
                        if column.key not in ['id', 'timestamp']:
                            data[column.key] = getattr(row, column.key)

                    ret[row.id] = data
                return ret

            except ValueError as e:
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.post("/dashboard/tabs", tags=["/dashboard/tabs"])
        async def add_tab(data: Model):
            try:
                dal = GenericDAL()
                tab = Dashboard(**data.dict(exclude_unset=True))
                guid = dal.add(tab)
                tab.id = guid
                return tab
            except ValueError as e:
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.put("/dashboard/tabs/{id}", tags=["/dashboard/tabs"])
        async def update_tab(id: str, data: Model):
            try:
                dal = GenericDAL()
                obj = dal.get(Dashboard, id=id)
                if obj is None or len(obj) != 1:
                    raise HTTPException(status_code=404, detail="Tab not found")

                for field, value in data.dict(exclude_unset=True).items():
                    setattr(obj[0], field, value)

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
                if isinstance(column.expression.type, JSON):
                    fields[column.key] = (Optional[Union[Dict[str, Any], List[Dict[str, Any]]]], Field(default=None))
                elif column.expression.nullable:
                    fields[column.key] = (Optional[python_type], Field(default=None, description=f"The {column.key} of the widget"))
                else:
                    fields[column.key] = (python_type, Field(description=f"The {column.key} of the widget") )

        Model = create_model('WidgetModel', **fields)

        @self.app.get("/dashboard/tabs/{id}/widgets", tags=["/dashboard/tabs/widgets"])
        async def get_widgets(id: str):
            try:
                dal = GenericDAL()
                return dal.get(Widget, dashboard_id=id, _order='order')

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
                guid = dal.add(widget)
                widget.id = guid
                return widget
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

        @self.app.patch("/dashboard/tabs/{id}/widgets", tags=["/dashboard/tabs/widgets"])
        async def patch_all_widgets(id: str, data: list[dict]):
            try:
                dal = GenericDAL()

                # Verify dashboard exists
                dashboard = dal.get(Dashboard, id=id)
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
                    widget = dal.get(Widget, id=widget_id)
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
                return [dal.update(widget) for widget in widgets_to_update]

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
        @self.app.get("/dashboard/widgets/" + path, tags=["/dashboard"])
        async def get_bucket(kwargs: Annotated[AggregateParam, Query()]):
            try:
                time = kwargs.aggregate
                between = kwargs.time_from, kwargs.time_to
                group_by = kwargs.group_by.split(",") if kwargs.group_by is not None else None
                where = {k: v for k, v in kwargs if v is not None and k in query}

                dal = GenericDAL()

                aggregation = agg_func if agg_func is not None else func.count(model_class.id)

                ret = []
                for row in dal.get_bucket(model_class, _func=aggregation, _time=time, _group=group_by, _between=between, **where):
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
        uvicorn.run(self.app, host=host, port=port, root_path="/front-api")