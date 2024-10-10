import time
from sqlalchemy import func
from database import AcicCounting, AcicNumbering, AcicUnattendedItem, GenericDAL
from event_grabber import EventGrabber
from api import FastAPIServer

if __name__ == "__main__":
    # init database
    print("Init database")
    dal = GenericDAL()
    del dal


    # init grabber
    print("Init grabber")
    grabber = EventGrabber()
    grabber.add_grabber("127.0.0.1",     8081)   # localhost
    grabber.start()

    # init web server
    print("Init web server")
    server = FastAPIServer(grabber)
    server.start()
    # wait for the server to stop

    
    # stop grabber
    print("Stop grabber")
    grabber.stop()
    grabber.join()
    print("Bye")
