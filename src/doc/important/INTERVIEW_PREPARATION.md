# Interview Preparation — Algo-Grade DAA Portal

## 📌 Resume Points (4 Solid Bullet Points)

Choose the format that fits your resume style:

### Option A: Impact-Focused
- **Built a production-grade auto-grading platform** for a Design & Analysis of Algorithms course, supporting 500+ students with real-time code execution in C++, Java, Python, and JavaScript using Docker-based sandboxing (Piston API).
- **Architected a full-stack Next.js 16 application** with TypeScript, MongoDB, and Clerk authentication, implementing role-based dashboards, assignment management, and instant test-case-based grading with detailed feedback.
- **Designed a CI/CD pipeline with Docker containerization and Kubernetes orchestration**, enabling zero-downtime deployments, horizontal pod autoscaling (HPA), and automated health checks for handling traffic spikes during assignment deadlines.
- **Integrated background job processing with Inngest** for automated workflows (welcome emails, submission processing) and implemented real-time analytics dashboards with Recharts for admin insights on student performance.

### Option B: Technical-Focused
- Developed **Algo-Grade DAA Portal**, a Next.js 16 + TypeScript auto-grading platform with MongoDB, Clerk auth, and Docker-based code execution (Piston), supporting multi-language submissions (C++, Java, Python, JS) with instant grading feedback.
- Implemented **role-based access control** with separate student/admin dashboards, assignment creation workflows, problem management with hidden/visible test cases, and submission tracking with execution time and memory metrics.
- Containerized the application using **multi-stage Docker builds** (~150MB Alpine-based images) and designed **Kubernetes deployment manifests** with HPA, rolling updates, ConfigMaps/Secrets, and PersistentVolumeClaims for MongoDB stateful workloads.
- Built **RESTful API routes** with Zod validation, integrated Inngest for async background jobs (email workflows), and created admin analytics dashboards with Recharts for tracking submissions, student progress, and assignment performance.

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.2.1 | React framework with App Router |
| TypeScript | 5.x | Type-safe development |
| Tailwind CSS | 4.x | Utility-first styling |
| shadcn/ui | Latest | UI component library |
| Radix UI | 1.4.3 | Accessible UI primitives |
| CodeMirror 6 | Latest | Code editor with syntax highlighting |
| Recharts | 2.15.4 | Data visualization and charts |
| Motion | 12.38.0 | Animations |
| next-themes | 0.4.6 | Dark/light mode support |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| MongoDB | 7.1.0 | NoSQL database |
| Mongoose | 9.3.1 | MongoDB ODM |
| Clerk | 7.0.6 | Authentication & user management |
| Inngest | 4.0.4 | Background job processing |
| Zod | 4.3.6 | Schema validation |
| Resend | 6.10.0 | Email service (transactional emails) |
| Svix | 1.89.0 | Webhook handling (Clerk webhooks) |

### Infrastructure & DevOps
| Technology | Purpose |
|------------|---------|
| Docker | Multi-stage container builds (~150MB Alpine images) |
| Docker Compose | Multi-container orchestration (App + MongoDB + Piston) |
| Kubernetes | Container orchestration with HPA, rolling updates, load balancing |
| GitHub Actions | CI/CD pipeline (test, build, push, deploy) |
| Docker Hub | Container image registry |
| Piston | Self-hosted code execution engine (Docker-based) |

### Development Tools
| Technology | Purpose |
|------------|---------|
| ESLint | Code linting |
| date-fns | Date formatting and manipulation |
| Axios | HTTP client for API calls |
| Lucide React | Icon library |

---

## ❓ Interview Questions & Answers

### Category 1: Project Overview & Architecture

#### Q1: What is this project and why did you build it?
**Answer:**
Algo-Grade DAA Portal is an auto-grading platform for the Design & Analysis of Algorithms course at IIITDMJ. Before this system, professors had to manually grade student code submissions, which took days and was error-prone. I built this to automate the entire grading process — students write and submit code in C++, Java, Python, or JavaScript, and the system runs their code against hidden and visible test cases in a Docker sandbox, giving instant feedback with pass/fail results, execution time, and memory usage. It also has an admin dashboard for professors to create problems, manage assignments, and view analytics.

#### Q2: Can you explain the architecture of your application?
**Answer:**
The application follows a three-layer architecture:

1. **Client Layer** — Three main pages: a landing page, a student dashboard for writing/submitting code, and an admin dashboard for managing problems and assignments. All protected by Clerk authentication.

