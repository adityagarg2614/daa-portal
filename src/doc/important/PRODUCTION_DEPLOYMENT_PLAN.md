# Production Deployment Plan — Algo-Grade DAA Portal

## Vision

Transform the Algo-Grade DAA Portal from a development environment into a **production-grade, cloud-native, auto-scaling platform** with:

- **Docker containerization** of the Next.js application
- **Docker Compose orchestration** linking the app, MongoDB, and Piston containers
- **Kubernetes orchestration** for autoscaling, load balancing, and high availability
- **CI/CD pipelines** via GitHub Actions for automated testing, building, and deployment

This plan is organized into **5 phases**, each building on the previous one. No phase should be skipped.

---

## Architecture Overview (Target State)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Cloud Provider (AWS/GCP/DigitalOcean)           │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                    Kubernetes Cluster                              │  │
│  │                                                                    │  │
│  │  ┌──────────────┐    ┌─────────────────────────────────────────┐  │  │
│  │  │  Ingress /   │    │           Piston Deployment              │  │  │
│  │  │  Load Balancer│   │  ┌─────┐  ┌─────┐  ┌─────┐              │  │  │
│  │  │  (Nginx/ALB) │    │  │Pod 1│  │Pod 2│  │Pod 3│  (HPA)       │  │  │
│  │  └──────┬───────┘    │  └─────┘  └─────┘  └─────┘              │  │  │
│  │         │            │  └─────────────────────────────────────────┘  │  │
│  │         ├────────────┤                                               │  │
│  │  ┌──────▼───────┐    ┌─────────────────────────────────────────┐    │  │
│  │  │  Next.js     │◄───│       MongoDB Deployment                │    │  │
│  │  │  Deployment  │    │  ┌───────────────────────────────────┐  │    │  │
│  │  │  ┌─────┐     │    │  │  Pod (StatefulSet)                │  │    │  │
│  │  │  │Pod 1│     │    │  │  PersistentVolume (data)          │  │    │  │
│  │  │  │Pod 2│     │    │  └───────────────────────────────────┘  │    │  │
│  │  │  │Pod 3│     │    └─────────────────────────────────────────┘    │  │
│  │  │  └─────┘     │                                                    │  │
│  │  │  (HPA)       │                                                    │  │
│  │  └──────────────┘                                                    │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  External Services                                                 │  │
│  │  - Clerk Auth (SaaS)                                               │  │
│  │  - Resend Email (SaaS)                                             │  │
│  │  - CloudFlare CDN (optional)                                       │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Docker Containerization

**Goal:** Create a production-ready Docker image for the Next.js application that can be pushed to Docker Hub or any container registry.

### Why This Phase First?

Before orchestrating multiple containers or deploying to Kubernetes, we need a **single, reproducible, optimized Docker image** for the application itself. This image is the foundation for every subsequent phase.

### What We'll Do

#### 1.1 Multi-Stage Dockerfile

Create a 4-stage Dockerfile for the smallest possible production image (~150MB):

| Stage | Base Image | Purpose |
|-------|-----------|---------|
| `base` | `node:20-alpine` | Install system dependencies (`libc6-compat` for Next.js compatibility) |
| `deps` | from `base` | Install dependencies via `npm ci --production` (layer caching) |
| `builder` | from `base` | Run `npm run build` to generate `.next/standalone` output |
| `runner` | from `base` | Copy only production artifacts, run as **non-root user**, expose port 3000 |

**Key Features:**
- **Alpine-based** — minimal image size, reduced attack surface
- **Standalone output** — `next.config.ts` configured with `output: "standalone"` for self-contained deployment
- **Non-root user** — container runs as `nextjs` user (security best practice)
- **Docker HEALTHCHECK** — built-in health monitoring via `/api/health` endpoint
- **Layer caching** — `package*.json` copied before source code for faster rebuilds

#### 1.2 Health Check Endpoint

Create `src/app/api/health/route.ts`:

```typescript
export async function GET() {
    return NextResponse.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version,
    })
}
```

This endpoint is used by:
- Docker HEALTHCHECK instruction
- Kubernetes liveness/readiness probes
- Load balancer health checks
- CI/CD deployment verification

#### 1.3 .dockerignore File

Exclude unnecessary files from the Docker build context:

```
node_modules
.next
.git
.env*.local
*.md
Dockerfile
.dockerignore
```

#### 1.4 next.config.ts Updates

```typescript
const nextConfig: NextConfig = {
    output: "standalone",         // Enable standalone output
    typescript: {
        ignoreBuildErrors: true,  // Keep existing setting (review later)
    },
};
```

#### 1.5 Environment Variable Strategy

**Problem:** The Piston API URL is currently hardcoded in `src/lib/piston.ts`.

**Solution:** Externalize all configuration to environment variables:

| Variable | Purpose | Example |
|----------|---------|---------|
| `PISTON_API_URL` | Piston container endpoint | `http://piston:2000/api/v2` |
| `MONGODB_URI` | MongoDB connection | `mongodb://mongo:27017/daa-portal` |
| `CLERK_SECRET_KEY` | Clerk authentication | `sk_test_...` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk public key | `pk_test_...` |
| `RESEND_API_KEY` | Email service | `re_xxx` |
| `FROM_EMAIL` | Sender email | `noreply@algo-grade.com` |
| `NODE_ENV` | Runtime environment | `production` |

