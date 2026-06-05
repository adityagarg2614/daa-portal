# Piston Local Dev and VM Runbook

## 1. The key architecture rule

Your current setup should be:

1. `Next.js app`
   - Local development: run on your laptop
   - Production: deploy on Vercel
2. `MongoDB`
   - Local development: local Docker or local DB
   - Production: MongoDB Atlas
3. `Piston`
   - Local development: Docker container on your laptop
   - Production: Docker container on a rented VM

Important limitation:

- A Vercel-deployed backend cannot call `http://localhost:2000` on your laptop.
- So if `PISTON_API_URL=http://localhost:2000/api/v2`, that works only when your Next.js server is also running locally on your machine.

That means:

- `local app` -> `local piston` works
- `vercel app` -> `local piston` does not work

## 2. What already exists in this repo

This repo already supports the split correctly:

- `src/lib/piston.ts`
  - Reads `PISTON_API_URL`
  - Falls back to `http://localhost:2000/api/v2` only for non-Vercel local use
- `docker-compose.yml`
  - Starts `app`, `mongo`, and `piston`
- `README.md`
  - Documents Docker-based local startup

## 3. Best local development workflow

Use one of these two workflows.

### Option A: Run app locally, run only Piston in Docker

This is the easiest workflow for day-to-day development.

1. Start Piston:

```bash
docker run -d \
  --name daa-portal-piston \
  --platform linux/amd64 \
  --privileged \
  -p 2000:2000 \
  ghcr.io/engineer-man/piston:latest
```

2. In `.env.local`, set:

```env
PISTON_API_URL=http://localhost:2000/api/v2
```

3. Start your Next.js app locally:

```bash
npm run dev
```

4. Test code execution from the local app UI.

This works because both the Next.js server and Piston are reachable from your laptop.

### Option B: Run the whole stack with Docker Compose

If you want the app and Piston inside the same Docker network:

```bash
make up
```

or

```bash
docker compose up -d --build
```

In this mode, `docker-compose.yml` already sets:

```env
PISTON_API_URL=http://piston:2000/api/v2
```

This works because the `app` container can reach the `piston` container by service name.

## 4. How to confirm local Piston is working

Check the container:

```bash
docker ps
docker logs daa-portal-piston
```

Test the API directly:

```bash
curl -X POST http://localhost:2000/api/v2/execute \
  -H "Content-Type: application/json" \
  -d '{
    "language": "python",
    "version": "3.10.0",
    "files": [{ "content": "print(\"hello\")" }]
  }'
```

Expected result:

- JSON response
- `stdout` should contain `hello`

## 5. Important note for Vercel testing

If your frontend/backend is already deployed on Vercel, that deployed app cannot use your laptop Piston container directly.

If you want to test the real Vercel deployment before renting a VM, you would need to expose Piston publicly with a tunnel or a temporary public server.

For development, the recommended approach is:

1. Build and test locally with local Piston
2. When ready, move Piston to a VM
3. Update `PISTON_API_URL` in Vercel to the VM URL
4. Re-test using the live Vercel app

## 6. VM plan for later production cutover

When you are ready, rent a VM and do this:

1. Choose Ubuntu 22.04 or 24.04
2. Install Docker and Docker Compose
3. Run Piston in Docker on the VM
4. Put Nginx or Caddy in front of it
5. Add HTTPS with a domain or subdomain such as `piston.yourdomain.com`
6. Restrict network access so only your app should use it
7. Set `PISTON_API_URL=https://piston.yourdomain.com/api/v2` in Vercel

Example VM container command:

```bash
docker run -d \
  --name piston \
  --restart always \
  --platform linux/amd64 \
  --privileged \
  -p 2000:2000 \
  ghcr.io/engineer-man/piston:latest
```

## 7. Minimum production hardening checklist

Before students use the live system, do not expose a raw public Piston instance without controls.

At minimum:

1. Protect the app endpoint that triggers code execution
   - `src/app/api/compile/route.ts` should not be open to anonymous internet traffic
2. Put HTTPS in front of the VM
3. Add firewall rules
4. Add rate limiting
5. Allow requests only from your app if possible
6. Monitor CPU, RAM, and Docker restarts
7. Keep a persistent Docker volume if you want runtime/package caching

## 8. Environment values you will use

### Local app + local Piston

```env
PISTON_API_URL=http://localhost:2000/api/v2
```

### Docker Compose app + Docker Compose Piston

```env
PISTON_API_URL=http://piston:2000/api/v2
```

### Vercel app + VM-hosted Piston

```env
PISTON_API_URL=https://piston.yourdomain.com/api/v2
```

## 9. Recommended rollout order

1. Keep using local Piston on your laptop while building features
2. Test all supported languages locally
3. Verify time limits and memory limits from your problem model
4. Lock down who can hit compile and submit APIs
5. Rent a VM
6. Move Piston to the VM
7. Set the VM URL in Vercel
8. Run one full end-to-end production test

## 10. Practical conclusion

For now, your safest path is:

- Develop locally with `PISTON_API_URL=http://localhost:2000/api/v2`
- Do not try to make the Vercel app depend on your laptop container
- Move Piston to a VM only when you are ready for live production testing
