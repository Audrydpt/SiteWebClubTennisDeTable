from sqlalchemy import column, create_engine, Column, Integer, REAL, String, Text, DateTime, DDL, PrimaryKeyConstraint, cast, func, inspect, text, ForeignKey
from sqlalchemy.dialects.postgresql import TIMESTAMP, INTEGER, UUID
from sqlalchemy.ext.declarative import declarative_base, declared_attr
from sqlalchemy.orm import sessionmaker, relationship

from alembic.migration import MigrationContext
from alembic.operations import Operations
from alembic.autogenerate import produce_migrations
from alembic.operations.ops import ModifyTableOps, AlterColumnOp

import uuid

class Base:
    @declared_attr
    def __tablename__(cls):
        return cls.__name__.lower()
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

Database = declarative_base(cls=Base)

class BaseEvent(Database):
    __abstract__ = True
    
    @declared_attr
    def __table_args__(cls):
        return (
            {
                'timescaledb_hypertable': {'time_column_name': 'timestamp'},
            },
        )
    
    host = Column(Text, index=True)
    stream_id = Column(Integer, index=True)
    timestamp = Column(TIMESTAMP(timezone=True), primary_key=True)


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

class Dashboard(Database):
    title = Column(Text)
    widgets = relationship("Widget", back_populates="dashboard")

class Widget(Database):
    table = Column(Text)
    aggregation = Column(Text)
    duration = Column(Text)
    groupBy = Column(Text, nullable=True, default=None)
    size = Column(Text)
    type = Column(Text)
    layout = Column(Text)
    title = Column(Text)

    # Clé étrangère vers Dashboard
    dashboard_id = Column(UUID(as_uuid=True), ForeignKey('dashboard.id'), nullable=True)
    dashboard = relationship("Dashboard", back_populates="widgets")

