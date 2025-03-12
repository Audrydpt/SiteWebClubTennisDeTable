import logging
import numpy as np
import cv2
import json
import aiohttp
import asyncio

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
logger.addHandler(logging.StreamHandler())
logger.addHandler(logging.FileHandler(f"/tmp/{__name__}.log"))

class ServiceAI:
    def __init__(self, analytic="192.168.20.212:53211", *args, **kwargs):
        self.analytic = "192.168.20.212:53211"
        self.analytic = analytic
        #self.analytic = "10.211.0.2:53211"
        self.describe = None
        self.ws = None
        self.seq = 1
        
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc, tb):
        if self.ws is not None:
            logger.info(f"Closing websocket")
            await self.ws.close()

    async def __describe(self):
        if self.describe is None:
          async with aiohttp.ClientSession() as session:
              async with session.get(f"http://{self.analytic}/describe") as response:
                  self.describe = await response.json()
        return self.describe
        
    async def get_version(self):
        await self.__describe()
        return [int(v) for v in self.describe["version"].split(".")]
    
    async def get_models(self):
        await self.__describe()
        copy = self.describe.copy()
        del copy["version"]
        del copy["msg"]
        return copy
    
    async def process(self, image):
        print("Processing Forensic")

        version = await self.get_version()
        if version[0] <= 1 or version[0] == 2 and version[1] < 2:
            logger.error(f"Incompatible version")
            raise Exception("Incompatible version")
        
        models = await self.get_models()
        model = list(models.keys())[1]
        print(model)
        modelWidth = models[model]["networkWidth"]
        modelHeight = models[model]["networkHeight"]

        await self.__init_ws(model)

        image = cv2.resize(image, (modelWidth, modelHeight)) # What if the image is not the ratio of the model?
        image_raw = cv2.cvtColor(image, cv2.COLOR_BGR2YUV_I420).astype("uint8").flatten().astype("uint8")
        _, image_jpeg = cv2.imencode(".jpg", image)

        # crop top to extract Y
        Y = image_raw[:modelHeight, :modelWidth]
        UV = image_raw[modelHeight:, :]

        U = UV[:UV.shape[0]//2, :].reshape(modelHeight//2, modelWidth//2)
        V = UV[UV.shape[0]//2:, :].reshape(modelHeight//2, modelWidth//2)

        YUV420P = np.concatenate([Y.flatten(), U.flatten(), V.flatten()]).astype("uint8")

        print("Image size: ", image.shape)
        print("Image raw size SZ: ", YUV420P.shape)
        print("Image raw size CV2: ", image_raw.shape, image_raw.flatten().shape)
        print("Image attended size: ", modelWidth * modelHeight * 3 // 2)

        await self.__detect_object(modelWidth, modelHeight, raw=image_raw)

    async def detect(self, frame):
        version = await self.get_version()
        logger.info(f"Version: {version}")
        if version[0] <= 1 or version[0] == 2 and version[1] < 2:
            logger.error(f"Incompatible version")
            raise Exception("Incompatible version")
        
        models = await self.get_models()
        logger.info(f"Models: {models}")
        model = list(models.keys())[0]
        modelWidth = models[model]["networkWidth"]
        modelHeight = models[model]["networkHeight"]

        await self.__init_ws(model)
        image_jpeg = cv2.imencode(".jpg", frame)[1]

        detections = await self.__detect_object(modelWidth, modelHeight, jpeg=image_jpeg)
        logger.info(f"Detections: {detections}")
        return detections

    async def __heartbeat(self):
        await self.ws.ping()
    
    async def __init_ws(self, model):
        if self.ws is None:
            self.ws = await aiohttp.ClientSession().ws_connect(f"ws://{self.analytic}{model}/requestsQueue")
        return self.ws

    def get_pixel_bbox(self, frame, detection):
        def getCoord(x, y, w, h):
            return (
                int(w * (0.5 + x / (8.0/3))),
                int(h * (0.5 * (1.0 - y)))
            )
            
        # coord is ACIC format, which is trigonometric circle. 0,0 is the center of the frame.
        height, width, _ = frame.shape
        left, bottom = getCoord(detection["bbox"]["min"]["x"], detection["bbox"]["min"]["y"], width, height)
        right, top = getCoord(detection["bbox"]["max"]["x"], detection["bbox"]["max"]["y"], width, height)

        # Clamp coordinates within image boundaries
        left = max(0, min(left, width))
        right = max(0, min(right, width))
        top = max(0, min(top, height))
        bottom = max(0, min(bottom, height))

        return top, bottom, left, right

    def get_thumbnail(self, frame, detection, scale=1.0):
        top, bottom, left, right = self.get_pixel_bbox(frame, detection)
        
        # scale the bounding box
        width = right - left
        height = bottom - top
        
        left = max(0, int(left - width * scale))
        right = min(frame.shape[1], int(right + width * scale))
        
        top = max(0, int(top - height * scale))
        bottom = min(frame.shape[0], int(bottom + height * scale))

        return frame[top:bottom, left:right]

    async def __detect_object(self, object_detection=False, classification=False, width=0, height=0, raw=None, jpeg=None):
        ctx = {
            "confidenceThreshold": 0.5,
            "overlapThreshold": 0.0001,
            "bbox": True,
        }
        logger.info(f"Sending context: {ctx}")
        await self.ws.send_json(ctx)
        
        if raw is not None:
          req = {
              "image": {
                  "type": "YUV420P",
                  "resolution": {
                      "width": width,
                      "height": height,
                  }
              },
              "userDefinedParameters": {
                  "id": self.seq,
              }
          }
          logger.info(f"Sending request: {req}")
          await self.ws.send_json(req)
          await self.ws.send_bytes(raw.tobytes())
        elif jpeg is not None:
          req = {
              "image": {
                  "type": "jpeg",
              },
              "userDefinedParameters": {
                  "id": self.seq,
              }
          }
          logger.info(f"Sending request: {req}")
          await self.ws.send_json(req)
          await self.ws.send_bytes(jpeg.tobytes())
        else:
          logger.error("No image provided")
          raise Exception("No image provided")
                    
        async for msg in self.ws:
            if msg.type == aiohttp.WSMsgType.TEXT:
                data = json.loads(msg.data)
                logger.info(f"Received: {data}")
                if data["msg"] == "response":

                    # classifier has higher priority than obj detector
                    if "classifiers" in data and len(data["classifiers"]) > 0:
                        return data["classifiers"]
                    
                    return data["detections"]
                else:
                    logger.debug(data)
        

async def main():
    async with ServiceAI("10.211.0.2:53211") as forensic:
        print("Starting")
        await forensic.get_version()
        print("Done")

        test = cv2.imread("test.jpg")
        detections = await forensic.process(test)
        print(detections)
        
        print("closing")
    print("completed")

if __name__ == "__main__":
    asyncio.run(main())