2. **Application Layer** — Built with Next.js App Router. It has API routes for onboarding, student submissions, admin operations, and code compilation. A middleware layer (`proxy.ts`) handles role-based access control and protects routes. All requests are validated using Zod schemas.

3. **Data Layer** — MongoDB stores users, problems, assignments, submissions, and announcements. Clerk manages authentication data. Piston (a Docker-based code execution engine) runs student code in isolated containers and returns execution results.

For production, I containerized the Next.js app using multi-stage Docker builds, orchestrated it with Docker Compose alongside MongoDB and Piston, and designed Kubernetes manifests for autoscaling and high availability.

#### Q3: How does a student submission flow work from start to finish?
**Answer:**
1. The student writes code in the CodeMirror editor and clicks "Submit."
2. The frontend sends a POST request to `/api/student/submissions` with the code and language.
3. The backend fetches the problem's test cases from MongoDB.
4. It then calls the `/api/compile` endpoint, which sends the code and test cases to the Piston API running in a Docker container.
5. Piston executes the code in a sandboxed environment and returns results — pass/fail for each test case, execution time, memory used, and actual vs expected output.
6. The backend saves the submission (with all results) to MongoDB.
7. The frontend displays a detailed breakdown — which tests passed, which failed, and why — with color-coded UI and collapsible sections.

---

### Category 2: Technical Deep Dive

#### Q4: Why did you choose Next.js 16 with App Router over a traditional React SPA?
**Answer:**
Next.js App Router gives us server-side rendering and API routes in a single framework. For this project, it meant:
- **API routes** — I could build the entire backend (submission handling, code compilation, admin CRUD) as serverless functions within the same codebase, no separate backend needed.
- **Server components** — Dashboard pages can fetch data on the server, reducing client-side JavaScript and improving initial load time.
- **File-based routing** — Each page is just a file in the `app/` directory, making the project structure intuitive.
- **Middleware** — The `proxy.ts` file lets me intercept every request, check the user's role from Clerk, and redirect unauthorized users before the page even loads.

#### Q5: How does authentication and role-based access work?
**Answer:**
I use Clerk for authentication. When a user signs in, Clerk creates a session and attaches a JWT to every request. In the middleware (`proxy.ts`), I:

1. Verify the JWT using Clerk's SDK.
2. Check if the user exists in our MongoDB and what role they have (student or admin).
3. If a student tries to access `/admin/*`, they get redirected to `/home`.
4. If an unauthenticated user tries to access any dashboard, they get redirected to the sign-in page.

For admin setup, I created a special `/setup-admin` page protected by a secret key (`ADMIN_SETUP_SECRET`). When an admin is created through this flow, their status is marked as "pending" until they sign in with Clerk, at which point the middleware links their Clerk ID to the admin record in MongoDB.

#### Q6: How did you handle code execution safely? What prevents a student from running malicious code?
**Answer:**
Code execution is handled by **Piston**, which is a self-hosted code execution engine that runs inside Docker containers. When a student submits code:

1. The code is sent to Piston's API (`/api/v2/execute`).
2. Piston spins up an **isolated Docker container** with resource limits (CPU, memory, execution time).
3. The code runs inside this sandbox — it has no access to the host filesystem, network, or environment variables.
4. After execution (or timeout), the container is destroyed and results are returned.

This means even if a student submits something like `rm -rf /` or an infinite loop, it only affects the isolated container, which gets destroyed immediately after. The Docker `--privileged` flag is used at the Piston level to manage namespaces, but individual executions are still sandboxed.

#### Q7: What database models did you design and why?
**Answer:**
I designed five core MongoDB models:

1. **User** — Stores clerkId, name, email, role (admin/student), and rollNo for students. This is the base identity model.

2. **Problem** — Contains the problem statement, description, constraints, examples, difficulty level, marks, starter code templates for each language, and most importantly — test cases (both hidden and visible). Each test case has input, expected output, and an `isHidden` flag.

3. **Assignment** — A collection of problems with a title, description, publish date, due date, and total marks. It references problem IDs, so the same problem can be reused across multiple assignments.

4. **Submission** — Links a student (userId) to an assignment and problem. Stores the submitted code, language, status (Attempted/Submitted/Evaluated), score, and detailed test results (pass/fail per test, expected vs actual output, execution time, memory used).

5. **Announcement** — For admins to broadcast messages to students (e.g., deadline extensions, new assignments).

The key design decision was **embedding test cases inside Problems** rather than a separate collection, because test cases are always accessed together with the problem and never independently. This reduces the number of database queries.

