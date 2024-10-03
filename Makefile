NODE_VERSION := --lts


build:
	make nvm CMD="npm run build"

deploy: build
	scp -r dist/* root@192.168.20.115:/home/www/front-react

run:
	make nvm CMD="npm run dev"

install:
	curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
	make nvm CMD="npm install"

lint:
	make nvm CMD="npm run lint"

clean:
	rm -rf node_modules/ dist/ package-lock.json

nvm:
	bash -c 'source ~/.nvm/nvm.sh ; nvm exec $(NODE_VERSION) $(CMD)'

