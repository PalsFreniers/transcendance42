COMPOSE=docker compose
COMPOSE_FILE=docker-compose.yml
CMD_LOCAL_NETWORK_ADDR=ip addr | grep "brd 10." | awk '{print $$2}' | cut -d'/' -f1;
ENV_FILE=.env
GEN_API_FILE=cli/cli.conf

help:
	@echo "Usage: make [TARGET]"
	@echo ""
	@echo "Targets:"
	@echo "  all         Start all services and compile cli"
	@echo "  down        Stop all services"
	@echo "  restart     Restart all services"
	@echo "  logs        Show logs"
	@echo "  build       Build all images (no cache)"
	@echo "  clean       Remove containers, images, volumes"
	@echo "  user        Run only user-service"
	@echo "  dev    	 Run project service in dev mode (hot reload)"
	@echo "  prod    	 Run project service in prod mode"
	@echo "  nginx       Run only nginx"
	@echo "  front       Run only frontend"
	@echo "  cli         compile the cli and open pdf documentation"

localadress:
	@if grep -q "^VITE_LOCAL_ADDRESS=" $(ENV_FILE); then \
		sed -i "/^VITE_LOCAL_ADDRESS=/d" $(ENV_FILE); \
	fi
	@echo "VITE_LOCAL_ADDRESS=$$($(CMD_LOCAL_NETWORK_ADDR))" >> $(ENV_FILE);
	@echo "VITE_LOCAL_ADDRESS set to $$($(CMD_LOCAL_NETWORK_ADDR)) in $(ENV_FILE)"

setprod:
	@if grep -q "^LAUNCH=" $(ENV_FILE); then \
		sed -i "/^LAUNCH=/d" $(ENV_FILE); \
	fi
	@echo "LAUNCH=start" >> $(ENV_FILE);
	@echo "LAUNCH set to prod in $(ENV_FILE)"

setdev:
	@if grep -q "^LAUNCH=" $(ENV_FILE); then \
		sed -i "/^LAUNCH=/d" $(ENV_FILE); \
	fi
	@echo "LAUNCH=dev" >> $(ENV_FILE);
	@echo "LAUNCH set to dev in $(ENV_FILE)"

all: prod
	@$(MAKE) -C . cli --no-print-directory
	@echo "The website run at https://$$($(CMD_LOCAL_NETWORK_ADDR)):8443"

down:
	@$(COMPOSE) -f $(COMPOSE_FILE) down

restart:
	@$(COMPOSE) -f $(COMPOSE_FILE) down && $(COMPOSE) -f $(COMPOSE_FILE) up -d

logs:
	@$(COMPOSE) -f $(COMPOSE_FILE) logs -f --tail=100

build:
	@$(COMPOSE) -f $(COMPOSE_FILE) build --no-cache

clean:
	@$(COMPOSE) -f $(COMPOSE_FILE) down -v --rmi all --remove-orphans
	@$(MAKE) -C cli clean --no-print-directory

user:
	@$(COMPOSE) -f $(COMPOSE_FILE) up -d user-service

prod: localadress setprod
	@$(COMPOSE) -f $(COMPOSE_FILE) up -d --build
	@echo "Production mode started — built version running."
	@echo "Website: https://$$($(CMD_LOCAL_NETWORK_ADDR)):8443"

dev: localadress setdev
	@$(COMPOSE) -f $(COMPOSE_FILE) up -d --build
	@echo "Production mode started — built version running."
	@echo "Website: https://$$($(CMD_LOCAL_NETWORK_ADDR)):8443"

nginx:
	@$(COMPOSE) -f $(COMPOSE_FILE) up -d nginx

front:
	@$(COMPOSE) -f $(COMPOSE_FILE) up -d frontend

re: clean all

cli:
	@echo "addr:=\"$$($(CMD_LOCAL_NETWORK_ADDR))\"\nport:=\"8443\"" > $(GEN_API_FILE)
	@$(MAKE) -C cli --no-print-directory

.PHONY: help localadress setprod setdev all down restart logs build clean user prod dev nginx front cli re