#### Q8: How does the auto-grading system calculate scores?
**Answer:**
Each problem has a total marks value (e.g., 10 marks). When a submission is evaluated:
1. The code is run against all test cases (both hidden and visible).
2. Each test case carries equal weight. If a problem has 5 test cases and 10 marks, each test is worth 2 marks.
3. The score is calculated as: `(passedTests / totalTests) * totalMarks`.
4. The submission is saved with the score, and the UI shows a breakdown — which tests passed, which failed, and the difference between expected and actual output.

---

### Category 3: Production & DevOps

#### Q9: How did you containerize the application?
**Answer:**
I used a **4-stage multi-stage Dockerfile** to keep the production image as small as possible (~150MB):

1. **Base stage** — Starts from `node:20-alpine` and installs system dependencies (`libc6-compat` for Next.js compatibility).
2. **Deps stage** — Copies `package*.json` and runs `npm ci --production` to install only production dependencies. This layer is cached unless dependencies change.
3. **Builder stage** — Copies the full source code and runs `npm run build`, which generates the `.next/standalone` output — a self-contained deployment.
4. **Runner stage** — Copies only the production artifacts (standalone output and static files) from the previous stages. The container runs as a **non-root user** (`nextjs`) for security, exposes port 3000, and has a built-in HEALTHCHECK that hits the `/api/health` endpoint.

The `next.config.ts` is configured with `output: "standalone"` so the build output includes everything needed to run the app without Node.js development dependencies.

#### Q10: How does Docker Compose orchestrate your services?
**Answer:**
The `docker-compose.yml` file manages three services:

1. **app** — The Next.js application. In development, it mounts the source code for hot-reloading. In production (`docker-compose.prod.yml`), it uses the final Docker image stage and has resource limits (1 CPU, 512MB RAM).

2. **mongo** — MongoDB database with a named volume (`mongo-data`) for persistent storage. In production, the port is not exposed externally — only the app container can reach it via the internal Docker network.

3. **piston** — The code execution engine. Runs in privileged mode (required for Docker-in-Docker) with a named volume for language runtimes.

All three services connect via a **custom bridge network**, so they resolve each other by service name (e.g., `http://piston:2000` and `mongodb://mongo:27017`). No hardcoded `localhost` URLs.

I also configured **log rotation** (max 10MB per file, 3 files) to prevent disk exhaustion, and **resource limits** so no single container can consume all host resources.

#### Q11: How does your CI/CD pipeline work?
**Answer:**
The CI/CD pipeline is built with GitHub Actions and has three jobs:

1. **Test Job** — Runs on every push and PR. It checks out the code, sets up Node.js 20, caches `node_modules`, installs dependencies, runs ESLint, and builds the project. This ensures no broken code reaches the main branch.

2. **Build & Push Job** — Runs only on merges to `main`. It logs into Docker Hub, builds the multi-stage Docker image with GitHub Actions cache (for faster subsequent builds), tags it with the Git SHA and `latest`, and pushes it to Docker Hub.

3. **Deploy Job** — SSHs into the production VPS, pulls the latest Docker image, restarts the app container with zero downtime (`docker compose up -d --no-deps --wait app`), verifies the health endpoint (retries up to 30 times), and cleans up old images.

The branch strategy is: `develop` for feature integration (test only), `main` for production-ready code (test → build → deploy), and `feature/*` for individual features.

#### Q12: How would Kubernetes improve your deployment?
**Answer:**
Kubernetes adds capabilities that Docker Compose cannot provide:

1. **Horizontal Pod Autoscaling (HPA)** — During assignment deadlines, traffic spikes. HPA automatically scales the number of Next.js pods from 2 to 5+ based on CPU/memory usage, then scales back down when traffic drops.

2. **Rolling Updates** — When deploying a new version, Kubernetes replaces pods one at a time. If the new version fails health checks, it automatically rolls back. Zero downtime.

3. **Self-Healing** — If a pod crashes, Kubernetes restarts it. If a node fails, Kubernetes reschedules pods to healthy nodes.

4. **Load Balancing** — An Ingress controller distributes traffic across all healthy pods. Combined with HPA, this handles hundreds of concurrent students submitting code simultaneously.

5. **StatefulSets for MongoDB** — MongoDB needs persistent storage. Kubernetes StatefulSets ensure the database pod always gets the same PersistentVolume, even if it's rescheduled to a different node.