Update `src/lib/piston.ts`:
```typescript
const PISTON_API = process.env.PISTON_API_URL || "http://localhost:2000/api/v2";
```

#### 1.6 Docker Hub Setup

- Create a Docker Hub account (or use existing)
- Image naming: `<username>/daa-portal:<tag>`
- Tags strategy: `latest`, `<git-sha>`, `<semver>`

### Deliverables

| File | Purpose |
|------|---------|
| `Dockerfile` | Multi-stage build for production image |
| `.dockerignore` | Exclude unnecessary build context |
| `src/app/api/health/route.ts` | Health check endpoint |
| Updated `src/lib/piston.ts` | Externalized Piston URL |
| Updated `next.config.ts` | Standalone output enabled |

### Why Not Start With Kubernetes?

Kubernetes expects container images to already exist. Building the Docker image first:
- Validates the application builds successfully in containers
- Creates a testable artifact before orchestration complexity
- Allows local testing with `docker run` before Docker Compose or K8s
- Is the prerequisite for both Docker Compose AND Kubernetes phases

---

## Phase 2: Docker Compose Orchestration

**Goal:** Create a `docker-compose.yml` file that runs all services (Next.js app, MongoDB, Piston) together as a unified system, ready for deployment on a single server.

### Why This Phase?

Docker Compose bridges the gap between a single Docker container and full Kubernetes. It provides:

- **Multi-container orchestration** on a single host
- **Service discovery** — containers find each other by service name
- **Volume management** — persistent data for MongoDB and Piston packages
- **Network isolation** — services communicate on an internal Docker network
- **Simpler than Kubernetes** — good stepping stone before K8s complexity

### Current State vs. Target State

| Aspect | Current (Dev) | Target (Docker Compose) |
|--------|---------------|------------------------|
| Next.js App | Runs via `npm run dev` | Runs in Docker container |
| MongoDB | Local instance, manual setup | Docker container with named volume |
| Piston | Manually started via `docker run` | Managed by Docker Compose |
| Networking | `localhost` hardcoded | Service names (`piston`, `mongo`) |
| Environment Variables | Manual `.env` file | Compose `env_file` + `environment` |

### What We'll Do

#### 2.1 Docker Compose File Structure

Create two compose files:

**`docker-compose.yml`** — Development (default)
```yaml
services:
  app:
    build:
      context: .
      target: deps          # Use deps stage for hot-reloading
    command: npm run dev
    volumes:
      - .:/app              # Mount source for live reload
      - /app/node_modules
    ports:
      - "3000:3000"
    env_file:
      - .env.development
    depends_on:
      - mongo
      - piston

  mongo:
    image: mongo:6.0
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: admin123

  piston:
    image: ghcr.io/engineer-man/piston:latest
    privileged: true
    ports:
      - "2000:2000"
    volumes:
      - piston-packages:/var/piston/packages

volumes:
  mongo-data:
  piston-packages:
```

**`docker-compose.prod.yml`** — Production (extends development)
```yaml
services:
  app:
    build:
      context: .
      target: runner        # Use final production stage
    command: npm start
    restart: unless-stopped
    env_file:
      - .env.production
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: 512M
        reservations:
          cpus: "0.5"
          memory: 256M
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"

  mongo:
    restart: unless-stopped
    # No port exposure in production (internal network only)
    ports: []
    volumes:
      - mongo-data:/data/db

  piston:
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: "2.0"
          memory: 1G
```

#### 2.2 Network Configuration

All services connect to a **custom bridge network**:

```yaml
networks:
  app-network:
    driver: bridge
```

Inside this network, services resolve by **service name**:
- Next.js app → Piston: `http://piston:2000/api/v2`
- Next.js app → MongoDB: `mongodb://mongo:27017/daa-portal`

**No more hardcoded `localhost` URLs.**

#### 2.3 Volume Strategy

| Volume | Purpose | Persistence |
|--------|---------|-------------|
| `mongo-data` | MongoDB database files | Survives container restarts |
| `piston-packages` | Piston language runtimes | Survives container restarts |

Named volumes are managed by Docker and survive `docker compose down` (but not `docker compose down -v`).

#### 2.4 Resource Limits (Production)

Prevent any single container from consuming all host resources:

```yaml
deploy:
  resources:
    limits:
      cpus: "1.0"       # Max 1 CPU core
      memory: 512M      # Max 512MB RAM
    reservations:
      cpus: "0.5"       # Guaranteed 0.5 CPU
      memory: 256M      # Guaranteed 256MB RAM
```

#### 2.5 Log Management

Prevent disk exhaustion from unbounded logs:

```yaml
logging:
  driver: json-file
  options:
    max-size: "10m"    # Rotate at 10MB
    max-file: "3"      # Keep 3 rotated files
```

### Deliverables

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Development orchestration |
| `docker-compose.prod.yml` | Production orchestration |
| `.env.example` | Template for required environment variables |
| Updated `src/lib/piston.ts` | Uses `PISTON_API_URL` env var |

### Why Not Skip to Kubernetes?

Docker Compose is valuable because:
- **Local development parity** — developers run the same stack locally
- **Single-server deployments** — many projects never need K8s; Compose is sufficient
- **Incremental learning** — concepts (networking, volumes, resource limits) translate directly to K8s
- **Testing ground** — validate the multi-container architecture before K8s complexity

---

## Phase 3: CI/CD Pipeline (GitHub Actions)

**Goal:** Automate testing, building, Docker image creation, and deployment on every push/merge to specific branches.

