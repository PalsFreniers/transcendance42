COMPOSE=docker compose
COMPOSE_FILE=docker-compose.yml

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

all:
	$(COMPOSE) -f $(COMPOSE_FILE) up -d

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