For a course with 500+ students and overlapping assignment deadlines, Kubernetes ensures the platform stays responsive without manual intervention.

#### Q13: How do you handle environment variables and secrets in production?
**Answer:**
In development, environment variables are in `.env.local`. In production:

- **Docker Compose** — Uses `env_file` to load from a `.env.production` file that's never committed to Git. Sensitive values (Clerk keys, MongoDB credentials) are stored on the server and loaded at runtime.

- **Kubernetes** — Non-sensitive config (API URLs, environment names) goes in a **ConfigMap**. Sensitive data (Clerk secret keys, MongoDB passwords) goes in a **Secret**, which is base64-encoded and can be encrypted at rest using cloud KMS or SOPS + age. Pods mount these as environment variables.

- **CI/CD** — GitHub Secrets store Docker Hub credentials, VPS SSH keys, and deployment targets. These are injected into the workflow at runtime and never appear in logs.

All configuration is externalized — no hardcoded values in source code. Even the Piston API URL is an environment variable (`PISTON_API_URL`), defaulting to `localhost` for development.

---

### Category 4: Challenges & Problem Solving

#### Q14: What was the most challenging part of this project?
**Answer:**
The most challenging part was building a reliable auto-grading system that handles edge cases gracefully. Specifically:

1. **Infinite loops and resource exhaustion** — A student might accidentally submit code with an infinite loop. Piston handles this with execution time limits, but I had to ensure the API timeout settings aligned with Piston's limits and that the UI showed a clear "Time Limit Exceeded" error instead of a generic failure.

2. **Output comparison** — Comparing expected vs actual output is tricky because of whitespace, trailing newlines, and formatting differences. I had to normalize outputs before comparison (trim whitespace, handle line endings) so students aren't penalized for minor formatting differences.

3. **Race conditions with concurrent submissions** — When hundreds of students submit simultaneously near a deadline, the MongoDB connection pool can get exhausted. I implemented proper connection pooling in `db.ts` with retry logic and connection limits.

4. **Admin setup bootstrap problem** — The first admin needs to exist before anyone can manage the platform, but the admin creation flow itself requires an admin to approve it. I solved this with a secret-key-protected `/setup-admin` endpoint that creates a "pending" admin record, which gets activated when the user signs in with Clerk.

#### Q15: How do you handle errors and edge cases in your API routes?
**Answer:**
Every API route follows a consistent pattern:

1. **Method validation** — Check if the HTTP method is allowed (e.g., POST only for submissions). Return 405 if not.

2. **Authentication check** — Verify the user is logged in via Clerk. Return 401 if not.

3. **Role validation** — Check if the user has the right role (student for student routes, admin for admin routes). Return 403 if not.

4. **Input validation** — Use Zod to validate the request body. Return 400 with specific error messages if validation fails.

5. **Database operations** — Wrap in try-catch. If MongoDB throws (e.g., duplicate key, connection error), return 500 with a generic error message (never expose internal details).

6. **External service errors** — If Piston fails (e.g., container crash, timeout), catch the error, log it, and return a meaningful message to the frontend ("Code execution failed, please try again").

This layered approach ensures that errors are caught at the right level and users get actionable feedback, not stack traces.

#### Q16: How would you scale this application to 5,000+ students?
**Answer:**
At that scale, several changes would be needed:

1. **Kubernetes cluster with multiple nodes** — A single VPS won't handle 5,000 concurrent users. A managed K8s cluster (GKE, EKS, or DigitalOcean) with 3-5 nodes would distribute the load.

2. **Piston scaling** — Code execution is the most resource-intensive operation. I'd deploy Piston as a separate Kubernetes deployment with its own HPA, potentially on dedicated high-CPU nodes. I'd also add a request queue (using Inngest or Redis) so submissions are processed asynchronously rather than blocking the API response.

3. **MongoDB sharding or Atlas** — At scale, a single MongoDB instance becomes a bottleneck. MongoDB Atlas with automatic sharding by `userId` or `assignmentId` would distribute reads/writes across multiple nodes.

4. **CDN for static assets** — Next.js static assets (JS bundles, images, fonts) should be served via a CDN (CloudFlare or Vercel Edge Network) to reduce server load.

5. **Caching** — Frequently accessed data (problem descriptions, assignment details) could be cached in Redis to reduce database queries.

6. **Rate limiting** — Prevent abuse by implementing rate limiting on API routes (e.g., max 10 submissions per minute per student).

---

### Category 5: Features & Future Plans

