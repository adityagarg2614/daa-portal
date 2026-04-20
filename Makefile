# ─────────────────────────────────────────────────────────────
# Makefile — daa-portal Docker helpers
# Automatically reads .env.local so you never forget --build-arg
# ─────────────────────────────────────────────────────────────

# Load env vars from .env.local (reads NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY etc.)
include .env.local
export

IMAGE_NAME     = daa-portal
CONTAINER_NAME = daa-portal-app

.PHONY: build run stop restart logs clean

## Build and start services using Docker Compose
up:
	docker compose up -d --build

## Stop and remove services
down:
	docker compose down

## View logs
logs:
	docker compose logs -f

## Build image only
build:
	docker compose build

## Clean up everything (including volumes)
clean:
	docker compose down -v
	docker rmi $(IMAGE_NAME):latest || true
