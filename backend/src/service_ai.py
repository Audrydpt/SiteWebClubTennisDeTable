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
        self.ws = {}
        self.seq = 1
        
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc, tb):
        """ if self.ws is not None:
            logger.info(f"Closing websocket")
            await self.ws.close() """
        
        logger.info(f"Closing websockets")
        for model in self.ws:
            if self.ws[model] is not None:
                
                await self.ws[model][0].close()
                await self.ws[model][1].close()

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
        models_list = list(models.keys())
        
        obj_model = [model for model in models_list if "/object" in model.lower()][0]
        color_model = [model for model in models_list if "/color" in model.lower()][0]
        type_model = [model for model in models_list if "/type" in model.lower()][0]
        classif_models = [color_model, type_model]

        obj_modelWidth = models[obj_model]["networkWidth"]
        obj_modelHeight = models[obj_model]["networkHeight"]

        image_ar = image.shape[1] / image.shape[0]

        await self.__init_ws(obj_model)

        if image.shape[0] < obj_modelHeight:
            #add black padding at the bottom
            image = cv2.resize(image, (obj_modelWidth, int(obj_modelWidth / image_ar))) # What if the image is not the ratio of the model?
            padding = np.zeros((obj_modelHeight - image.shape[0], image.shape[1], 3), dtype=np.uint8)
            image = np.concatenate([image, padding], axis=0)

        elif image.shape[0] > obj_modelHeight:
            #add black padding on the right
            image = cv2.resize(image, (int(obj_modelHeight * image_ar), obj_modelHeight))
            padding = np.zeros((image.shape[0], obj_modelWidth - image.shape[1], 3), dtype=np.uint8)
            image = np.concatenate([image, padding], axis=1)


        image_raw = cv2.cvtColor(image, cv2.COLOR_BGR2YUV_I420).astype("uint8")#.flatten().astype("uint8")

        obj_response = await self.__detect_object(width=obj_modelWidth, height=obj_modelHeight, raw=image_raw, object_detection=True,model=obj_model)
        filtered_obj_response = [obj for obj in obj_response if "car" in obj["bbox"]["probabilities"].keys()]

        print(f"{len(filtered_obj_response)} detection(s): ", filtered_obj_response)

        all_classif_response = []
        for model in classif_models:
            classif_response = []
            class_modelWidth = models[model]["networkWidth"]
            class_modelHeight = models[model]["networkHeight"]
            await self.__init_ws(model)
            i=0
            for res in filtered_obj_response:
                
                image_class = self.get_thumbnail(image,res,0.5)
                image_class = cv2.resize(image_class, (class_modelWidth, class_modelHeight))
                image_raw_class = cv2.cvtColor(image_class, cv2.COLOR_BGR2YUV_I420).astype("uint8")
                
                #save on disk
                #cv2.imwrite(f"test_save_class_{i}.jpg", cv2.cvtColor(image_raw_class, cv2.COLOR_YUV2BGR_I420))
                i+=1
                classif_response.append(await self.__detect_object(width=class_modelWidth, height=class_modelHeight, raw=image_raw_class, classification=True,model=model))
            
            print(f"{len(classif_response)} Classification detection(s) for model {model}: ", classif_response)

            all_classif_response.append(classif_response)

        
        


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

        detections = await self.__detect_object(width=modelWidth, height=modelHeight, jpeg=image_jpeg)
        logger.info(f"Detections: {detections}")
        return detections

    async def __heartbeat(self):
        for model in self.ws:
            await model[0].ping()
    
    async def __init_ws(self, model):
        if model not in self.ws:
            service_session = aiohttp.ClientSession()
            connection = await service_session.ws_connect(f"ws://{self.analytic}{model}/requestsQueue")
            self.ws[model] = (connection, service_session)
        #return self.ws[model]

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

    async def __detect_object(self, object_detection=False, classification=False, width=0, height=0, raw=None, jpeg=None,model=None):
        ctx = {
            "confidenceThreshold": 0.5,
            "overlapThreshold": 0.0001,
            "bbox": True if object_detection else False,
            "classifier": True if classification else False
        }
        #logger.info(f"Sending context: {ctx}")
        await self.ws[model][0].send_json(ctx)
        
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
          #logger.info(f"Sending request: {req}")
          await self.ws[model][0].send_json(req)
          await self.ws[model][0].send_bytes(raw.tobytes())
        elif jpeg is not None:
          req = {
              "image": {
                  "type": "jpeg",
              },
              "userDefinedParameters": {
                  "id": self.seq,
              }
          }
          #logger.info(f"Sending request: {req}")
          await self.ws[model][0].send_json(req)
          await self.ws[model][0].send_bytes(jpeg.tobytes())
        else:
          logger.error("No image provided")
          raise Exception("No image provided")
                    
        async for msg in self.ws[model][0]:
            if msg.type == aiohttp.WSMsgType.TEXT:
                data = json.loads(msg.data)
                #logger.info(f"Received: {data}")
                if data["msg"] == "response":

                    # classifier has higher priority than obj detector
                    if "classifiers" in data :
                        return data["classifiers"]
                    
                    return data["detections"]
                else:
                    logger.debug(data)
        

async def main():
    async with ServiceAI("192.168.20.220:53211") as forensic:
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
