COMPOSE=docker compose
COMPOSE_FILE=docker-compose.yml

help:
	@echo "Usage make [TARGET]"
	@echo ""
	@echo "Targets:"
	@echo ""
	@echo " -all:		Start all services (Docker)"
	@echo " -down:		Stop all services"
	@echo " -restart:	Restart all services"
	@echo " -logs:		Show logs from services"
	@echo " -build:	Build all Docker images"
	@echo " -clean:	Remove containers, images, volumes"
	@echo " -user:		Run only user management service"
	@echo " -game:		Run only game service"
	@echo " -nginx:	Run only nginx"
	@echo " -metrics:	Run metrics (Prometheus, Grafana)"
	@echo " -front:	Run front"

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

cleanFront:
	$(COMPOSE) -f $(COMPOSE_FILE) down -v --rmi frontend --remove-orphans

user:
	docker-compose up -d usermanagement

game:
	docker-compose up -d game

nginx:
	docker-compose up -d nginx

metrics:
	docker-compose up -d prometheus grafana

front:
	docker-compose up -d frontend
