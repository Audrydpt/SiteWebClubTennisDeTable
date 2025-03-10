import numpy as np
import cv2
import json
import aiohttp
import asyncio

class ServiceAI:
    def __init__(self, server, guid, *args, **kwargs):
        self.server = server
        self.guid = guid
        self.analytic = "192.168.20.212:53211"
        self.describe = None
        self.ws = None
        self.seq = 1

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
    
    async def process(self):
        print("Processing Forensic")

        version = await self.get_version()
        if version[0] <= 1 or version[0] == 2 and version[1] < 2:
            raise Exception("Incompatible version")
        
        models = await self.get_models()
        model = list(models.keys())[0]
        modelWidth = models[model]["networkWidth"]
        modelHeight = models[model]["networkHeight"]

        modelWidth = 626
        modelHeight = 418

        modelWidth = 640
        modelHeight = 480

        await self.__init_ws(model)

        image = cv2.imread("test.jpg")
        image = cv2.resize(image, (modelWidth, modelHeight)) # What if the image is not the ratio of the model?
        image_raw = cv2.cvtColor(image, cv2.COLOR_BGR2YUV_I420).astype("uint8")
        image_jpeg = cv2.imencode(".jpg", image)[1]

        # crop top to extract Y
        Y = image_raw[:modelHeight, :modelWidth]
        UV = image_raw[modelHeight:, :]

        U = UV[:UV.shape[0]//2, :].reshape(modelHeight//2, modelWidth//2)
        V = UV[UV.shape[0]//2:, :].reshape(modelHeight//2, modelWidth//2)

        interleave = np.zeros((modelHeight//2, modelWidth//2, 2), dtype="uint8")
        interleave[:, :, 0] = U
        interleave[:, :, 1] = V

        YUV420P = np.concatenate([Y.flatten(), U.flatten(), V.flatten()]).astype("uint8")
        print(Y.shape)
        print(U.shape)
        print(V.shape)
        print(YUV420P.shape)

        cv2.imwrite("test_raw.jpg", YUV420P)
        with open("test_raw.ppm", "wb") as f:
            f.write(YUV420P.tobytes())
          
        cv2.imwrite("test_Y.jpg", Y)
        cv2.imwrite("test_U.jpg", U)
        cv2.imwrite("test_V.jpg", V)
        cv2.imwrite("test_YUV.jpg", YUV420P)

        print("Image size: ", image.shape)
        print("Image raw size: ", YUV420P.shape)
        print("Image attended size: ", modelWidth * modelHeight * 3 // 2)

        await self.__detect_object(modelWidth, modelHeight, jpeg=image_jpeg)

    async def __heartbeat(self):
        await self.ws.ping()
    
    async def __init_ws(self, model):
        if self.ws is None:
            self.ws = await aiohttp.ClientSession().ws_connect(f"ws://{self.analytic}{model}/requestsQueue")
            #self.ws.use_mask = False
        return self.ws

    async def __detect_object(self, width, height, raw=None, jpeg=None):
        ctx = {
            "confidenceThreshold": 0.5,
            "overlapThreshold": 0.3,
            "bbox": True,
        }
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
          await self.ws.send_json(req)
          await self.ws.send_bytes(jpeg.tobytes())
        else:
          raise Exception("No image provided")
            
        async for msg in self.ws:
            if msg.type == aiohttp.WSMsgType.TEXT:
                data = json.loads(msg.data)
                if data["msg"] == "response":
                    print(data["detections"])
                else:
                  print(data)
        

if __name__ == "__main__":
    forensic = ServiceAI("192.168.20.72", "00000001-0000-babe-0000-00408cec7f31")
    asyncio.run(forensic.get_version())
    asyncio.run(forensic.process())
    print("Done")

