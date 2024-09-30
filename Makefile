NODE_VERSION := --lts


build:
	make nvm CMD="npm run build"

run:
	make nvm CMD="npm run dev"

install:
	curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
	make nvm CMD="npm install"

clean:
	rm -rf node_modules/ dist/ package-lock.json

nvm:
	bash -c 'source ~/.nvm/nvm.sh ; nvm exec $(NODE_VERSION) $(CMD)'

