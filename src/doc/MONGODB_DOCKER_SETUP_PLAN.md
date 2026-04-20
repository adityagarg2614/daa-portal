# Plan: Setup MongoDB in Docker Container

This document outlines the strategy for transitioning the Algo-Grade DAA Portal's MongoDB database from a local manual setup to a containerized environment using Docker Compose.

## 1. Background
Currently, the application relies on a locally installed MongoDB instance. To improve reproducibility and ease of deployment as outlined in the [Production Deployment Plan](file:///Users/adityagarg/Desktop/daa-portal/src/doc/important/PRODUCTION_DEPLOYMENT_PLAN.md), we will migrate this to a Docker container.

## 2. Target Configuration

| Aspect | Current (Dev) | Target (Dockerized) |
|--------|---------------|----------------------|
| **MongoDB** | Local instance, manual setup | Docker container (`mongo:latest`) |
| **Volumes** | Local disk | Named Docker volume (`mongo-data`) |
| **Networking** | `localhost:27017` | Service name-based (`mongo:27017`) |

## 3. Implementation Steps

### Step 1: Create `docker-compose.yml`
We will introduce a `docker-compose.yml` file in the project root to orchestrate the application and the database.

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      args:
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: ${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
    ports:
      - "3000:3000"
    env_file:
      - .env.local
    depends_on:
      - mongo

  mongo:
    image: mongo:latest
    container_name: daa-portal-mongo
    ports:
      - "27017:27017" # Exposed for local debugging/tools
    volumes:
      - mongo-data:/data/db
    restart: always

volumes:
  mongo-data:
```

### Step 2: Update Environment Variables
The `MONGODB_URI` in `.env.local` needs to point to the `mongo` service name when running within the Docker network.

**New URI:** `mongodb://mongo:27017/daa-portal`

### Step 3: Update Makefile (Optional but Recommended)
The existing `Makefile` handles single-container builds and runs. It should be updated to use `docker compose` for a more seamless experience.

## 4. Verification
1. Run `docker compose up -d --build`.
2. Check logs with `docker compose logs -f app` to ensure the application connects to MongoDB.
3. Test data persistence by stopping the containers and verifying that data remains intact upon restart.

## 5. User Review Required
> [!IMPORTANT]
> Transitioning to Docker for MongoDB will require you to either:
> 1. Export your current local data and import it into the container.
> 2. Start with a fresh database in the container.
> 
> Please let me know if you would like assistance with data migration.
