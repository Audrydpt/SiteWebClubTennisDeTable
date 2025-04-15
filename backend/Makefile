SERVER ?= 192.168.20.145

.PHONY: build deploy run install venv

build:
	docker build -t localhost/newfront .

deploy: build
	docker save localhost/newfront > /tmp/newfront.tar
	scp -r /tmp/newfront.tar root@$(SERVER):/tmp
	scp acic-database.service root@$(SERVER):/etc/systemd/system
	ssh root@$(SERVER) 'systemctl daemon-reload'
	ssh root@$(SERVER) 'systemctl enable acic-database.service'
	ssh root@$(SERVER) 'systemctl stop acic-database.service'
	# ssh root@$(SERVER) 'docker stop --filter ancestor=localhost/newfront'
	ssh root@$(SERVER) 'mkdir -p /opt/ACIC/front/database'
	ssh root@$(SERVER) 'podman load < /tmp/newfront.tar'
	# ssh root@$(SERVER) 'docker load < /tmp/newfront.tar'
	ssh root@$(SERVER) 'rm /tmp/newfront.tar'
	ssh root@$(SERVER) 'systemctl start acic-database.service'
	ssh root@$(SERVER) 'podman system prune -f'
	# ssh root@$(SERVER) 'docker run -d --restart unless-stopped --shm-size=512m --net host -v /opt/ACIC/front/database:/var/lib/postgresql/16/main:z localhost/newfront'
	rm /tmp/newfront.tar

dist: build
	mkdir -p dist
	docker save localhost/newfront > dist/newfront.tar
	cp acic-database.service dist/

run: build
	docker run -d --restart unless-stopped --shm-size=512m --net host -v /opt/ACIC/front/database:/var/lib/postgresql/16/main:z localhost/newfront
	make venv CMD="python src/main.py --port 5021"	

install:
	# apt install python3-venv subversion
	python3 -m venv .venv
	make venv CMD="pip install -r requirements.txt"	

clean:
	rm -rf .venv/ dist/

venv:
	bash -c 'source .venv/bin/activate ; $(CMD)'

