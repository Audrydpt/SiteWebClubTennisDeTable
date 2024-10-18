FROM ubuntu:24.04

ARG DEBIAN_FRONTEND=noninteractive
ARG TZ=Europe/Paris
ARG PG_VERSION=16
ARG PGDATA=/var/lib/postgresql/${PG_VERSION}/main

# Pré-requis
RUN apt-get update && apt-get install -y \
    wget \
    gnupg2 \
    lsb-release \
    python3 python3-pip python3-dev subversion \
    gosu \
    && rm -rf /var/lib/apt/lists/*

# Installation de PostgreSQL 16
RUN sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list' \
    && wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add - \
    && apt-get update \
    && apt-get install -y postgresql-${PG_VERSION} postgresql-client-${PG_VERSION} libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Installation de l'extension pgvector
RUN sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list' \
    && wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add - \
    && apt-get update \
    && apt-get install -y postgresql-${PG_VERSION}-pgvector \
    && rm -rf /var/lib/apt/lists/* \
    && echo "shared_preload_libraries = 'vector'" >> /etc/postgresql/${PG_VERSION}/main/postgresql.conf

# Installation de TimescaleDB 2
RUN sh -c "echo 'deb https://packagecloud.io/timescale/timescaledb/ubuntu/ $(lsb_release -c -s) main' > /etc/apt/sources.list.d/timescaledb.list" \
    && wget --quiet -O - https://packagecloud.io/timescale/timescaledb/gpgkey | apt-key add - \
    && apt-get update \
    && apt-get install -y timescaledb-2-postgresql-${PG_VERSION} \
    && rm -rf /var/lib/apt/lists/* \
    && echo "shared_preload_libraries = 'timescaledb'" >> /etc/postgresql/${PG_VERSION}/main/postgresql.conf

# Installation du backend
COPY ./src/ /backend
COPY ./requirements.txt /backend
RUN pip3 install -r /backend/requirements.txt --break-system-packages \
    && mkdir -p /backend/assets/ \
    && rm -rf /root/.cache

# Création du script de démarrage
RUN wget -O /usr/bin/dumb-init https://github.com/Yelp/dumb-init/releases/download/v1.2.5/dumb-init_1.2.5_x86_64 \
    && chmod +x /usr/bin/dumb-init \
    && echo "#!/bin/bash" >> /start.sh \
    && echo "mkdir -p ${PGDATA}" >> /start.sh \
    && echo "chmod 700 ${PGDATA}" >> /start.sh \
    && echo "chown -R postgres ${PGDATA}" >> /start.sh \
    && echo "if [ ! -s ${PGDATA}/PG_VERSION ]; then" >> /start.sh \
    && echo "  echo 'Initialisation de la base de données'" >> /start.sh \
    && echo "  gosu postgres /usr/lib/postgresql/${PG_VERSION}/bin/initdb -D /var/lib/postgresql/${PG_VERSION}/main" >> /start.sh \
    && echo "fi" >> /start.sh \
    && echo "" >> /start.sh \
    && echo "sed -i \"s/#listen_addresses = 'localhost'/listen_addresses = '*'/\" /etc/postgresql/${PG_VERSION}/main/postgresql.conf" >> /start.sh \
    && echo "echo 'host all all 10.0.0.0/8 md5' >> /etc/postgresql/${PG_VERSION}/main/pg_hba.conf" >> /start.sh \
    && echo "echo 'host all all 192.168.20.0/24 md5' >> /etc/postgresql/${PG_VERSION}/main/pg_hba.conf" >> /start.sh \
    && echo "" >> /start.sh \
    && echo "gosu postgres /usr/lib/postgresql/${PG_VERSION}/bin/postgres -D /etc/postgresql/${PG_VERSION}/main &" >> /start.sh \
    && echo "until pg_isready; do sleep 1; done" >> /start.sh \
    && echo "" >> /start.sh \
    && echo "gosu postgres psql -U postgres -c \"ALTER USER postgres PASSWORD 'postgres';\"" >> /start.sh \
    && echo "gosu postgres psql -U postgres -c \"CREATE EXTENSION IF NOT EXISTS timescaledb;\"" >> /start.sh \
    && echo "gosu postgres psql -U postgres -c \"CREATE EXTENSION IF NOT EXISTS vector;\"" >> /start.sh \
    && echo "echo Server is ready!" >> /start.sh \
    && echo "" >> /start.sh \
    && echo "gosu postgres psql" >> /start.sh \
    && echo "gosu postgres python3 /backend/main.py &" >> /start.sh \
    && echo "wait" >> /start.sh \
    && chmod +x /start.sh

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["/start.sh"]
