COMPOSE=docker compose
COMPOSE_FILE=docker-compose.yml
CMD_LOCAL_NETWORK_ADDR=ip addr | grep "brd 10." | awk '{print $$2}' | cut -d'/' -f1;
ENV_FILE=.env

help:
	@echo "Usage: make [TARGET]"
	@echo ""
	@echo "Targets:"
	@echo "  all         Start all services"
	@echo "  down        Stop all services"
	@echo "  restart     Restart all services"
	@echo "  logs        Show logs"
	@echo "  build       Build all images (no cache)"
	@echo "  clean       Remove containers, images, volumes"
	@echo "  user        Run only user-service"
	@echo "  game-dev    Run game service in dev mode (hot reload)"
	@echo "  game-prod   Run game service in prod mode"
	@echo "  nginx       Run only nginx"
	@echo "  front       Run only frontend"

localadress:
	@if grep -q "^VITE_LOCAL_ADDRESS=" $(ENV_FILE); then \
		sed -i "/^VITE_LOCAL_ADDRESS=/d" $(ENV_FILE); \
	fi
	echo "VITE_LOCAL_ADDRESS=$$($(CMD_LOCAL_NETWORK_ADDR))" >> $(ENV_FILE);
	@echo "VITE_LOCAL_ADDRESS set to $$($(CMD_LOCAL_NETWORK_ADDR)) in $(ENV_FILE)"

all: localadress
	$(COMPOSE) -f $(COMPOSE_FILE) up -d
	@echo "The website run at http://$$($(CMD_LOCAL_NETWORK_ADDR)):5173"

down:
	$(COMPOSE) -f $(COMPOSE_FILE) down

restart:
	$(COMPOSE) -f $(COMPOSE_FILE) down && $(COMPOSE) -f $(COMPOSE_FILE) up -d

logs:
	$(COMPOSE) -f $(COMPOSE_FILE) logs -f --tail=100

build:
	$(COMPOSE) -f $(COMPOSE_FILE) build --no-cache

clean:
	$(COMPOSE) -f $(COMPOSE_FILE) down -v --rmi all --remove-orphans

user:
	$(COMPOSE) -f $(COMPOSE_FILE) up -d user-service

nginx:
	$(COMPOSE) -f $(COMPOSE_FILE) up -d nginx

front:
	$(COMPOSE) -f $(COMPOSE_FILE) up -d frontend

