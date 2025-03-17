import logging
import traceback
import xml.etree.ElementTree as ET
import asyncio
import json
import argparse
import struct
import cv2
import av
import io
import datetime
import numpy as np

from dateutil import parser
from typing import Optional, Dict, AsyncGenerator, Tuple, Any

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
file_handler = logging.FileHandler(f"/tmp/{__name__}.log")
file_handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))
logger.addHandler(file_handler)

class CameraClient:
    def __init__(self, host: str, port: int):
        self.host = host
        self.port = port
        self.reader = None
        self.writer = None
    
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc, tb):
        if self.writer:
            self.writer.close()
            await asyncio.wait_for(self.writer.wait_closed(), timeout=5.0)
    
    async def _send_request(self, xml_content: str):
        content_length = len(xml_content)
        http_request = (
            f"Accept: application/json\r\n"
            f"Content-Length: {content_length}\r\n"
            f"Content-Type: application/xml\r\n"
            "\r\n"
            f"{xml_content}"
        )
        try:
            self.reader, self.writer = await asyncio.wait_for(
                asyncio.open_connection(self.host, self.port),
                timeout=5.0
            )
            self.writer.write(http_request.encode("utf-8"))
            await asyncio.wait_for(self.writer.drain(), timeout=5.0)

            headers = {}
            while True:
                line = await asyncio.wait_for(self.reader.readline(), timeout=5.0)
                if not line or line == b"\r\n":
                    break
                try:
                    key, value = line.decode("utf-8").strip().split(": ", 1)
                    headers[key] = value
                except ValueError as e:
                    logger.error(f"Header invalide: {line} | Exception: {e}")
                    continue

            logger.info(f"Headers: {headers}")
            total_length = int(headers.get("Content-Length", 0))
            logger.info(f"Longueur du contenu: {total_length}")

            if total_length > 0:
                body = await asyncio.wait_for(self.reader.readexactly(total_length), timeout=10.0)
            else:
                body = b""

            mime = headers.get("Content-Type", "").lower()
            try:
                if "application/json" in mime:
                    text = body.decode("utf-8")
                    logger.info(text)
                    return json.loads(text)
                elif "application/xml" in mime:
                    text = body.decode("utf-8")
                    logger.info(text)
                    return ET.fromstring(text)
                else:
                    return body
            except Exception as e:
                logger.error(f"Erreur lors du traitement de la réponse (mimetype: {mime}): {e}")
                raise e
            
        except Exception as e:
            logger.error(f"Erreur lors de la requête: {e}")
            logger.error(traceback.format_exc())
            raise e
        finally:
            if self.writer:
                self.writer.close()
                await asyncio.wait_for(self.writer.wait_closed(), timeout=5.0)

    async def _stream_request(self, xml_content: str) -> AsyncGenerator:
        content_length = len(xml_content)
        http_request = (
            f"Accept: application/json\r\n"
            f"Content-Length: {content_length}\r\n"
            f"Content-Type: application/xml\r\n"
            "\r\n"
            f"{xml_content}"
        )
        try:
            self.reader, self.writer = await asyncio.wait_for(
                asyncio.open_connection(self.host, self.port),
                timeout=5.0
            )
            self.writer.write(http_request.encode("utf-8"))
            await asyncio.wait_for(self.writer.drain(), timeout=5.0)

            while True:
 
                headers = {}
                while True:
                    line = await asyncio.wait_for(self.reader.readline(), timeout=5.0)
                    if not line or line == b"\r\n":
                        break
                    try:
                        key, value = line.decode("utf-8").strip().split(": ", 1)
                        headers[key] = value
                    except ValueError as e:
                        logger.error(f"Header invalide: {line} | Exception: {e}")
                        continue

                logger.info(f"Headers: {headers}")
                total_length = int(headers.get("Content-Length", 0))
                logger.info(f"Longueur du contenu: {total_length}")

                if total_length > 0:
                    body = await asyncio.wait_for(self.reader.readexactly(total_length), timeout=10.0)
                else:
                    body = b""

                mime = headers.get("Content-Type", "").lower()
                try:
                    if "application/json" in mime:
                        text = body.decode("utf-8")
                        logger.info(text)
                        yield json.loads(text)
                    elif "application/xml" in mime:
                        text = body.decode("utf-8")
                        logger.info(text)
                        yield ET.fromstring(text)
                    else:
                        yield body
                except Exception as e:
                    logger.error(f"Erreur lors du traitement de la réponse (mimetype: {mime}): {e}")
                    raise e
        except Exception as e:
            logger.error(f"Erreur lors de la requête: {e}")
            logger.error(traceback.format_exc())
            raise e
        finally:
            if self.writer:
                self.writer.close()
                await asyncio.wait_for(self.writer.wait_closed(), timeout=5.0)
  
    async def get_system_info(self) -> Optional[Dict[str, str]]:
        xml = """<?xml version="1.0" encoding="UTF-8"?><methodcall><requestid>0</requestid><methodname>systeminfo</methodname></methodcall>"""
        response = await self._send_request(xml)
        return response

    async def start_live(self, camera_guid: str) -> AsyncGenerator[np.ndarray, None]:
        def parse_data(data: bytes):
            format_str = '>HIHHHQIIIII'
            expected_size = struct.calcsize(format_str)
            bytes = struct.unpack(format_str, data[:expected_size])
            return bytes, data[expected_size:]

        xml = (
            f'<?xml version="1.0" encoding="UTF-8"?>'
            f"<methodcall>"
            f"<requestid>1</requestid>"
            f"<methodname>live</methodname>"
            f"<cameraid>{camera_guid}</cameraid>"
            f"</methodcall>"
        )
        stream = self._stream_request(xml)

        _ = await anext(stream)
        async for data in stream:
            headers, frame = parse_data(data)

            image_format = headers[2]
            width, height = headers[6], headers[7]
            stride_Y, stride_UV = headers[8], headers[9]

            img = None
            if image_format == 1:   # IF_LUM8
                img_lum = np.frombuffer(frame, dtype=np.uint8).reshape((height, width))
                img = cv2.cvtColor(img_lum, cv2.COLOR_GRAY2BGR)
            elif image_format == 2: # IF_YUV420P
                yuv_frame = np.frombuffer(frame, dtype=np.uint8).reshape((height * 3 // 2, width))
                img = cv2.cvtColor(yuv_frame, cv2.COLOR_YUV2BGR_I420)
            else:
                break

            yield img

    async def start_replay(self, camera_guid: str, from_time: datetime.datetime, to_time: datetime.datetime, gap: int = 0) -> AsyncGenerator[Tuple[np.ndarray, str], None]:
        xml = (
            f'<?xml version="1.0" encoding="UTF-8"?>'
            f"<methodcall>"
            f"<requestid>1</requestid>"
            f"<methodname>replay</methodname>"
            f"<cameraid>{camera_guid}</cameraid>"
            f"<fromtime>{from_time.isoformat()}</fromtime>"
            f"<totime>{to_time.isoformat()}</totime>"
            f"<gap>{gap}</gap>"
            f"</methodcall>"
        )
        response = self._stream_request(xml)

        codec = None
        time_frame = None
        codec_format = None
        guess_codec = None
        pts_counter = 0

        async for data in response:
            if isinstance(data, dict):
                time_str = data.get("FrameTime")
                time_frame = (
                    parser.isoparse(time_str).astimezone(datetime.timezone.utc)
                    if time_str else None
                )
                codec_format = data.get("Format").lower()
            elif isinstance(data, bytes):
                try:
                    if codec is None:
                        container = av.open(io.BytesIO(data), mode='r')
                        video_stream = container.streams.video[0]
                        guess_codec = video_stream.codec_context.codec.name
                        if guess_codec != codec_format:
                            logger.error(f"Codec détecté ({guess_codec}) différent du codec attendu ({codec_format})")
                        
                        codec = av.CodecContext.create(guess_codec, 'r')
                        pts_counter = 0

                    packet = av.Packet(data)
                    packet.pts = pts_counter
                    pts_counter += 1
                    frames = codec.decode(packet)

                    for frame in frames:
                        img = frame.to_ndarray(format='bgr24')
                        yield img, time_frame

                except Exception as e:
                    logger.error(f"Erreur lors du décodage du paquet vidéo {codec_format} / {guess_codec}: {e}")
                    logger.error(traceback.format_exc())
                    codec = None
                    continue


async def process_replay_stream(client, camera_guid, from_time, to_time, gap, name):
    async for frame, time in client.start_replay(camera_guid, from_time, to_time, gap):
        print(name, frame.shape, time)

async def test_dual_stream(host: str, port: int):   
    client1 = CameraClient(host, port)
    client2 = CameraClient(host, port)
    
    cameras = await client1.get_system_info()
    camera_guid = next(iter(cameras))
    
    now = datetime.datetime.now()
    
    from_time1 = now.replace(hour=7, minute=0, second=0)
    to_time1 = now.replace(hour=7, minute=5, second=0)
    
    from_time2 = now.replace(hour=8, minute=0, second=0)
    to_time2 = now.replace(hour=8, minute=5, second=0)

    gap = 5
    
    # Lancer les deux flux en parallèle
    await asyncio.gather(
        process_replay_stream(client1, camera_guid, from_time1, to_time1, gap, "stream1"),
        process_replay_stream(client2, camera_guid, from_time2, to_time2, gap, "stream2")
    )

async def main():
    parser = argparse.ArgumentParser(description="Client de contrôle des caméras")
    parser.add_argument("--host", default="192.168.20.72", help="Adresse IP du serveur")
    parser.add_argument("--port", type=int, default=7778, help="Port du serveur")

    args = parser.parse_args()

    client = CameraClient(args.host, args.port)
    try:
        if False:
            await test_dual_stream(args.host, args.port)
        else:
            cameras = await client.get_system_info()
            print("Informations système:", cameras)

            if cameras:
                first_guid = next(iter(cameras))
                print("GUID de la première caméra:", first_guid)

                streams = client.start_live(first_guid)
                img = await anext(streams)
                cv2.imwrite("test.jpg", img)

    except Exception as e:
        print(f"Erreur lors de l'exécution: {e}")


if __name__ == "__main__":
    asyncio.run(main())