### Why This Phase Before Kubernetes?

CI/CD is **independent of deployment target**. Whether you deploy via Docker Compose, Kubernetes, or manually, you need:

- Automated testing on every PR
- Automated Docker builds on every merge
- Image versioning and registry management
- Deployment automation (whatever the target)

Setting up CI/CD now means:
- Every commit is tested before reaching production
- Docker images are built and versioned automatically
- Deployment is a single command (or fully automatic)
- Rollbacks are trivial (redeploy previous image tag)

### What We'll Do

#### 3.1 CI/CD Pipeline Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      Developer Pushes Code                    │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│  Job 1: TEST (runs on EVERY push & PR)                       │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ 1. Checkout code                                       │  │
│  │ 2. Setup Node.js 20                                    │  │
│  │ 3. Cache node_modules                                  │  │
│  │ 4. npm ci                                              │  │
│  │ 5. npm run lint                                        │  │
│  │ 6. npm run build                                       │  │
│  │ 7. (Future) npm run test                               │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────┬───────────────────────────────────────┘
                       │ (only on main branch)
                       ▼
┌──────────────────────────────────────────────────────────────┐
│  Job 2: BUILD & PUSH (runs only on main branch)              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ 1. Login to Docker Hub                                 │  │
│  │ 2. Build Docker image (multi-stage, cached)            │  │
│  │ 3. Tag image: <sha> and latest                         │  │
│  │ 4. Push to Docker Hub                                  │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│  Job 3: DEPLOY (Phase 3: SSH / Phase 4: Kubernetes)          │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Phase 3 (Docker Compose on VPS):                       │  │
│  │ 1. SSH into server                                    │  │
│  │ 2. docker compose pull                                │  │
│  │ 3. docker compose up -d --no-deps --wait app           │  │
│  │ 4. Verify /api/health                                  │  │
│  │ 5. docker image prune -f                               │  │
│  │                                                        │  │
│  │ Phase 4 (Kubernetes):                                  │  │
│  │ 1. kubectl set image deployment/daa-portal ...         │  │
│  │ 2. kubectl rollout status                              │  │
│  │ 3. Verify health endpoint                              │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

#### 3.2 GitHub Actions Workflow File

`.github/workflows/ci-cd.yml`:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  DOCKERHUB_USERNAME: ${{ secrets.DOCKERHUB_USERNAME }}
  DOCKERHUB_TOKEN: ${{ secrets.DOCKERHUB_TOKEN }}
  IMAGE_NAME: daa-portal

jobs:
  # ─────────────────────────────────────
  # JOB 1: Test
  # ─────────────────────────────────────
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Build
        run: npm run build
        env:
          # Skip env validation during CI build
          SKIP_ENV_VALIDATION: "1"

      # Future: Add unit/integration tests here
      # - name: Run tests
      #   run: npm test

  # ─────────────────────────────────────
  # JOB 2: Build & Push Docker Image
  # ─────────────────────────────────────
  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.DOCKERHUB_USERNAME }}/${{ env.IMAGE_NAME }}
          tags: |
            type=sha,format=long
            type=raw,value=latest

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          cache-from: type=gha
          cache-to: type=gha,mode=max
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}

  # ─────────────────────────────────────
  # JOB 3: Deploy (Phase 3: Docker Compose)
  # ─────────────────────────────────────
  deploy-compose:
    needs: build-and-push
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to VPS via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /opt/apps/daa-portal

            # Pull latest images
            docker compose -f docker-compose.prod.yml pull

            # Restart app container (zero-downtime)
            docker compose -f docker-compose.prod.yml up -d --no-deps --wait app

            # Health check (retry up to 30 times)
            for i in $(seq 1 30); do
              if curl -sf http://localhost:3000/api/health; then
                echo "Deployment successful!"
                break
              fi
              echo "Waiting for app to start... ($i/30)"
              sleep 5
            done

            # Clean up old images
            docker image prune -f
