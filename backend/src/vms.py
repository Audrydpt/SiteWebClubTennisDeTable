import xml.etree.ElementTree as ET
import socket
import json
import argparse
import struct
import cv2
import av
import io
import datetime
import numpy as np

from typing import Optional, Dict


class CameraClient:
    def __init__(self, host: str, port: int):
        self.host = host
        self.port = port
        self.sock = None
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.sock:
            self.sock.close()

    def _send_request(self, xml_content: str, is_json=False) -> str:
        content_length = len(xml_content)
        http_request = (
            f"Accept: application/json\r\n"
            f"Content-Length: {content_length}\r\n"
            f"Content-Type: application/xml\r\n"
            f"\r\n"
            f"{xml_content}"
        )

        self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.sock.settimeout(5.0)

        try:
            self.sock.connect((self.host, self.port))
            self.sock.sendall(http_request.encode("utf-8"))

            # Lecture des headers
            buffer = b""
            while b"\r\n\r\n" not in buffer:
                chunk = self.sock.recv(4096)
                if not chunk:
                    break
                buffer += chunk

            # Séparation des headers et du début du body
            header_part, remaining = buffer.split(b"\r\n\r\n", 1)
            headers = {}
            for line in header_part.decode("utf-8").split("\r\n"):
                if line.strip() == "":
                    continue
                try:
                    key, value = line.split(": ", 1)
                except ValueError:
                    continue
                headers[key] = value

            # Récupération du Content-Length indiqué par le serveur
            total_length = int(headers.get("Content-Length", 0))

            # Compléter la lecture
            body = remaining
            while len(body) < total_length:
                data = self.sock.recv(4096)
                if not data:
                    break
                body += data

            body = body[:total_length]
            mime = headers.get("Content-Type", "").lower()
            if "application/json" in mime:
                text = body.decode("utf-8")
                return json.loads(text)
            elif "application/xml" in mime:
                text = body.decode("utf-8")
                return ET.fromstring(text)
            else:
                return body
        finally:
            self.sock.close()

    def _stream_request(self, xml_content: str):
        content_length = len(xml_content)
        http_request = (
            f"Accept: application/json\r\n"
            f"Content-Length: {content_length}\r\n"
            f"Content-Type: application/xml\r\n"
            "\r\n"
            f"{xml_content}"
        )

        self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.sock.settimeout(5.0)

        buffer = b""
        try:
            self.sock.connect((self.host, self.port))
            self.sock.sendall(http_request.encode("utf-8"))

            while True:
                while b"\r\n\r\n" not in buffer:
                    chunk = self.sock.recv(4096)
                    if not chunk:
                        return
                    buffer += chunk

                header_part, buffer = buffer.split(b"\r\n\r\n", 1)

                headers = {}
                for line in header_part.decode("utf-8").split("\r\n"):
                    if ": " in line:
                        key, value = line.split(": ", 1)
                        headers[key] = value
                total_length = int(headers.get("Content-Length", 0))

                while len(buffer) < total_length:
                    chunk = self.sock.recv(4096)
                    if not chunk:
                        break
                    buffer += chunk

                body, buffer = buffer[:total_length], buffer[total_length:]
                mime = headers.get("Content-Type", "").lower()
                print(mime)
                if "application/json" in mime:
                    text = body.decode("utf-8")
                    yield json.loads(text)
                elif "application/xml" in mime:
                    text = body.decode("utf-8")
                    yield ET.fromstring(text)
                else:
                    yield body
                
                self.sock.settimeout(20.0)

        finally:
            self.sock.close()
  
    def get_system_info(self) -> Optional[Dict[str, str]]:
        xml = """<?xml version="1.0" encoding="UTF-8"?><methodcall><requestid>0</requestid><methodname>systeminfo</methodname></methodcall>"""
        response = self._send_request(xml)
        return response

    def start_live(self, camera_guid: str):
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

        response = next(stream)
        for data in stream:
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

        return None

    def start_replay(self, camera_guid: str, from_time: datetime.datetime, to_time: datetime.datetime, gap: int = 0):
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
        print(xml)
        response = self._stream_request(xml)

        codec = None
        time_frame = None
        codec_format = None
        pts_counter = 0

        for data in response:
            if isinstance(data, dict):
                print(data)
                time_frame = data.get("FrameTime")
                codec_format = data.get("Format")
            elif isinstance(data, bytes):
                try:
                    if codec is None:
                        container = av.open(io.BytesIO(data), mode='r')
                        video_stream = container.streams.video[0]
                        codec = av.CodecContext.create(video_stream.codec_context.codec.name, 'r')
                        pts_counter = 0

                    packet = av.Packet(data)
                    packet.pts = pts_counter
                    pts_counter += 1
                    frames = codec.decode(packet)

                    for frame in frames:
                        img = frame.to_ndarray(format='bgr24')
                        yield img, time_frame

                except Exception as e:
                    print(f"Erreur lors du décodage: {e}")
                    codec = None
                    continue
        
        return None

def main():
    parser = argparse.ArgumentParser(description="Client de contrôle des caméras")
    parser.add_argument("--host", default="192.168.20.72", help="Adresse IP du serveur")
    parser.add_argument("--port", type=int, default=7778, help="Port du serveur")

    args = parser.parse_args()

    client = CameraClient(args.host, args.port)
    try:
        cameras = client.get_system_info()
        print("Informations système:", cameras)

        if cameras:
            first_guid = next(iter(cameras))
            print("GUID de la première caméra:", first_guid)

            for img, time in client.start_replay(first_guid, datetime.datetime(2025, 2, 28, 0, 0, 0), datetime.datetime(2025, 2, 28, 10, 0, 0), gap=5):
                print(img.shape, time)

    except Exception as e:
        print(f"Erreur lors de l'exécution: {e}")


if __name__ == "__main__":
    main()
