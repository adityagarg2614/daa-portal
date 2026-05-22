# ─────────────────────────────────────────────────────────────
# Makefile — daa-portal Docker helpers
# Automatically reads .env.local so you never forget --build-arg
# ─────────────────────────────────────────────────────────────

# Load env vars from .env.local (reads NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY etc.)
include .env.local
export

IMAGE_NAME     = daa-portal
CONTAINER_NAME = daa-portal-app
COMPOSE_CMD    := $(shell if docker compose version >/dev/null 2>&1; then echo "docker compose"; elif command -v docker-compose >/dev/null 2>&1; then echo "docker-compose"; else echo "docker compose"; fi)

.PHONY: build run stop restart logs clean

## Build and start services using Docker Compose
up:
	$(COMPOSE_CMD) up -d --build

## Stop and remove services
down:
	$(COMPOSE_CMD) down

## View logs
logs:
	$(COMPOSE_CMD) logs -f

## Build image only
build:
	$(COMPOSE_CMD) build

## Clean up everything (including volumes)
clean:
	$(COMPOSE_CMD) down -v
	docker rmi $(IMAGE_NAME):latest || true
