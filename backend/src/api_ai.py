import json
import os
import io
import time
import random
from enum import Enum

import requests

from PIL import Image
import uvicorn
import asyncio

from fastapi import FastAPI, UploadFile, Request
from fastapi.responses import FileResponse, Response
from pydantic_settings import BaseSettings, SettingsConfigDict
from starlette.background import BackgroundTask


class Settings(BaseSettings):
    host: str = "127.0.0.1"
    port: int = 53211
    version: [int] = [1, 4, 0]
    models: [str] = []
    model_config = SettingsConfigDict(env_file=".env")

    def __init__(self):
        super().__init__()
        self.version = [1, 4, 0]
        self.models = []

        try:
            data = requests.get(f"http://{self.host}:{self.port}/describe").json()

            try:
                for key in data:
                    if key.startswith("/"):
                        self.models.append(key[1:])
            except:
                pass

            try:
                version_str = data["version"]
                self.version = [int(x) for x in version_str.split(".")]
            except:
                pass

        except:
            pass


settings = Settings()
DynamicModelName = Enum('DynamicModelName', {model.upper(): model for model in settings.models})
app = FastAPI(docs_url="/", redoc_url=None, debug=True, title="ACIC Inference Server API", swagger_ui_parameters={}, version=".".join(str(x) for x in settings.version))
queue = asyncio.Queue()


@app.webhooks.post("/callback")
@app.post("/callback", include_in_schema=False)
async def callback(request: Request):
    data = await request.json()
    uuid = data["uuid"]

    await queue.put((uuid, data))
    return True


@app.webhooks.get("/images/{uuid}.jpg")
@app.get("/images/{uuid}.jpg", include_in_schema=False)
async def images(uuid: str):
    path = f"/tmp/{uuid}.jpg"
    # remove file after serving
    return FileResponse(path, background=BackgroundTask(lambda: os.remove(path)))


@app.get("/networks", include_in_schema=settings.version[0] < 2)
@app.get("/models", include_in_schema=settings.version[0] >= 2)
async def get_models(request: Request):
    uri = request.url.path.removeprefix("/")
    return requests.get(f"http://{settings.host}:{settings.port}/{uri}").json()


@app.put("/networks", include_in_schema=settings.version[0] < 2)
@app.put("/models", include_in_schema=settings.version[0] >= 2)
async def put_models(request: Request, model: UploadFile):
    uri = request.url.path.removeprefix("/")
    content = await model.read()
    data = requests.put(f"http://{settings.host}:{settings.port}/{uri}",
            files={"upload": (model.filename, content, model.content_type)}
    )
    return data.text


@app.delete("/networks/{name}", include_in_schema=settings.version[0] < 2)
@app.delete("/models/{name}", include_in_schema=settings.version[0] >= 2)
async def delete_models(request: Request, name: str):
    uri = request.url.path.removeprefix("/")
    return requests.delete(f"http://{settings.host}:{settings.port}/{uri}/{name}")


@app.get("/describe", include_in_schema=settings.version[0] < 2)
@app.get("/networks", include_in_schema=settings.version[0] >= 2)
async def describe(request: Request):
    uri = request.url.path.removeprefix("/")
    return requests.get(f"http://{settings.host}:{settings.port}/{uri}").json()


@app.post("/{model}", include_in_schema=settings.version[0] < 2)
@app.post("/networks/{model}", include_in_schema=(settings.version[0] >= 2))
async def process(request: Request,
                  image: UploadFile, model: str,
                  confidenceThreshold: float = 0.15, overlapThreshold: float = 0.3,
                  bbox: bool = True, debug: bool = True):
    data = await do_process(request, image, model, confidenceThreshold, overlapThreshold, bbox, debug)
    return data


@app.post("/{model}/demo", include_in_schema=settings.version[0] < 2)
@app.post("/networks/{model}/demo", include_in_schema=(settings.version[0] >= 2))
async def process(request: Request,
                  image: UploadFile, model: DynamicModelName,
                  confidenceThreshold: float = 0.15, overlapThreshold: float = 0.3):
    data = await do_process(request, image, model.value, confidenceThreshold, overlapThreshold, True, True)

    try:
        uri = data["srcImageProcessedUri"]
        image = requests.get(uri).content
        return Response(content=image, media_type="image/jpeg")
    except:
        pass

    return data


async def do_process(request: Request,
                  image: UploadFile, model: str,
                  confidenceThreshold: float = 0.15, overlapThreshold: float = 0.3,
                  bbox: bool = True, debug: bool = True):
    uuid = random.randint(100000000, 999999999)

    image = Image.open(io.BytesIO(await image.read()))
    if image.mode == 'P':
        image = image.convert('RGBA')
    elif image.mode != 'RGB':
        image = image.convert('RGB')
    image.save(f"/tmp/{uuid}.jpg", format='JPEG', subsampling="4:2:0")

    url = f"http://{settings.host}:{settings.port}/{model}"
    if settings.version[0] >= 2:
        url = f"http://{settings.host}:{settings.port}/networks/{model}"

    query = requests.post(
        url=url,
        json={
            "image": f"{request.base_url}images/{uuid}.jpg",
            "callback": f"{request.base_url}callback",
            "confidenceThreshold": confidenceThreshold,
            "overlapThreshold": overlapThreshold,
            "bbox": bbox,
            "debug": debug,
            "userDefinedParameters": {
                "uuid": uuid
            }
        }
    )

    if query.status_code == 202:
        # wait for callback
        while True:
            candidate_uuid, data = await asyncio.wait_for(queue.get(), 20)
            if str(candidate_uuid) != str(uuid):
                await queue.put((candidate_uuid, data))
                time.sleep(0.1)
            else:
                break

        # fix known issues:
        if "srcImageProcessedUri" in data:
            protocol = data["srcImageProcessedUri"].split(":")[0]
            host = data["srcImageProcessedUri"].split(":")[1].replace("/", "")
            port = data["srcImageProcessedUri"].split(":")[2].split("/")[0]
            uri = data["srcImageProcessedUri"].split(":")[2].split("/")[1]

            data["srcImageProcessedUri"] = f"{protocol}://{settings.host}:{settings.port}/{uri}"


        return data

    return query.reason


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
    return app.routes

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=53210, log_level="info")