```

#### 3.3 Required GitHub Secrets

| Secret | Purpose | Where to Get |
|--------|---------|-------------|
| `DOCKERHUB_USERNAME` | Docker Hub account name | Docker Hub profile |
| `DOCKERHUB_TOKEN` | Docker Hub access token | Docker Hub → Settings → Security |
| `VPS_HOST` | Production server IP/hostname | Your hosting provider |
| `VPS_USER` | SSH username for deployment | Your server setup |
| `VPS_SSH_KEY` | Private key for SSH deployment | Generate via `ssh-keygen` |

#### 3.4 Branch Strategy

| Branch | Purpose | Pipeline Behavior |
|--------|---------|-------------------|
| `develop` | Feature integration | Runs TEST job only |
| `main` | Production-ready code | Runs TEST → BUILD → DEPLOY |
| `feature/*` | Feature development | Runs TEST job on PR |

#### 3.5 Docker Build Optimization

**GitHub Actions Cache:**
```yaml
cache-from: type=gha
cache-to: type=gha,mode=max
```
This caches Docker build layers between workflow runs, reducing build time from ~5 minutes to ~1 minute on subsequent builds.

### Deliverables

| File | Purpose |
|------|---------|
| `.github/workflows/ci-cd.yml` | Main CI/CD workflow |
| GitHub repository secrets | Credentials and configuration |
| VPS server setup script | Initial server provisioning (optional) |

### Why CI/CD Before Kubernetes?

- **Kubernetes doesn't build images** — it only runs them. CI/CD builds the images K8s deploys.
- **Testing is universal** — tests should run regardless of deployment target.
- **Separation of concerns** — CI/CD handles "is this code good?", K8s handles "how do I run it reliably?"
- **Rollback capability** — if a K8s deployment fails, CI/CD can redeploy the previous image tag.

---

## Phase 4: Kubernetes Orchestration

**Goal:** Deploy the entire system to a Kubernetes cluster with autoscaling, load balancing, self-healing, and high availability.

### Why This Phase?

This is the **culmination of all previous phases**:
- Phase 1 gave us a production Docker image
- Phase 2 gave us the multi-container architecture
- Phase 3 gave us automated builds and deployments

Kubernetes takes this further with:
- **Automatic scaling** during traffic spikes (assignment deadlines)
- **Self-healing** — restarts crashed containers automatically
- **Zero-downtime deployments** — rolling updates
- **Load balancing** — distribute traffic across multiple pods
- **Resource optimization** — pack pods efficiently across nodes

### When Do You Actually Need Kubernetes?

Kubernetes is **overkill** for small deployments. You need it when:

| Scenario | Docker Compose | Kubernetes |
|----------|---------------|------------|
| Single server, <100 students | ✅ Sufficient | ❌ Overkill |
| Multiple servers | ❌ Cannot | ✅ Required |
| Autoscaling needed | ❌ Cannot | ✅ Built-in |
| Zero-downtime deploys | ⚠️ Manual | ✅ Built-in |
| 500+ concurrent users | ❌ Will struggle | ✅ Handles well |
| High availability required | ❌ Single point of failure | ✅ Self-healing |

**For Algo-Grade DAA Portal:** Kubernetes becomes essential when you have **multiple assignments with overlapping deadlines**, causing traffic spikes that a single server cannot handle.

### What We'll Do

#### 4.1 Kubernetes Cluster Options

| Option | Best For | Cost | Management |
|--------|----------|------|------------|
| **Minikube** | Local development | Free | Self-managed |
| **Kind** | Local development / CI | Free | Self-managed |
| **GKE (Google)** | Production | $70+/mo | Managed |
| **EKS (AWS)** | Production | $70+/mo | Managed |
| **AKS (Azure)** | Production | $70+/mo | Managed |
| **DigitalOcean K8s** | Production / Budget | $10+/node/mo | Managed |
| **Linode LKE** | Production / Budget | $10+/node/mo | Managed |

**Recommendation:** Start with **Minikube** for development, then **DigitalOcean K8s** or **Linode LKE** for production (most cost-effective for small-medium scale).

#### 4.2 Kubernetes Manifests Overview

We'll create the following resources:

```
k8s/
├── namespace.yml                # Isolate our resources
├── app/
│   ├── configmap.yml            # Environment variables
│   ├── secret.yml               # Sensitive data (encrypted)
│   ├── deployment.yml           # App pods
│   ├── service.yml              # Internal load balancer
│   ├── hpa.yml                  # Autoscaling rules
│   └── ingress.yml              # External access + SSL
├── mongo/
│   ├── statefulset.yml          # MongoDB pods (stateful)
│   ├── service.yml              # MongoDB internal service
│   └── pvc.yml                  # Persistent storage
├── piston/
│   ├── deployment.yml           # Piston pods
│   ├── service.yml              # Piston internal service
│   └── hpa.yml                  # Piston autoscaling
└── monitoring/
    └── (future)                 # Prometheus, Grafana
```

#### 4.3 Namespace

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: daa-portal
```

All resources are isolated in their own namespace for security and organization.

#### 4.4 ConfigMap (Non-Sensitive Configuration)

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: daa-portal-config
  namespace: daa-portal
data:
  PISTON_API_URL: "http://piston-service:2000/api/v2"
  MONGODB_URI: "mongodb://mongo-service:27017/daa-portal"
  NODE_ENV: "production"
  NEXT_PUBLIC_APP_URL: "https://algo-grade.example.com"
```

#### 4.5 Secret (Sensitive Data)

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: daa-portal-secrets
  namespace: daa-portal
type: Opaque
stringData:
  CLERK_SECRET_KEY: "sk_test_..."
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_..."
  RESEND_API_KEY: "re_..."
  MONGO_INITDB_ROOT_USERNAME: "admin"
  MONGO_INITDB_ROOT_PASSWORD: "secure-password-here"
```

**Production security:** Use **SOPS + age** or **cloud KMS** to encrypt secrets at rest. Never commit plaintext secrets to Git.

#### 4.6 Next.js Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: daa-portal
  namespace: daa-portal
spec:
  replicas: 2                   # Start with 2 pods
  selector:
    matchLabels:
      app: daa-portal
  strategy:
    type: RollingUpdate         # Zero-downtime updates
    rollingUpdate:
      maxSurge: 1               # Add 1 new pod before removing old
      maxUnavailable: 0         # Never drop below current count
  template:
    metadata:
      labels:
        app: daa-portal
    spec:
      containers:
        - name: daa-portal
          image: <dockerhub-username>/daa-portal:latest
          ports:
            - containerPort: 3000
          envFrom:
            - configMapRef:
                name: daa-portal-config
            - secretRef:
                name: daa-portal-secrets
          resources:
            requests:           # Guaranteed resources
              cpu: "250m"       # 0.25 CPU cores
              memory: "256Mi"
            limits:             # Maximum allowed
              cpu: "500m"       # 0.5 CPU cores
              memory: "512Mi"
          readinessProbe:       # Is the pod ready to receive traffic?
            httpGet:
              path: /api/health
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 5
          livenessProbe:        # Is the pod still alive?
            httpGet:
              path: /api/health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
            failureThreshold: 3
```

**Key features:**
- **Rolling updates** — zero downtime during deployments
- **Resource requests/limits** — required for HPA to work
- **Readiness probe** — traffic only sent after pod is ready
- **Liveness probe** — crashed pods are automatically restarted

#### 4.7 Service (Internal Load Balancer)

```yaml
apiVersion: v1
kind: Service
metadata:
  name: daa-portal-service
  namespace: daa-portal
spec:
  type: ClusterIP
  selector:
    app: daa-portal
  ports:
    - port: 80
      targetPort: 3000
      protocol: TCP
```

The Service acts as an **internal load balancer** — it automatically distributes traffic across all running pods matching the selector.

#### 4.8 Horizontal Pod Autoscaler (HPA)

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: daa-portal-hpa
  namespace: daa-portal
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: daa-portal
  minReplicas: 2                # Always keep at least 2 pods
  maxReplicas: 10               # Scale up to 10 pods under load
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 60  # Scale when avg CPU > 60%
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 70  # Scale when avg memory > 70%
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60   # Wait 60s before scaling up
      policies:
        - type: Pods
          value: 2                      # Add max 2 pods at a time
          periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 300  # Wait 5 min before scaling down
      policies:
        - type: Pods
          value: 1                      # Remove max 1 pod at a time
          periodSeconds: 120
```

**How HPA Helps During Assignment Deadlines:**

```
Timeline of an Assignment Deadline:

11:00 PM  ─ 2 pods running (baseline)           CPU: 15%
11:30 PM  ─ Students start submitting           CPU: 45%
11:45 PM  ─ Traffic spike!                      CPU: 75% → HPA triggers
11:46 PM  ─ 4 new pods starting up              CPU: 65%
11:47 PM  ─ 4 more pods (scaling continues)     CPU: 50%
11:50 PM  ─ 8 pods handling load               CPU: 40% (stable)
11:55 PM  ─ Deadline passes, traffic drops      CPU: 10%
12:00 AM  ─ Cooldown period (5 min)             CPU: 10%
12:05 AM  ─ Scale down begins (1 pod at a time)
12:15 AM  ─ Back to 2 pods (baseline)
```

Without HPA: The 2 pods would be overwhelmed, requests would timeout, students would lose submissions.

#### 4.9 Ingress (External Access + SSL)

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: daa-portal-ingress
  namespace: daa-portal
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - algo-grade.example.com
      secretName: daa-portal-tls
  rules:
    - host: algo-grade.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: daa-portal-service
                port:
                  number: 80
```

**Ingress provides:**
- **SSL/TLS termination** — HTTPS via Let's Encrypt (cert-manager)
- **Host-based routing** — multiple apps on same cluster with different domains
- **Load balancer integration** — connects to cloud provider's load balancer
- **Request size limits** — prevents abuse via `proxy-body-size`

#### 4.10 Piston Deployment + HPA

Piston also needs to scale — when many students submit code simultaneously, a single Piston pod becomes a bottleneck.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: piston
  namespace: daa-portal
spec:
  replicas: 2
  selector:
    matchLabels:
      app: piston
  template:
    metadata:
      labels:
        app: piston
    spec:
      containers:
        - name: piston
          image: ghcr.io/engineer-man/piston:latest
          securityContext:
            privileged: true    # Required for nested sandboxing
          ports:
            - containerPort: 2000
          resources:
            requests:
              cpu: "500m"
              memory: "512Mi"
            limits:
              cpu: "1000m"
              memory: "1Gi"
          readinessProbe:
            httpGet:
              path: /api/v2/
              port: 2000
            initialDelaySeconds: 30
            periodSeconds: 10
          volumeMounts:
            - name: piston-packages
              mountPath: /var/piston/packages
      volumes:
        - name: piston-packages
          persistentVolumeClaim:
            claimName: piston-packages-pvc
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: piston-hpa
  namespace: daa-portal
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: piston
  minReplicas: 2
  maxReplicas: 6
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

**Important:** Piston pods need `privileged: true` for nested code sandboxing. This is a security consideration — in production, consider using **Kata Containers** or **gVisor** for stronger isolation.

#### 4.11 MongoDB StatefulSet

MongoDB is stateful (it stores data), so it needs a **StatefulSet** instead of a Deployment:

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: mongo
  namespace: daa-portal
spec:
  serviceName: mongo-service
  replicas: 1                   # Single replica (can scale to replica set later)
  selector:
    matchLabels:
      app: mongo
  template:
    metadata:
      labels:
        app: mongo
    spec:
      containers:
        - name: mongo
          image: mongo:6.0
          ports:
            - containerPort: 27017
          envFrom:
            - secretRef:
                name: daa-portal-secrets
          volumeMounts:
            - name: mongo-data
              mountPath: /data/db
          resources:
            requests:
              cpu: "250m"
              memory: "512Mi"
            limits:
              cpu: "500m"
              memory: "1Gi"
  volumeClaimTemplates:
    - metadata:
        name: mongo-data
      spec:
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: 10Gi       # Adjust based on data size
```

**Why StatefulSet?**
- Stable pod name (`mongo-0`) — predictable DNS for connections
- Persistent storage that survives pod restarts
- Ordered deployment and scaling

#### 4.12 Load Balancing Architecture

```
                    Internet
                       │
                  ┌────▼─────┐
                  │  Ingress  │   (Cloud Load Balancer — AWS ALB / GCP LB)
                  │  (Nginx)  │   Distributes traffic across pods
                  └────┬─────┘
                       │
                  ┌────▼─────┐
                  │ Service  │   (Kubernetes ClusterIP — internal LB)
                  │ (Port 80)│   Round-robin across healthy pods
                  └────┬─────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
   ┌────▼───┐    ┌─────▼────┐   ┌────▼───┐
   │ Pod 1  │    │  Pod 2   │   │ Pod 3  │
   │:3000   │    │  :3000   │   │ :3000  │
   └────────┘    └──────────┘   └────────┘
   daa-portal    daa-portal     daa-portal
```

**Kubernetes automatically:**
- Routes traffic only to **ready** pods (readiness probe passes)
- Restarts **unhealthy** pods (liveness probe fails)
- Adds/removes pods from the load balancer as they scale up/down
- Distributes traffic evenly across all running pods

### Deliverables

| File/Directory | Purpose |
|---------------|---------|
| `k8s/namespace.yml` | Resource isolation |
| `k8s/app/configmap.yml` | Non-sensitive configuration |
| `k8s/app/secret.yml` | Encrypted sensitive data |
| `k8s/app/deployment.yml` | Next.js app pods with probes |
| `k8s/app/service.yml` | Internal load balancer |
| `k8s/app/hpa.yml` | Autoscaling rules |
| `k8s/app/ingress.yml` | External access + SSL |
| `k8s/mongo/statefulset.yml` | MongoDB with persistent storage |
| `k8s/mongo/service.yml` | MongoDB internal service |
| `k8s/mongo/pvc.yml` | Persistent volume claim |
| `k8s/piston/deployment.yml` | Piston pods with privileged mode |
| `k8s/piston/service.yml` | Piston internal service |
| `k8s/piston/hpa.yml` | Piston autoscaling |

### Prerequisites

Before this phase, you need:

| Requirement | How to Get |
|-------------|-----------|
| Kubernetes cluster | Minikube (local) or cloud provider (production) |
| `kubectl` CLI installed | `brew install kubectl` |
| `helm` (optional) | `brew install helm` |
| Metrics Server (for HPA) | `kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml` |
| Nginx Ingress Controller | `kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml` |
| cert-manager (for SSL) | `kubectl apply -f https://github.com/cert-manager/cert-manager/releases/latest/download/cert-manager.yaml` |

---

## Phase 5: Advanced Optimizations & Monitoring

**Goal:** Production-hardening the system with observability, security, backup strategies, and performance optimizations.

### Why This Phase?

The system is now functional and scalable. This phase makes it **enterprise-grade**:

- You can **see what's happening** (monitoring, logging, alerting)
- You can **recover from disasters** (backups, rollbacks)
- You can **handle more load efficiently** (caching, CDN, queue-based execution)
- You can **trust the system is secure** (secret management, network policies, RBAC)

### What We'll Do

#### 5.1 Monitoring Stack (Prometheus + Grafana)

```
┌─────────────────────────────────────────┐
│              Grafana Dashboard           │
│  ┌──────────┐  ┌──────────┐  ┌───────┐  │
│  │CPU Usage │  │Memory    │  │Request│  │
│  │Over Time │  │Over Time │  │Latency│  │
│  └──────────┘  └──────────┘  └───────┘  │
│  ┌───────────────────────────────────┐  │
│  │  Pod Count / HPA Status           │  │
│  │  Active Submissions / min         │  │
│  │  Piston Queue Depth              │  │
│  └───────────────────────────────────┘  │
└──────────────────┬──────────────────────┘
                   │
            ┌──────▼──────┐
            │  Prometheus  │  Scrapes metrics from all pods
            │  (Metrics DB)│  Stores time-series data
            └──────────────┘
```

**What to monitor:**

| Metric | Why It Matters | Alert Threshold |
|--------|---------------|-----------------|
| Pod CPU usage | Triggers HPA scaling | >80% for 2 min |
| Pod memory usage | Detects memory leaks | >90% |
| Request latency | User experience | P99 > 2s |
| Piston queue depth | Code execution backlog | >50 pending |
| MongoDB disk usage | Storage capacity | >80% |
| Error rate (5xx) | Application health | >1% of requests |
| HPA scaling events | Capacity planning | >3 scale-ups/hour |

#### 5.2 Structured Logging

Replace `console.log` with structured JSON logging:

```typescript
// src/lib/logger.ts
const logger = {
    info: (message: string, meta?: Record<string, any>) => {
        console.log(JSON.stringify({
            level: "info",
            message,
            timestamp: new Date().toISOString(),
            ...meta,
        }))
    },
    error: (message: string, error?: Error, meta?: Record<string, any>) => {
        console.error(JSON.stringify({
            level: "error",
            message,
            timestamp: new Date().toISOString(),
            error: error?.message,
            stack: error?.stack,
            ...meta,
        }))
    },
}
```

Logs are collected by **Fluentd/Loki** and viewable in Grafana.

#### 5.3 Secret Management (SOPS + age)

Instead of committing secrets to Git (even encrypted in K8s secrets):

```bash
# Install SOPS + age
brew install sops age

# Generate age key
age-keygen -o age.key

# Encrypt secrets
sops --encrypt --age <public-key> k8s/app/secret.yml > k8s/app/secret.enc.yml

# Decrypt at deploy time
sops --decrypt k8s/app/secret.enc.yml | kubectl apply -f -
```

**Alternative:** Use cloud provider secret managers:
- AWS Secrets Manager
- Google Cloud Secret Manager
- Azure Key Vault

#### 5.4 Backup Strategy

**MongoDB Automated Backups:**

```yaml
# k8s/mongo/backup-cronjob.yml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: mongo-backup
  namespace: daa-portal
spec:
  schedule: "0 2 * * *"    # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
            - name: mongodump
              image: mongo:6.0
              command:
                - /bin/sh
                - -c
                - |
                  mongodump --host mongo-service --username $MONGO_USER --password $MONGO_PASSWORD --out /backup
                  tar -czf /backup/backup-$(date +%Y%m%d).tar.gz /backup/dump
                  # Upload to cloud storage (AWS S3, GCP GCS, etc.)
              envFrom:
                - secretRef:
                    name: daa-portal-secrets
              volumeMounts:
                - name: backup-volume
                  mountPath: /backup
          restartPolicy: OnFailure
```

**Backup retention:** 30 daily + 12 monthly backups stored in cloud storage (S3/GCS).

#### 5.5 CDN Integration (CloudFlare / CloudFront)

Serve static assets (`/_next/static`, images) from edge locations:

```
Student Browser
       │
       ▼
┌──────────────┐
│  CloudFlare   │  CDN — caches static assets at edge locations
│  (CDN)        │  SSL termination, DDoS protection
└──────┬───────┘
       │
       ▼ (dynamic requests only)
┌──────────────┐
│  Kubernetes   │  Handles API routes, submissions, grading
│  Ingress      │
└──────────────┘
```

**Benefits:**
- Static assets load 5-10x faster (served from nearest edge)
- Reduced load on Kubernetes pods
- Free DDoS protection (CloudFlare)
- Automatic HTTP/2 and Brotli compression

#### 5.6 Queue-Based Code Execution (Optional)

For very high-traffic scenarios, decouple code execution from the HTTP request:

```
┌─────────┐    ┌──────────┐    ┌─────────┐    ┌──────────┐
│  Next.js │───▶│  Redis   │◄───│ Workers │───▶│  Piston  │
│  App     │    │  Queue   │    │ (K8s)   │    │  Pods    │
└─────────┘    └──────────┘    └─────────┘    └──────────┘
```

**Flow:**
1. Student submits code → Next.js pushes to Redis queue
2. Workers poll the queue and pick up submissions
3. Workers send code to Piston for execution
4. Results stored in MongoDB, WebSocket pushes update to student

**Why:** Prevents HTTP timeouts during massive submission spikes. Students see "processing..." instead of timeout errors.

#### 5.7 Network Policies (Security)

Restrict pod-to-pod communication:

```yaml
# Only allow Next.js pods to talk to Piston and MongoDB
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: daa-portal-policy
  namespace: daa-portal
spec:
  podSelector:
    matchLabels:
      app: daa-portal
  policyTypes:
    - Egress
  egress:
    - to:
        - podSelector:
            matchLabels:
              app: piston
      ports:
        - port: 2000
    - to:
        - podSelector:
            matchLabels:
              app: mongo
      ports:
        - port: 27017
    - to:
        - port: 53       # DNS
          protocol: UDP
        - port: 53
          protocol: TCP
```

#### 5.8 Blue-Green Deployments (Zero-Risk Releases)

Instead of rolling updates, deploy a complete parallel environment:

```
┌─────────────────────────────────────────┐
│  Ingress                                 │
│  │                                       │
│  ├──▶ Blue (v1.2.0) — Current Production │
│  │    3 pods running                     │
│  │                                       │
│  └──▶ Green (v1.3.0) — New Version       │
│       3 pods deployed, health-checked     │
│                                           │
│  When ready: switch traffic to Green     │
│  If issues: switch back to Blue instantly │
└─────────────────────────────────────────┘
```

**Benefit:** Instant rollback if the new version has bugs.

### Deliverables

| Component | Purpose |
|-----------|---------|
| Prometheus + Grafana manifests | Monitoring and visualization |
| Structured logger (`src/lib/logger.ts`) | Machine-parseable logs |
| SOPS-encrypted secrets | Secure secret management |
| MongoDB backup CronJob | Automated daily backups |
| CDN configuration | Static asset acceleration |
| Network policies | Pod-level security |
| (Optional) Redis + worker deployment | Queue-based execution |
| (Optional) Blue-green deployment scripts | Zero-risk releases |

---

## Implementation Timeline & Dependencies

```
Phase 1: Docker Containerization
  │
  ├── Deliverables: Dockerfile, .dockerignore, health endpoint
  └── Duration: 1-2 days
  │
  ▼
Phase 2: Docker Compose Orchestration
  │
  ├── Deliverables: docker-compose.yml, docker-compose.prod.yml
  ├── Depends on: Phase 1 (Dockerfile)
  └── Duration: 1-2 days
  │
  ▼
Phase 3: CI/CD Pipeline
  │
  ├── Deliverables: .github/workflows/ci-cd.yml
  ├── Depends on: Phase 1 (Dockerfile) — needs image to build
  ├── Can run parallel to: Phase 2
  └── Duration: 1-2 days
  │
  ▼
Phase 4: Kubernetes Orchestration
  │
  ├── Deliverables: k8s/ manifests (12+ files)
  ├── Depends on: Phase 1 (Docker image), Phase 2 (architecture validated)
  ├── Depends on: Phase 3 (CI/CD deploys images to K8s)
  └── Duration: 3-5 days
  │
  ▼
Phase 5: Advanced Optimizations
  │
  ├── Deliverables: Monitoring, backups, CDN, security
  ├── Depends on: Phase 4 (K8s cluster running)
  └── Duration: 2-4 days (incremental, pick what you need)
```

**Total estimated effort:** 8-15 days (depending on experience level)

---

## Key Decisions to Make Before Starting

### 1. Container Registry

| Option | Pros | Cons |
|--------|------|------|
| Docker Hub | Free tier, universal support | Rate limits on free tier, public repos on free |
| GitHub Container Registry (ghcr.io) | Free private repos, integrated with GitHub | Newer, fewer tutorials |
| AWS ECR | Integrated with AWS ecosystem | AWS-only, costs money |

**Recommendation:** **Docker Hub** for simplicity, or **ghcr.io** if you want free private images.

### 2. Kubernetes Provider

| Scenario | Recommendation |
|----------|---------------|
| Learning / local testing | Minikube |
| Budget production (<$30/mo) | DigitalOcean K8s ($10/node) or Linode LKE |
| AWS ecosystem | EKS |
| GCP ecosystem | GKE |
| Azure ecosystem | AKS |

**Recommendation:** Start with **Minikube**, move to **DigitalOcean K8s** for production.

### 3. Piston Strategy at Scale

| Approach | Pros | Cons |
|----------|------|------|
| Single Piston pod (scaled vertically) | Simple, consistent | Single point of failure |
| Multiple Piston pods (HPA) | Scalable, resilient | More complex, privileged containers |
| Dedicated Piston server (outside K8s) | Isolated, independently manageable | Not auto-scaling |

**Recommendation:** **Multiple Piston pods with HPA** (as designed in Phase 4). For extreme security, consider **Kata Containers** runtime instead of standard Docker sandboxing.

### 4. Database Strategy

| Approach | Pros | Cons |
|----------|------|------|
| MongoDB in K8s (StatefulSet) | All-in-one cluster, managed | Requires persistent storage, backup setup |
| Managed MongoDB (Atlas) | Zero ops, automated backups, backups included | Costs money, external dependency |
| Self-hosted MongoDB (separate server) | Full control, cheaper than Atlas | Manual ops, backup responsibility |

**Recommendation:** For production, use **MongoDB Atlas** (free tier available). It eliminates the most complex part of the K8s setup (stateful storage) and provides automated backups, monitoring, and scaling.

### 5. SSL/TLS Strategy

| Approach | Pros | Cons |
|----------|------|------|
| cert-manager + Let's Encrypt (K8s) | Free, auto-renewal, integrated with Ingress | Requires DNS setup, 90-day renewals |
| Cloud provider LB with SSL | Managed, often free | Vendor-specific |
| CloudFlare SSL proxy | Free, includes CDN, DDoS protection | Another service to manage |

**Recommendation:** **cert-manager + Let's Encrypt** (free, automated, industry standard).

---

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|------------|
| Piston `--privileged` security | High | Medium | Use Kata Containers or gVisor for stronger isolation |
| MongoDB data loss | Critical | Low | Automated backups + Atlas managed service |
| Traffic spike overwhelms HPA | High | Medium | Set appropriate HPA thresholds, test with load testing |
| Docker Hub rate limits | Medium | Medium | Use ghcr.io or authenticate Docker Hub |
| Secrets leaked in Git | Critical | Low | SOPS encryption, never commit plaintext |
| Cost overruns (cloud) | Medium | Medium | Set billing alerts, start with free tiers |
| Cluster downtime | High | Low | Use managed K8s (GKE/EKS) with SLA, multi-AZ deployment |

---

## Glossary

| Term | Definition |
|------|-----------|
| **Pod** | Smallest deployable unit in Kubernetes (one or more containers) |
| **Deployment** | K8s resource for managing stateless application pods |
| **StatefulSet** | K8s resource for managing stateful applications (databases) |
| **Service** | K8s internal load balancer — routes traffic to pods |
| **Ingress** | K8s external access — routes traffic from internet to services |
| **HPA** | Horizontal Pod Autoscaler — automatically scales pod count |
| **ConfigMap** | K8s resource for non-sensitive configuration |
| **Secret** | K8s resource for sensitive data (base64 encoded, not encrypted by default) |
| **Volume** | Persistent storage in K8s |
| **PV/PVC** | PersistentVolume / PersistentVolumeClaim — storage abstraction |
| **Namespace** | Logical isolation unit for K8s resources |
| **Rolling Update** | Zero-downtime deployment strategy |
| **SOPS** | Secrets OPerationS — encrypted secret management |
| **cert-manager** | K8s addon for automated SSL certificate management |

---

## Next Steps

1. **Review this plan** and decide which phases to prioritize
2. **Make the key decisions** (container registry, K8s provider, database strategy)
3. **Start Phase 1** — Docker containerization (lowest risk, highest immediate value)
4. **Set up a GitHub repository** if not already done (needed for CI/CD)
5. **Create a Docker Hub account** (or decide on ghcr.io)

Each phase is designed to be **independently valuable** — you can stop after any phase and still have a working, improved system.
