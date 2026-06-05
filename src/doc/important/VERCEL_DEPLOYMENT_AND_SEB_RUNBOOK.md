# Vercel Deployment and Safe Exam Browser Runbook

## 1. What goes where

This project should be split into three production pieces:

1. `Next.js app` -> deploy on **Vercel**
2. `MongoDB` -> use **MongoDB Atlas**
3. `Piston code execution` -> deploy as a **separate Docker service** on a VM/container platform

This separation is required because Vercel does **not** run Docker containers directly, while Piston depends on a container-style runtime.

## 2. Important truth about Docker on Vercel

- Keep the repo `Dockerfile` and `docker-compose.yml` for **local development** and for deploying Piston elsewhere.
- Do **not** plan to run `mongo` or `piston` inside the Vercel project.
- The only part that belongs on Vercel is the Next.js application.

## 3. Production architecture

```text
Students/Admins
      |
      v
  Vercel (Next.js app)
      |
      +--> MongoDB Atlas
      |
      +--> External Piston API (Docker-hosted elsewhere)
      |
      +--> Clerk / Resend
```

## 4. Required Vercel environment variables

Use `.env.example` as the source of truth.

Minimum required:

- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `MONGODB_URI`
- `PISTON_API_URL`
- `ADMIN_SETUP_SECRET`

Usually also required:

- `RESEND_API_KEY`
- `FROM_EMAIL`
- `NEXT_PUBLIC_SEB_LAUNCH_URL`
- `NEXT_PUBLIC_SEB_DOWNLOAD_URL`

Optional extra SEB hardening:

- `SEB_BROWSER_EXAM_KEYS`
- `SEB_CONFIG_KEYS`

## 5. How SEB works in this app now

The exam protection flow is:

1. Student signs in with a normal browser.
2. Student presses `Start Exam Attempt`.
3. The app creates an `ExamAttempt` record in MongoDB.
4. Student opens the institution-provided SEB config link.
5. Inside SEB, the student re-enters the assignment page.
6. The backend allows access only when:
   - the request user-agent contains `SEB/`
   - an `ExamAttempt` exists for that student and assignment
   - optional SEB header keys match `SEB_BROWSER_EXAM_KEYS` / `SEB_CONFIG_KEYS` when configured
7. Submissions and final assignment submit endpoints re-run the same SEB check.

## 6. What the launch button can and cannot do

The launch button **can**:

- Open a `sebs://...` or hosted `.seb` configuration link
- Hand control to Safe Exam Browser if SEB is already installed

The launch button **cannot**:

- Force-install SEB on a student machine
- Bypass the browser/OS confirmation prompt
- Create a secure kiosk environment without the student installing SEB first

Because of that, SEB installation must be a pre-exam requirement communicated by the institution.

## 7. Recommended SEB launch configuration

Set:

```env
NEXT_PUBLIC_SEB_LAUNCH_URL=sebs://your-domain.com/seb/algo-grade.seb?assignmentId={{assignmentId}}
NEXT_PUBLIC_SEB_PROFILE_PATH=/seb/algo-grade.seb
NEXT_PUBLIC_SEB_DOWNLOAD_URL=https://safeexambrowser.org/download_en.html
```

Notes:

- The UI replaces `{{assignmentId}}` with the live assignment ID.
- The UI also supports `{{origin}}` if you want to reuse the same variable across environments.
- Your hosted `.seb` file should point students back to the Vercel domain for sign-in / exam entry.
- If local launch works but production opens a blank SEB window, the `.seb` file itself is usually still configured with `http://localhost:3000` as its Start URL. Re-export a production `.seb` file with your Vercel domain and host that file in `public/seb`.

## 8. Recommended SEB security level

For real exams, do **not** rely on the user-agent check alone.

Recommended setup:

1. Create one official SEB config file for the institution/exam environment.
2. Enable **Browser & Config Keys** in SEB.
3. Copy the emitted Browser Exam Key / Config Key values.
4. Store those values in:
   - `SEB_BROWSER_EXAM_KEYS`
   - `SEB_CONFIG_KEYS`
5. Distribute only that approved `.seb` file to students.

This makes the backend reject requests coming from SEB instances that are not using the approved exam configuration.

## 9. Piston deployment guidance

Piston should stay Docker-based, but outside Vercel.

Good options:

- Railway
- Render
- Fly.io
- DigitalOcean Droplet
- AWS EC2

Production rule:

- `PISTON_API_URL` on Vercel must point to the externally deployed Piston API.
- `http://localhost:2000/api/v2` is for local development only.

## 10. MongoDB deployment guidance

Use MongoDB Atlas in production and set:

```env
MONGODB_URI=mongodb+srv://...
```

Do not try to run MongoDB inside Vercel.

## 11. Deploy order

1. Deploy MongoDB Atlas
2. Deploy Piston separately and confirm `/api/v2/execute` is reachable
3. Configure Clerk production keys and allowed domains
4. Add Vercel environment variables
5. Deploy the Next.js app to Vercel
6. Upload/host the institution `.seb` config file
7. Set `NEXT_PUBLIC_SEB_LAUNCH_URL`
8. Run a full student test: normal browser -> start attempt -> open SEB -> solve -> submit -> quit

## 12. Current repo changes that support this plan

- Vercel-safe Piston configuration now throws a clear error if `PISTON_API_URL` is missing in production.
- The SEB launch UI no longer points to a missing route.
- Optional SEB header verification is now supported via environment variables.
- `.env.example` now documents the production variables.
