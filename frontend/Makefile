SERVER ?= 192.168.20.145
NODE_VERSION := --lts

.PHONY: build deploy run install lint clean nvm docker-dist

build:
	make nvm CMD="npm run license"
	make nvm CMD="npm run build"

deploy: build
	ssh root@$(SERVER) 'mkdir -p /home/www/front-react'
	scp -r dist/* root@$(SERVER):/home/www/front-react


	ssh root@$(SERVER) 'if ! grep -q "mod_proxy" /opt/ACIC/etc/lighttpd.conf; then \
		sed -i '\''/[[:space:]]*"mod_cgi",/a \                    "mod_proxy",'\'' /opt/ACIC/etc/lighttpd.conf && \
        	systemctl restart acic-httpd; \
	fi'

	ssh root@$(SERVER) 'if ! grep -q "image/svg+xml" /opt/ACIC/etc/lighttpd.conf; then \
		sed -i '\''/.png"[[:space:]]*=>[[:space:]]*"image\/png",/a \
		".svg" => "image/svg+xml",'\'' /opt/ACIC/etc/lighttpd.conf && \
		systemctl restart acic-httpd; \
        fi'

	# if there is front-api but without websocket add it
	ssh root@$(SERVER) 'if grep -q "/front-api" /opt/ACIC/etc/lighttpd.conf && ! grep -q "upgrade.*enable.*front-api\\|front-api.*upgrade" /opt/ACIC/etc/lighttpd.conf; then \
			cp /opt/ACIC/etc/lighttpd.conf /opt/ACIC/etc/lighttpd.conf.bak && \
			sed -i "/\$HTTP\\[\"url\"\\] =~ \"\^\/front-api\/\"/,/\}/d" /opt/ACIC/etc/lighttpd.conf && \
			echo "" >> /opt/ACIC/etc/lighttpd.conf && \
			echo "\$$HTTP[\"url\"] =~ \"^/front-api/\" {" >> /opt/ACIC/etc/lighttpd.conf && \
			echo "	proxy.header = ( \"map-urlpath\" => ( \"/front-api\" => \"\" ), \"upgrade\" => \"enable\", \"connect\" => \"enable\" )" >> /opt/ACIC/etc/lighttpd.conf && \
			echo "	proxy.server = ( \"\" => ( ( \"host\" => \"127.0.0.1\", \"port\" => 5020 ) ) )" >> /opt/ACIC/etc/lighttpd.conf && \
			echo "}" >> /opt/ACIC/etc/lighttpd.conf && \
			systemctl restart acic-httpd; \
	fi'

	# if there is no front-api at all, add it
	ssh root@$(SERVER) 'if ! grep -q "/front-api" /opt/ACIC/etc/lighttpd.conf; then \
		echo "" >> /opt/ACIC/etc/lighttpd.conf && \
		echo "\$$HTTP[\"url\"] =~ \"^/front-api/\" {" >> /opt/ACIC/etc/lighttpd.conf && \
		echo "	proxy.header = ( \"map-urlpath\" => ( \"/front-api\" => \"\" ), \"upgrade\" => \"enable\", \"connect\" => \"enable\" )" >> /opt/ACIC/etc/lighttpd.conf && \
		echo "	proxy.server = ( \"\" => ( ( \"host\" => \"127.0.0.1\", \"port\" => 5020 ) ) )" >> /opt/ACIC/etc/lighttpd.conf && \
		echo "}" >> /opt/ACIC/etc/lighttpd.conf && \
		systemctl restart acic-httpd; \
	fi'

	ssh root@$(SERVER) 'if ! grep -q "/front-react" /opt/ACIC/etc/lighttpd.conf; then \
		echo "" >> /opt/ACIC/etc/lighttpd.conf && \
		echo "\$$HTTP[\"url\"] =~ \"^/front-react/\" {" >> /opt/ACIC/etc/lighttpd.conf && \
		echo "    server.error-handler-404 = \"/front-react/index.html\"" >> /opt/ACIC/etc/lighttpd.conf && \
		echo "}" >> /opt/ACIC/etc/lighttpd.conf && \
		systemctl restart acic-httpd; \
	fi'

PWD := $(shell pwd)
UID := $(shell id -u)
docker-dist:
	docker run --rm -u $(UID) -v $(PWD):/src node:lts-bookworm bash -c "cd /src && make dist"

dist: install build
	rm -Rf dist/home/
	mkdir -p dist/home/www/front-react
	mv dist/assets/ dist/home/www/front-react/
	mv dist/*.* dist/home/www/front-react/

run:
	make nvm CMD="npm run dev"

install:
	curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
	bash -c 'source ~/.nvm/nvm.sh ; nvm install --lts'
	make nvm CMD="npm install"

lint:
	make nvm CMD="npm run lint"

test:
	make nvm CMD="npm run test"

coverage:
	make nvm CMD="npm run coverage"

clean:
	rm -rf node_modules/ dist/ package-lock.json

nvm:
	bash -c 'source ~/.nvm/nvm.sh ; nvm exec $(NODE_VERSION) $(CMD)'

