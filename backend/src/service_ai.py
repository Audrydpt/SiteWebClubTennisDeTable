import logging
import traceback
import numpy as np
import cv2
import json
import aiohttp
import asyncio

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
file_handler = logging.FileHandler(f"/tmp/{__name__}.log")
file_handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))
logger.addHandler(file_handler)

def bgr_to_yuv420p(bgr_image):
    """Convert BGR image to YUV420p raw format"""
    # Convert BGR to YUV
    yuv_image = cv2.cvtColor(bgr_image, cv2.COLOR_BGR2YUV)
    
    height, width = yuv_image.shape[0], yuv_image.shape[1]
    
    # Y plane: full resolution
    y = yuv_image[:, :, 0]
    
    # Downsample U and V planes (half resolution in both dimensions)
    u = cv2.resize(yuv_image[:, :, 1], (width // 2, height // 2), interpolation=cv2.INTER_AREA)
    v = cv2.resize(yuv_image[:, :, 2], (width // 2, height // 2), interpolation=cv2.INTER_AREA)
        
    return y , u ,v

class ServiceAI:
    def __init__(self, analytic="192.168.20.212:53211", *args, **kwargs):
        self.analytic = "192.168.20.212:53211"
        self.analytic = analytic
        self.describe = None
        self.ws = {}
        self.session = {}
        self.seq = 1
        
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc, tb):
        logger.info(f"Closing websockets")
        for ws in self.ws:
            await asyncio.wait_for(self.ws[ws].close(), timeout=5)
        for sess in self.session:
            await asyncio.wait_for(self.session[sess].close(), timeout=5)

    async def __describe(self):
        if self.describe is None:
          async with aiohttp.ClientSession() as session:
              async with session.get(f"http://{self.analytic}/describe") as response:
                  self.describe = await response.json()
        return self.describe
        
    async def get_version(self):
        await asyncio.wait_for(self.__describe(), timeout=5)
        return [int(v) for v in self.describe["version"].split(".")]
    
    async def get_models(self):
        await asyncio.wait_for(self.__describe(), timeout=5)
        copy = self.describe.copy()
        del copy["version"]
        del copy["msg"]
        return copy
    
    async def __parse_classif_response(self, classif_response,sort=False):
        parsed_classif_response = []
        for classif in classif_response: # for all bbox detections
            parsed_classif = {}
            for head in classif: # for all classification heads in the model
                
                head_name, head_values = list(head.items())[0]
                if sort :
                    #sort the classes by values
                    head_values = {k: v for k, v in sorted(head_values.items(), key=lambda item: item[1], reverse=True)}


                parsed_classif[head_name] = head_values

            parsed_classif_response.append(parsed_classif)
        return parsed_classif_response
    
    async def process(self, image,selected_classes=["car","truck","bus","motorcycle","bicycle"]):
        print("Processing Forensic")

        version = await self.get_version()
        if version[0] <= 1 or version[0] == 2 and version[1] < 2:
            logger.error(f"Incompatible version")
            raise Exception("Incompatible version")
        
        models = await self.get_models()
        models_list = list(models.keys())
        
        obj_model = [model for model in models_list if "/object" in model.lower()][0]

        """ color_model = [model for model in models_list if "/color" in model.lower()][0]
        type_model = [model for model in models_list if "/type" in model.lower()][0]
        classif_models = [color_model, type_model] """
        vehicule_model = [model for model in models_list if "/vehicule" in model.lower()][0]
        classif_models = [vehicule_model]

        obj_modelWidth = models[obj_model]["networkWidth"]
        obj_modelHeight = models[obj_model]["networkHeight"]

        image_ar = image.shape[1] / image.shape[0]

        await asyncio.wait_for(self.__init_ws(obj_model), timeout=5)

        if image.shape[0] < obj_modelHeight:
            #add black padding at the bottom
            resized_height = int(obj_modelWidth / image_ar) >> 2
            resized_height +=1
            resized_height <<= 2
            image = cv2.resize(image, (obj_modelWidth, resized_height))

        elif image.shape[0] > obj_modelHeight:
            #add black padding on the right
            resized_width = int(obj_modelHeight * image_ar) >> 2
            resized_width +=1
            resized_width <<= 2
            image = cv2.resize(image, (resized_width, obj_modelHeight))

       #image_raw = cv2.cvtColor(image, cv2.COLOR_BGR2YUV_I420).astype("uint8")

        image_raw = bgr_to_yuv420p(image)

        image_jpeg = cv2.imencode(".jpg", image)[1]


        #obj_response = await self.__detect_object(width=obj_modelWidth, height=obj_modelHeight, jpeg=image_jpeg, object_detection=True,model=obj_model)
        obj_response = await self.__detect_object(width=image.shape[1],height=image.shape[0], raw=image_raw,object_detection=True,model=obj_model)
        
        #check if obj_response is NoneType
        if obj_response is None or len(obj_response) == 0:
            return [], []
        
        filtered_obj_response = [obj for obj in obj_response if any(cls in obj["bbox"]["probabilities"].keys() for cls in selected_classes)]
        
        all_classif_response = []
        for model in classif_models:
            classif_response = []
            class_modelWidth = models[model]["networkWidth"]
            class_modelHeight = models[model]["networkHeight"]
            await asyncio.wait_for(self.__init_ws(model), timeout=5)
            i=0
            for res in filtered_obj_response:
                
                image_class = self.get_thumbnail(image,res,0.)
                image_class = cv2.resize(image_class, (class_modelWidth, class_modelHeight))
                #image_raw_class = cv2.cvtColor(image_class, cv2.COLOR_BGR2YUV_I420) .astype("uint8")
                image_raw_class = bgr_to_yuv420p(image_class)
                image_jpeg_class = cv2.imencode(".jpg", image_class)[1]
                
                #save jpeg on disk
                with open(f"test_save_class_{i}.jpg", "wb") as f:
                    f.write(image_jpeg_class.tobytes())
                i+=1
                
                try:
                    #classif_response.append(await self.__detect_object(width=class_modelWidth, height=class_modelHeight, jpeg=image_jpeg_class, classification=True,model=model))
                    classif_response.append(await self.__detect_object(width=image_class.shape[1],height=image_class.shape[0], raw=image_raw_class, classification=True,model=model))
                except Exception as e:
                    logger.error(f"Error during classification detection: {e}")
                    break
            
            parsed_classif_response = await self.__parse_classif_response(classif_response,sort=True)

            all_classif_response.append(parsed_classif_response)
        
        return filtered_obj_response, all_classif_response

    async def detect(self, frame):
        version = await self.get_version()
        if version[0] <= 1 or version[0] == 2 and version[1] < 2:
            logger.error(f"Incompatible version")
            raise Exception("Incompatible version")
        
        models = await self.get_models()

        if "/object" not in models:
            logger.error(f"No object detection model found")
            raise Exception("No object detection model found")
        
        model = "/object"
        modelWidth = models[model]["networkWidth"]
        modelHeight = models[model]["networkHeight"]

        await asyncio.wait_for(self.__init_ws(model), timeout=5)
        image_jpeg = cv2.imencode(".jpg", frame)[1]

        detections = await asyncio.wait_for(self.__detect_object(width=modelWidth, height=modelHeight, model=model, object_detection=True, jpeg=image_jpeg), timeout=5)
        logger.info(f"Detections: {detections}")
        return detections
    
    async def classify(self, frame):
        async def get_classes(model):
            modelWidth = models[model]["networkWidth"]
            modelHeight = models[model]["networkHeight"]

            await asyncio.wait_for(self.__init_ws(model), timeout=5)
            valid, image_jpeg = cv2.imencode(".jpg", frame)
            if not valid:
                logger.error(f"Error while encoding image to jpeg {frame.shape}")
                cv2.imwrite(f"/tmp/test_save_{model}.jpg", frame)
                raise Exception("Error while encoding image to jpeg")

            data = await asyncio.wait_for(self.__detect_object(width=modelWidth, height=modelHeight, model=model, classification=True, jpeg=image_jpeg), timeout=5)
            if data is None:
                cv2.imwrite(f"/tmp/test_save_{model}.jpg", frame)
                logger.error(f"No data - saved image to /tmp/test_save_{model}.jpg")
                logger.error(traceback.format_exc())
                raise Exception("No data")
            
            if len(data) == 1:
                raise Exception("Not implemented")
            else:
                attributes = {}
                for heads in data:
                    for head_name in heads:
                        attributes[head_name] = heads[head_name]
                return attributes

        version = await self.get_version()
        if version[0] <= 1 or version[0] == 2 and version[1] < 2:
            logger.error(f"Incompatible version")
            raise Exception("Incompatible version")
        
        models = await self.get_models()

        attributes = {}
        if "/vehicule" in models or "/vehicule_attributes" in models:
            model = "/vehicule" if "/vehicule" in models else "/vehicule_attributes"
            attributes = await get_classes(model)
        
        if "/color" in models or "/vehicule_color" in models:
            model = "/color" if "/color" in models else "/vehicule_color"
            attributes["color"] = await get_classes(model)
        
        if "/type" in models or "/vehicule_type" in models:
            model = "/type" if "/type" in models else "/vehicule_type"
            attributes["type"] = await get_classes(model)

        return attributes
    
    async def __heartbeat(self):
        for ws in self.ws:
            await asyncio.wait_for(self.ws[ws].ping(), timeout=1)
    
    async def __init_ws(self, model):
        if model not in self.ws:
            self.session[model] = aiohttp.ClientSession()
            self.ws[model] = await self.session[model].ws_connect(f"ws://{self.analytic}{model}/requestsQueue")


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

    def get_thumbnail(self, frame, detection, scale=0.0):
        top, bottom, left, right = self.get_pixel_bbox(frame, detection)
        
        # scale the bounding box
        width = right - left
        height = bottom - top
        
        left = max(0, int(left - width * scale))
        right = min(frame.shape[1], int(right + width * scale))
        
        top = max(0, int(top - height * scale))
        bottom = min(frame.shape[0], int(bottom + height * scale))

        return frame[top:bottom, left:right]

    async def __detect_object(self, model, object_detection=False, classification=False, width=0, height=0, raw=None, jpeg=None):        
        if object_detection == classification:
            logger.error("You must choose between object detection or classification")
            raise Exception("You must choose between object detection or classification")
        
        ctx = {
            "confidenceThreshold": 0.5,
            "overlapThreshold": 0.1,
            "bbox": True if object_detection else False,
            "classifier": True if classification else False
        }
        logger.info(f"Sending context: {ctx} to {model}")
        await self.ws[model].send_json(ctx)
        
        if raw is not None:
          if width == 0 or height == 0:
                logger.error("Width and height must be defined")
                raise Exception("Width and height must be defined")
          
          req = {
              "image": {
                  "type": "YUV420P",
                  "resolution": {
                      "width": width if width !=0 else raw.shape[1],
                      "height": height if height !=0 else raw.shape[0],
                  }
              },
              "userDefinedParameters": {
                  "sequenceId": self.seq,
                  "id": self.seq,
              }
          }
          logger.info(f"Sending request: {req}")
          await self.ws[model].send_json(req)
          await self.ws[model].send_bytes(raw[0].tobytes())
          await self.ws[model].send_bytes(raw[1].tobytes())
          await self.ws[model].send_bytes(raw[2].tobytes())
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
          await self.ws[model].send_json(req)
          await self.ws[model].send_bytes(jpeg.tobytes())
        else:
          logger.error("No image provided")
          raise Exception("No image provided")
        
        try:
            for i in range(0, 10):
                msg = await asyncio.wait_for(self.ws[model].receive(), timeout=1)
                
                if msg.type == aiohttp.WSMsgType.TEXT:
                    data = json.loads(msg.data)
                    if data["msg"] == "response":
                        
                        if object_detection:
                            logger.info(f"Detection response {data["detections"]}")
                            return data["detections"]

                        if classification:
                            logger.info(f"Classifier response {data["classifiers"]}")
                            return data["classifiers"]
                        
                        logger.error(f"Unknown response {msg.data}")
                        raise Exception("Unknown response")

                    elif data["msg"] == "error":
                        logger.error(f"Error message: {data["error"]}")

                    else:
                        logger.error(f"Unknown message {msg.data}")
                else:
                    logger.error(f"Unknown message type {msg.type}")
                    raise Exception("Unknown message type")
            
        except asyncio.TimeoutError:
            logger.error("Timeout while waiting for response")
            raise Exception("Timeout while waiting for response")
                           

async def main():
    async with ServiceAI() as forensic:
        print("Starting")
        await forensic.get_version()

        #params
        test = cv2.imread("/home/sbakkouche/Documents/dashboard/backend/test.jpg")
        selected_classes = ["car","truck","bus","motorcycle","bicycle"]
        short_print = True
        nbr_classif_values = 3
        detections,classifs = await forensic.process(test,selected_classes)

        if len(detections) == 0:
            print("No objects detected")
            print("closing")
            return
        
        print(f"{len(detections)} objects detected and classified:")

        for idx,(detection,classif) in enumerate(zip(detections,classifs[0])):
            
            if short_print:
                prob = detection['bbox']['probabilities']
                prob_class = list(prob.keys())[0]
                prob_values = list(prob.values())[0]
                x_min = detection['bbox']['min']['x']
                y_min = detection['bbox']['min']['y']
                x_max = detection['bbox']['max']['x']
                y_max = detection['bbox']['max']['y']

                x = (x_max + x_min) / 2
                y = (y_max + y_min) / 2
                w = x_max - x_min
                h = y_max - y_min

                print(f"{idx}) {prob_class} detected with {100 * prob_values:.2f}% confidence at position x:{x:.2f} - y:{y:.2f} - w:{w:.2f} - h:{h:.2f} ")
                
                for classification in classif:
                    
                    print(f"\t{classification} classification:")
                    for i, (key, value) in enumerate(classif[classification].items()):
                        if i >= nbr_classif_values:
                            break
                        print(f"\t\t| {key} - {100 * value:.2f}%")
                
                print("\n\n")
            else:
                print(detection)
                print(classif)
                print("\n\n")



if __name__ == "__main__":
    asyncio.run(main())