#### Q17: What features are you most proud of?
**Answer:**
1. **The auto-grading engine** — It takes student code, runs it against multiple test cases in a Docker sandbox, calculates scores, and returns detailed feedback — all in under 5 seconds. The entire flow from submission to results is automated and reliable.

2. **Role-based dashboards** — Students and admins see completely different interfaces, but both are built from the same codebase. The middleware handles all access control, so there's no accidental data leakage.

3. **The code editor experience** — Syntax highlighting for 4 languages, dark mode support, starter code templates, and real-time compilation. It feels like a mini IDE in the browser.

4. **Admin analytics** — Recharts-powered dashboards showing submission rates, average scores, problem difficulty distribution, and student progress. Professors can instantly see which problems students are struggling with.

#### Q18: What features would you add next?
**Answer:**
1. **Plagiarism detection** — Compare submissions across students using code similarity algorithms (e.g., MOSS or token-based comparison) to detect copied solutions.

2. **Leaderboards** — Gamify the experience with per-assignment and overall course leaderboards based on scores and submission speed.

3. **Real-time collaboration** — Allow students to share code snippets or work in pairs using WebSockets.

4. **Test case builder UI** — Currently, admins add test cases via JSON/forms. A visual test case builder with input/output preview would improve the admin experience.

5. **Mobile app** — A React Native app for students to check announcements, view scores, and read problem descriptions on the go (code editing would still be web-based).

---

### Category 6: Behavioral

#### Q19: What did you learn from building this project?
**Answer:**
Technically, I learned how to design a full-stack application from scratch — not just the frontend or backend in isolation, but how they connect, how authentication flows work, how to handle errors gracefully, and how to deploy to production.

Specifically:
- **Container orchestration** — I went from running `docker run` manually to designing Kubernetes manifests with HPA, rolling updates, and persistent storage.
- **Security** — Running untrusted student code taught me about sandboxing, resource limits, and why you never execute code directly on your server.
- **CI/CD** — Building the GitHub Actions pipeline taught me the importance of automated testing, image versioning, and zero-downtime deployments.
- **Database design** — Choosing between embedding and referencing in MongoDB, handling connection pooling, and writing efficient queries.

Beyond technical skills, I learned to **prioritize**. I could have spent weeks building a perfect code editor, but the core value was auto-grading. I focused on that first, then iterated on UI/UX.

#### Q20: If you could start over, what would you do differently?
**Answer:**
1. **Write tests from day one** — I added validation and error handling, but I didn't write unit or integration tests early on. Having tests would have caught several bugs during the admin setup flow and submission handling.

2. **Use an ORM/ODM earlier** — I used Mongoose, which is good, but I didn't leverage all its features (middleware, virtuals, plugins) from the start. I ended up rewriting some logic that Mongoose could have handled.

3. **Plan the database schema more carefully** — The Submission model grew organically as I added features (test results, execution time, memory). A more deliberate schema design upfront would have reduced refactoring.

4. **Set up CI/CD earlier** — I built the CI/CD pipeline near the end. Setting it up from the beginning would have ensured every commit was tested and deployable, not just the final merge to main.

---

## 🎯 Quick Reference: Key Numbers

| Metric | Value |
|--------|-------|
| Total API routes | 20+ |
| Database models | 5 (User, Problem, Assignment, Submission, Announcement) |
| Supported languages | 4 (C++, Java, Python, JavaScript) |
| Docker image size | ~150MB (Alpine-based) |
| CI/CD pipeline jobs | 3 (Test, Build, Deploy) |
| Kubernetes HPA target | 2-5+ pods based on CPU/memory |
| MongoDB collections | 5 |
| UI components (shadcn) | 55+ |

---

## 💡 Tips for the Interview

1. **Start with the problem** — Always explain *why* you built something before *how*. Interviewers care about impact, not just technology.

2. **Use diagrams** — If asked about architecture, draw the 3-layer diagram (Client → App → Data). It shows you understand system design.

3. **Be honest about trade-offs** — When asked "why Next.js and not React?", explain the trade-offs (SSR vs SPA, API routes vs separate backend).

4. **Show production readiness** — Mention Docker, CI/CD, Kubernetes, health checks, and resource limits. This separates hobby projects from production-grade systems.

5. **Prepare for follow-ups** — After explaining Piston, expect "How does Docker sandboxing work?" After explaining MongoDB, expect "Why NoSQL over PostgreSQL?"

6. **Have a demo ready** — If possible, show the live application or a recorded demo. Seeing the auto-grading in action is more impactful than describing it.
