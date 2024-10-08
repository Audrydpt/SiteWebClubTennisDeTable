from database import GenericDAL
from event_grabber import EventGrabber

if __name__ == "__main__":
    # init database
    dal = GenericDAL()
    del dal

    grabber = EventGrabber()
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
