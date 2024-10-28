SERVER ?= 192.168.20.145
NODE_VERSION := --lts

.PHONY: build deploy run install lint clean nvm

build:
	make nvm CMD="npm run build"

deploy: build
	ssh root@$(SERVER) 'mkdir -p /home/www/front-react'
	scp -r dist/* root@$(SERVER):/home/www/front-react

run:
	make nvm CMD="npm run dev"

install:
	curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
	bash -c 'source ~/.nvm/nvm.sh ; nvm install --lts'
	make nvm CMD="npm install"

lint:
	make nvm CMD="npm run lint"

clean:
	rm -rf node_modules/ dist/ package-lock.json

nvm:
	bash -c 'source ~/.nvm/nvm.sh ; nvm exec $(NODE_VERSION) $(CMD)'

