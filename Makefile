export SERVER := 192.168.20.147

.PHONY: build install

build:
	$(MAKE) -C frontend build
	$(MAKE) -C backend build

deploy:
	$(MAKE) -C frontend deploy
	$(MAKE) -C backend deploy

install:
	$(MAKE) -C frontend install
	$(MAKE) -C backend install
