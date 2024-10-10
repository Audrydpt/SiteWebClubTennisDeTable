from sqlalchemy import create_engine, Column, Integer, REAL, String, Text, DateTime, DDL, PrimaryKeyConstraint, cast
from sqlalchemy.dialects.postgresql import TIMESTAMP, INTEGER
from sqlalchemy.ext.declarative import declarative_base, declared_attr
from sqlalchemy.orm import sessionmaker

from alembic.migration import MigrationContext
from alembic.operations import Operations
from alembic.autogenerate import produce_migrations
from alembic.operations.ops import ModifyTableOps, AlterColumnOp

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
    line_index = Column(Text)
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

            GenericDAL.__update_schema(self)
            GenericDAL.initialized = True
    
    def __update_schema(self):
        def add_using_clause(op):
            if isinstance(op.modify_type, Integer) and isinstance(op.existing_type, Text):
                using_clause = (
                    f"COALESCE(NULLIF(REGEXP_REPLACE({op.column_name}, '[^0-9]', '', 'g'), ''), '0')::integer"
                )
                return AlterColumnOp(
                    table_name=op.table_name,
                    column_name=op.column_name,
                    modify_type=Integer(),
                    existing_type=op.existing_type,
                    schema=op.schema,
                    existing_nullable=op.existing_nullable,
                    existing_server_default=op.existing_server_default,
                    existing_comment=op.existing_comment,
                    postgresql_using=using_clause
                )
            return op
    
        BaseEvent.metadata.create_all(self.engine)

        # got issue using the same engine, because of dialect timescaledb != postgresql
        engine = create_engine('postgresql://postgres:postgres@192.168.20.145:5432/postgres', echo=False)

        # https://alembic.sqlalchemy.org/en/latest/cookbook.html#run-alembic-operation-objects-directly-as-in-from-autogenerate        
        context = MigrationContext.configure(engine.connect())
        migrations = produce_migrations(context, BaseEvent.metadata)
        if migrations.upgrade_ops.is_empty() is False:

            operations = Operations(context)

            use_batch = self.engine.name == "sqlite"
            stack = [migrations.upgrade_ops]
            while stack:
                elem = stack.pop(0)

                if use_batch and isinstance(elem, ModifyTableOps):
                    with operations.batch_alter_table( elem.table_name, schema=elem.schema ) as batch_ops:
                        for table_elem in elem.ops:
                            batch_ops.invoke(table_elem)
                elif hasattr(elem, "ops"):
                    stack.extend(elem.ops)
                else:
                    if isinstance(elem, AlterColumnOp):
                        elem = add_using_clause(elem)
                    
                    operations.invoke(elem)
            
            print("Schema updated")

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

