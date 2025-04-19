import os
from enum import Enum

import cv2
from dotenv import load_dotenv
from fastapi.params import Depends
import numpy as np
import requests

from fastapi import APIRouter, UploadFile, Request
from fastapi.responses import Response

from service_ai import ServiceAI

class Settings:

    def __init__(self):
        load_dotenv()
        self.host = os.getenv("AI_HOST", "127.0.0.1")
        self.port = os.getenv("AI_PORT", 53211)
        self.version = [1, 5, 0]

        try:
            data = requests.get(f"http://{self.host}:{self.port}/describe").json()
            version_str = data["version"]
            self.version = [int(x) for x in version_str.split(".")]
        except:
            pass


settings = Settings()

app = APIRouter(
    prefix="/aiservice",
    tags=["ai"]
)

def update_settings():
    try:
        host = os.getenv("DB_HOST", "127.0.0.1")
        data = requests.get(f"http://administrator:ACIC@{host}:8444/aiService")
        data = data.json()
        settings.host = data['address']
        settings.port = data['port']
        version_str = data["version"]
        settings.version = [int(x) for x in version_str.split(".")]

    except:
        pass

#@app.get("/networks", include_in_schema=settings.version[0] < 2)
@app.get("/models", include_in_schema=settings.version[0] >= 2)
async def get_models(request: Request):
    uri = "models" if settings.version[0] >= 2 else "networks"
    return requests.get(f"http://{settings.host}:{settings.port}/{uri}").json()


#@app.put("/networks", include_in_schema=settings.version[0] < 2)
@app.put("/models", include_in_schema=settings.version[0] >= 2)
async def put_models(request: Request, model: UploadFile):
    uri = "models" if settings.version[0] >= 2 else "networks"
    content = await model.read()
    data = requests.put(f"http://{settings.host}:{settings.port}/{uri}",
            files={"upload": (model.filename, content, model.content_type)}
    )
    return data.text


#@app.delete("/networks/{name}", include_in_schema=settings.version[0] < 2)
@app.delete("/models/{name}", include_in_schema=settings.version[0] >= 2)
async def delete_models(request: Request, name: str):
    uri = "models" if settings.version[0] >= 2 else "networks"
    return requests.delete(f"http://{settings.host}:{settings.port}/{uri}/{name}")

#@app.get("/describe", include_in_schema=settings.version[0] < 2, dependencies=[Depends(update_settings)])
@app.get("/networks", include_in_schema=settings.version[0] >= 2, dependencies=[Depends(update_settings)])
async def describe(request: Request):
    uri = "networks" if settings.version[0] >= 2 else "describe"
    return requests.get(f"http://{settings.host}:{settings.port}/{uri}").json()


#@app.post("/{model}", include_in_schema=settings.version[0] < 2)
@app.post("/networks/{model}", include_in_schema=(settings.version[0] >= 2))
async def process(request: Request,
                  image: UploadFile, model: str,
                  confidenceThreshold: float = 0.15, overlapThreshold: float = 0.3):
    
    uri = f"/{model}"
    bytes = await image.read()
    frame = cv2.imdecode(np.frombuffer(bytes, np.uint8), cv2.IMREAD_COLOR)

    async with ServiceAI(settings.host, settings.port, uri, uri, uri) as client:
        data = await client.send(frame, confidenceThreshold, overlapThreshold)
        return data
    return None


#@app.post("/{model}/demo", include_in_schema=settings.version[0] < 2)
@app.post("/networks/{model}/demo", include_in_schema=(settings.version[0] >= 2))
async def process(request: Request,
                  image: UploadFile, model: str,
                  confidenceThreshold: float = 0.15, overlapThreshold: float = 0.3):
    
    uri = f"/{model}"
    bytes = await image.read()
    frame = cv2.imdecode(np.frombuffer(bytes, np.uint8), cv2.IMREAD_COLOR)

    async with ServiceAI(settings.host, settings.port, uri, uri, uri) as client:
        data = await client.detect(frame)
        for obj in data:
            bbox = client.get_pixel_bbox(frame, obj)
            prob = obj["bbox"]["probabilities"]
            name = list(prob.keys())[0]
            conf = prob[name]
            
            if conf > confidenceThreshold:
                top, bottom, left, right = bbox
                cv2.rectangle(frame, (left, top), (right, bottom), (0, 0, 255), 2)
                cv2.putText(frame, name, (left, top), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)
                
        return Response(content=cv2.imencode(".jpg", frame)[1].tobytes(), media_type="image/jpeg")
        
    return None



if settings.version[0] >= 2:
    class LogKind(str, Enum):
        system = "system"
        result = "result"
        process = "process"
        model = "ModelOptimizer"

    @app.get("/logs/{kind}")
    async def log(kind: LogKind = LogKind.system):
        return requests.get(f"http://{settings.host}:{settings.port}/logs/{kind}").text.split("\n")[-1000:]
else:
    @app.get("/systemlog")
    @app.get("/resultslog")
    @app.get("/processlog")
    async def log(request: Request):
        kind = request.url.path.split("/")[-1]
        return requests.get(f"http://{settings.host}:{settings.port}/{kind}").text.split("\n")[-1000:]


if settings.version[0] >= 2:
    class TopFormat(str, Enum):
        json = "json"
        txt = "txt"

    class DurationFormat(str, Enum):
        sec = "sec"
        hour = "hour"

    @app.get("/top")
    async def top(fmt: TopFormat, d: DurationFormat = DurationFormat.sec):
        data = requests.get(f"http://{settings.host}:{settings.port}/top?fmt={fmt.value}&d={d.value}")
        # sec, min, hour
        return Response(content=data.text, media_type=data.headers["Content-Type"])
else:
    @app.get("/top")
    async def top():
        return requests.get(f"http://{settings.host}:{settings.port}/top").text


if settings.version[0] >= 2:
    @app.get("/optimizer")
    async def optimizer():
        return requests.get(f"http://{settings.host}:{settings.port}/optimizer").json()

def get_routes():
    return [app]