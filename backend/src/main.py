from database import GenericDAL
from event_grabber import EventGrabber
from api import FastAPIServer
import socket
import argparse

def getNetworkIp():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
    s.connect(('<broadcast>', 12345))  # 12345 is random port. 0 fails on Mac.
    return s.getsockname()[0]

if __name__ == "__main__":
    # init database
    print("Init database")
    dal = GenericDAL()
    del dal

    ip = getNetworkIp()
    print(ip)

    # parse command line arguments using argparse
    parser = argparse.ArgumentParser(description="Event grabber")
    parser.add_argument("--port", type=int, default=5020, help="Port of the server")

    args = parser.parse_args()

    # init grabber
    print("Init grabber")
    grabber = EventGrabber()
    grabber.add_grabber("127.0.0.1",     8081)   # localhost
    if ip == "192.168.20.145":
        grabber.add_grabber("192.168.20.44", 8081)   # new showroom
        grabber.add_grabber("192.168.20.45", 8081)   # old showroom
        grabber.add_grabber("192.168.20.126", 8081)  # VM de infrabel (arnaud)
        grabber.add_grabber("192.168.20.134", 8081)  # ASN
        grabber.add_grabber("192.168.20.145", 8081)  # SoukSimulator
        grabber.add_grabber("192.168.20.150", 8081)  # VM de samy
        grabber.add_grabber("192.168.20.153", 8081)  # VM de jacques
        grabber.add_grabber("192.168.20.213", 8081)  # VM de bertrand
        grabber.add_grabber("192.168.20.234", 8081)  # VM de bench (steve)
    grabber.start()

    # init web server
    print("Init web server")
    server = FastAPIServer(grabber)
    server.start(port=args.port)
    # wait for the server to stop

    
    # stop grabber
    print("Stop grabber")
    grabber.stop()
    grabber.join()
    print("Bye")
