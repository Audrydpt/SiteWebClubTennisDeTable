SERVER := 192.168.20.145

build:
	docker build -t localhost/newfront .

deploy: build
	docker save localhost/newfront > /tmp/newfront.tar
	scp -r /tmp/newfront.tar root@$(SERVER):/tmp
	ssh root@$(SERVER) 'mkdir -p /opt/ACIC/front/database'
	ssh root@$(SERVER) 'docker stop --filter ancestor=localhost/newfront'
	ssh root@$(SERVER) 'docker load < /tmp/newfront.tar'
	ssh root@$(SERVER) 'docker run -d --restart unless-stopped --shm-size=512m --net host -v /opt/ACIC/front/database:/var/lib/postgresql/16/main:z localhost/newfront'
	ssh root@$(SERVER) 'rm /tmp/newfront.tar'
	rm /tmp/newfront.tar

run:
	make venv CMD="python src/main.py"	

install:
	python3 -m venv .venv
	make venv CMD="pip install -r requirements.txt"	

venv:
	bash -c 'source .venv/bin/activate ; $(CMD)'

