SERVER ?= 192.168.20.145

.PHONY: build deploy run install venv

build:
	docker build -t localhost/newfront .

deploy: build
	docker save localhost/newfront > /tmp/newfront.tar
	scp -r /tmp/newfront.tar root@$(SERVER):/tmp
	ssh root@$(SERVER) 'mkdir -p /opt/ACIC/front/database'
	ssh root@$(SERVER) 'podman stop --filter ancestor=localhost/newfront'
	ssh root@$(SERVER) 'podman load < /tmp/newfront.tar'
	ssh root@$(SERVER) 'podman run -d --restart unless-stopped --health-on-failure=restart --shm-size=512m --net host -v /opt/ACIC/front/database:/var/lib/postgresql/16/main:z localhost/newfront'
#	ssh root@$(SERVER) 'docker run -d --restart unless-stopped --shm-size=512m --net host -v /opt/ACIC/front/database:/var/lib/postgresql/16/main:z localhost/newfront'
	ssh root@$(SERVER) 'rm /tmp/newfront.tar'
	rm /tmp/newfront.tar

run:
	make venv CMD="python src/main.py"	

install:
	python3 -m venv .venv
	make venv CMD="pip install -r requirements.txt"	

venv:
	bash -c 'source .venv/bin/activate ; $(CMD)'