class GenericDAL:
    initialized = False

    def __init__(self):
        self.engine = create_engine('timescaledb+psycopg2://postgres:postgres@192.168.20.145:5432/postgres', echo=False)
        self.Session = sessionmaker(bind=self.engine)

        if not GenericDAL.initialized:
            GenericDAL.__update_schema(self)
            GenericDAL.initialized = True
    
    def __update_schema(self):
        def add_using_clause(op):
            if isinstance(op.modify_type, Integer) and isinstance(op.existing_type, Text):
                using_clause = (f"COALESCE(NULLIF(REGEXP_REPLACE({op.column_name}, '[^0-9]', '', 'g'), ''), '0')::integer")
                return AlterColumnOp(
                    table_name=op.table_name,
                    column_name=op.column_name,
                    modify_type=op.modify_type,
                    existing_type=op.existing_type,
                    schema=op.schema,
                    existing_nullable=op.existing_nullable,
                    existing_server_default=op.existing_server_default,
                    existing_comment=op.existing_comment,
                    postgresql_using=using_clause
                )
            elif isinstance(op.modify_type, UUID) and isinstance(op.existing_type, Integer):
                using_clause = f"('00000000-0000-0000-0000-' || lpad(to_hex({op.column_name}), 12, '0'))::uuid"
                
                # Drop the existing default value
                drop_default_op = AlterColumnOp(
                    table_name=op.table_name,
                    column_name=op.column_name,
                    existing_type=op.existing_type,
                    existing_server_default=True,  # Set this to True to indicate an existing default
                    modify_server_default=None     # Set to None to drop the default
                )
                
                # Alter the column type with the using clause
                alter_type_op = AlterColumnOp(
                    table_name=op.table_name,
                    column_name=op.column_name,
                    existing_type=op.existing_type,
                    modify_type=op.modify_type,
                    postgresql_using=using_clause,
                )
                
                # Set the new default value
                set_default_op = AlterColumnOp(
                    table_name=op.table_name,
                    column_name=op.column_name,
                    existing_type=op.modify_type,
                    existing_server_default=None,
                    modify_server_default=text('gen_random_uuid()')
                )
                return [drop_default_op, alter_type_op, set_default_op]

            else:
                return op

        with self.Session() as session:
            session.execute(DDL("CREATE EXTENSION IF NOT EXISTS pgcrypto"))
            session.execute(DDL("CREATE EXTENSION IF NOT EXISTS timescaledb"))
            session.commit()
        
        print("Binding schema to engine...")
        Database.metadata.create_all(self.engine)

        print("Trying to update schema...")
        # got issue using the same engine, because of dialect timescaledb != postgresql
        with create_engine('postgresql://postgres:postgres@192.168.20.145:5432/postgres', echo=False).connect() as conn:
            trans = conn.begin()
            try:
                # Configure the migration context with the connection
                context = MigrationContext.configure(conn)
                migrations = produce_migrations(context, Database.metadata)
                if not migrations.upgrade_ops.is_empty():

                    print("Updating schema...")

                    operations = Operations(context)

                    use_batch = self.engine.name == "sqlite"
                    stack = [migrations.upgrade_ops]
                    while stack:
                        elem = stack.pop(0)
                        print(elem)

                        if use_batch and isinstance(elem, ModifyTableOps):
                            with operations.batch_alter_table(elem.table_name, schema=elem.schema) as batch_ops:
                                for table_elem in elem.ops:
                                    batch_ops.invoke(table_elem)
                        elif hasattr(elem, "ops"):
                            stack.extend(elem.ops)
                        else:
                            if isinstance(elem, AlterColumnOp):
                                elem = add_using_clause(elem)
                                if isinstance(elem, list):
                                    for op in elem:
                                        operations.invoke(op)
                                else:
                                    operations.invoke(elem)
                            else:
                                operations.invoke(elem)

                trans.commit()
            except Exception as e:
                trans.rollback()
                print(f"An error occurred during migration: {e}")
            print("Schema updated")
        
        print("Schema is ready")


    def add(self, obj):
        with self.Session() as session:
            session.add(obj)
            session.commit()
            return obj.id

    def get(self, cls, _func=None, _group=None, _having=None, _order=None, **filters):
        with self.Session() as session:
            query = session.query(cls)
            
            # FUNCTION() TODO: Make this resiliant to function without aggregation
            if _func is not None:
                query = query.with_entities(_func, _func.clause_expr)
            
            # WHERE
            if filters:
                query = query.filter_by(**filters)
            
            # GROUP BY
            if _group is not None:
                query = query.add_column(_group)
                query = query.group_by(_group)
            
            # HAVING
            if _having is not None:
                query = query.having(_having)
            
            # ORDER BY
            if _order is not None:
                query = query.order_by(_order)
            
            return query.all()
    
    def get_bucket(self, cls, _func=None, _time="1 hour", _group=None, _having=None, _between=None, **filters):
        with self.Session() as session:

            query = session.query(
                func.time_bucket(_time, cls.timestamp).label('_timestamp'),
            )

            # FUNCTION()
            if _func is not None:
                query = query.add_column(_func)

            # WHERE
            if filters:
                query = query.filter_by(**filters)
            if _between is not None and len(_between) == 2 and _between[0] is not None and _between[1] is not None:
                query = query.filter(cls.timestamp >= _between[0], cls.timestamp <= _between[1])
            
            # GROUP BY
            query = query.group_by('_timestamp')
            if _group is not None:
                if isinstance(_group, list):
                    for group in _group:
                        query = query.add_column(column(group))
                        query = query.group_by(column(group))
                else:
                    query = query.add_column(column(_group))
                    query = query.group_by(column(_group))
            
            # HAVING
            if _having is not None:
                query = query.having(_having)
            
            # ORDER BY
            query = query.order_by('_timestamp')
            if _group is not None:
                if isinstance(_group, list):
                    for group in _group:
                        query = query.add_column(column(group))
                        query = query.group_by(column(group))
                else:
                    query = query.add_column(column(_group))
                    query = query.group_by(column(_group))
            
            return query.all()

    def update(self, obj):
        with self.Session() as session:
            session.merge(obj)
            session.commit()

    def remove(self, obj):
        with self.Session() as session:
            session.delete(obj)
            session.commit()

