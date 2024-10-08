from sqlalchemy import create_engine, Column, Integer, REAL, String, Text, text, DateTime, DDL, event, PrimaryKeyConstraint
from sqlalchemy.dialects.postgresql import TIMESTAMP
from sqlalchemy.ext.declarative import declarative_base, declared_attr
from sqlalchemy.orm import sessionmaker, scoped_session

class Base:
    @declared_attr
    def __tablename__(cls):
        return cls.__name__.lower()

    @declared_attr
    def __table_args__(cls):
        return (
            {
                'timescaledb_hypertable': {'time_column_name': 'timestamp'},
            },
        )

    id = Column(Integer, primary_key=True, autoincrement=True)
    host = Column(Text, index=True)
    stream_id = Column(Integer, index=True)
    timestamp = Column(TIMESTAMP(timezone=True), primary_key=True)


BaseEvent = declarative_base(cls=Base)


class AcicUnattendedItem(BaseEvent):
    roi_index = Column(Integer)
    url = Column(Text)
    person_url = Column(Text, nullable=True)

class AcicCounting(BaseEvent):
    line_index = Column(Integer)
    direction = Column(Text)
    class_name = Column(Text)

class AcicNumbering(BaseEvent):
    roi_index = Column(Integer)
    count = Column(Integer)

class AcicOccupancy(BaseEvent):
    count = Column(Integer)
    value = Column(REAL)

class AcicLicensePlate(BaseEvent):
    roi_index = Column(Integer)
    plate = Column(Text)
    country = Column(Text)
    text_color = Column(Text)
    background_color = Column(Text)
    foreground_color = Column(Text)

    # only available if MMR enabled:
    vehicle_brand = Column(Text, nullable=True)
    vehicle_type = Column(Text, nullable=True)
    vehicle_color = Column(Text, nullable=True)

    # image might be already deleted
    url = Column(Text, nullable=True)
    url_thumbnail = Column(Text, nullable=True)
    url_plate = Column(Text, nullable=True)

class AcicOCR(BaseEvent):
    roi_index = Column(Integer)
    text = Column(Text)
    type = Column(Text)
    checksum = Column(Text)

    # image might be already deleted
    url = Column(Text, nullable=True)
    url_thumbnail = Column(Text, nullable=True)
    url_plate = Column(Text, nullable=True)

class AcicAllInOneEvent(BaseEvent):
    class_name = Column(Text)
    event_name = Column(Text)
    event_type = Column(Text)
    rois = Column(Text, nullable=True)
    lines = Column(Text, nullable=True)

class AcicEvent(BaseEvent):
    name = Column(Text)
    state = Column(Text)


class GenericDAL:
    initialized = False

    def __init__(self):
        self.engine = create_engine('timescaledb+psycopg2://postgres:postgres@192.168.20.145:5432/postgres', echo=False)
        self.Session = sessionmaker(bind=self.engine)

        if not GenericDAL.initialized:
            with self.Session() as session:
                session.execute(DDL("CREATE EXTENSION IF NOT EXISTS timescaledb"))
                session.commit()

            #BaseEvent.metadata.drop_all(self.engine)
            BaseEvent.metadata.create_all(self.engine)
            GenericDAL.initialized = True

    def add(self, obj):
        with self.Session() as session:
            session.add(obj)
            session.commit()

    def get(self, cls, **kwargs):
        with self.Session() as session:
            return session.query(cls).filter_by(**kwargs).all()

    def update(self, obj):
        with self.Session() as session:
            session.merge(obj)
            session.commit()

    def remove(self, obj):
        with self.Session() as session:
            session.delete(obj)
            session.commit()