# Docker Workflow in Algo-Grade DAA Portal

## Overview

This document explains **why Docker is used** in the Algo-Grade DAA Portal and how the Docker-based code execution pipeline works — specifically focusing on the **Piston container** that compiles and runs student code during active assignments.

---

## Why Do We Need Docker Here?

### 1. **Sandboxed Code Execution**

When students submit code solutions (C++, Java, Python, JavaScript), that code **must be executed safely**. Running untrusted student code directly on the host machine is a major security risk — it could:

- Access or modify sensitive files
- Consume unlimited resources (infinite loops, memory exhaustion)
- Make network calls to external services
- Execute arbitrary system commands

Docker provides an **isolated, sandboxed environment** where student code runs with strict boundaries:

- **Filesystem isolation** — Code cannot access host files
- **Network isolation** — No outbound network calls by default
- **Resource limits** — CPU time and memory are capped
- **Privilege restrictions** — Runs with minimal system permissions

### 2. **Multi-Language Support**

The portal supports **C++ (GCC 10.2.0), Java (OpenJDK 15.0.2), Python (3.10.0), and JavaScript (Node.js 18.15.0)**. Each language requires:

- Different compilers/interpreters
- Different runtime libraries
- Different build tools and configurations

Piston's Docker image comes **pre-packaged with all these language runtimes**, eliminating the need to install and maintain them on the host system.

### 3. **Consistent Environment**

Docker guarantees that the execution environment is **identical across development, testing, and production**:

- Same compiler versions
- Same standard libraries
- Same behavior regardless of host OS (macOS, Linux, Windows)
- Reproducible results for all students

### 4. **Resource Enforcement**

The Docker container enforces **hard limits** on student code:

| Resource | Limit | Why |
|----------|-------|-----|
| Execution Time | 3 seconds | Prevents infinite loops, ensures fair grading |
| Memory | 128 MB | Prevents memory exhaustion |
| Privileges | Minimal (sandboxed) | Prevents malicious code execution |

These limits are enforced at the **container level** by Docker and the Linux kernel (cgroups, namespaces), not at the application level, making them **reliable and tamper-proof**.

### 5. **Scalability & Portability**

- Piston runs as an **independent service** that can be scaled, restarted, or moved without affecting the main application
- The Next.js app communicates with Piston via **HTTP API**, decoupling code execution from the web server
- In production, the Piston container can be deployed on a separate server or orchestrated with Docker Compose/Kubernetes

---

## Docker Architecture

### Components in Use

| Component | Description | Location |
|-----------|-------------|----------|
| **Piston Container** | Docker container running the Piston code execution engine | `ghcr.io/engineer-man/piston:latest` |
| **Piston Packages Volume** | Docker volume storing language runtimes and dependencies | `piston-packages` (or similar) |
| **Next.js Application** | The main DAA Portal web app | `localhost:3000` |
| **Piston API** | REST API exposed by the Piston container | `localhost:2000/api/v2` |

### Container Launch Command

```bash
docker run -d --name piston --privileged -p 2000:2000 \
  ghcr.io/engineer-man/piston:latest
```

| Flag | Purpose |
|------|---------|
| `-d` | Run in detached mode (background) |
| `--name piston` | Name the container "piston" for easy reference |
| `--privileged` | Grant extended privileges needed for sandboxing nested containers |
| `-p 2000:2000` | Map container port 2000 to host port 2000 |

### Why `--privileged` Mode?

Piston itself creates **nested sandboxed environments** for each code execution. When a student's code is submitted, Piston spawns an isolated micro-container or chroot jail to run it. The `--privileged` flag allows the Piston container to:

- Create nested containers/namespaces
- Mount filesystems for isolation
- Use Linux kernel features (cgroups, seccomp, namespaces) for sandboxing

Without `--privileged`, Piston cannot properly isolate individual code executions.

### Docker Volume: Piston Packages

The **Docker volume** (visible in Docker Desktop as `piston-packages` or similar) stores:

- Language runtime installations (GCC, OpenJDK, Python, Node.js)
- Package dependencies for each language
- Cached compilation artifacts

This volume is **persistent** — if you stop and restart the Piston container, the installed runtimes are preserved. You don't need to reinstall them on every restart.

To inspect the volume:

```bash
docker volume ls | grep piston
docker volume inspect <volume-name>
```

---

## Complete Code Execution Workflow

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────┐
│  Student writes code in browser (Monaco/CodeMirror editor)   │
└─────────────────────────────────────────────────────────────┘
                              ↓ Click "Save"
┌─────────────────────────────────────────────────────────────┐
│  Frontend POSTs to /api/student/submissions                  │
│  { assignmentId, problemId, userId, code, language }         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  Next.js API Route (src/app/api/student/submissions/route.ts)│
│  1. Fetches problem from MongoDB to get test cases           │
│  2. Calls runTestCases() from src/lib/piston.ts              │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  Piston Library (src/lib/piston.ts)                          │
│  1. Maps language to Piston config (e.g., cpp → c++ 10.2.0) │
│  2. First does a compile check with first test case          │
│  3. Runs each test case sequentially via executeCode()       │
│  4. Makes HTTP POST to http://localhost:2000/api/v2/execute  │
└─────────────────────────────────────────────────────────────┘
                              ↓ HTTP Request
┌─────────────────────────────────────────────────────────────┐
│  Piston Docker Container (http://localhost:2000)             │
│  1. Receives code, language, stdin, timeout, memory limits   │
│  2. Creates a sandboxed environment (chroot/namespaces)      │
│  3. Compiles code (e.g., g++ for C++)                        │
│  4. Runs with provided stdin                                 │
│  5. Captures stdout, stderr, exit code, time, memory         │
│  6. Enforces 3s timeout and 128MB memory limit               │
└─────────────────────────────────────────────────────────────┘
                              ↓ JSON Response
┌─────────────────────────────────────────────────────────────┐
│  Results flow back up the chain:                             │
│  Piston → piston.ts → submissions route → Frontend           │
│                                                              │
│  If ALL tests pass → Submission saved to MongoDB             │
│  If ANY test fails → Results returned, not saved             │
│  If compilation fails → Error returned, not saved            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  UI displays results:                                        │
│  - ✅/❌ per test case                                       │
│  - Expected vs Actual output                                 │
│  - Execution time & memory used                              │
│  - Collapsible details per test case                         │
└─────────────────────────────────────────────────────────────┘
```

### Detailed Step-by-Step

#### Step 1: Student Submits Code

```typescript
// Frontend: src/app/(dashboard)/assignment/[id]/page.tsx
const response = await axios.post("/api/student/submissions", {
    assignmentId: assignment._id,
    problemId: problemId,
    userId: dbUserId,
    code: current.code,       // Student's C++ code
    language: "cpp",
})
```

#### Step 2: Submissions API Route Receives Request

```typescript
// src/app/api/student/submissions/route.ts

// Fetch problem to get test cases
const problem = await Problem.findById(problemId)

const testCases = problem.testCases.map(tc => ({
    input: tc.input,
    output: tc.output,
}))

// Call Piston directly
const compileResult = await runTestCases(code, language, testCases)
```

#### Step 3: Piston Library Prepares Execution

```typescript
// src/lib/piston.ts

// Map language
const langConfig = LANGUAGE_MAP["cpp"]
// → { language: "c++", version: "10.2.0" }

// First test case: compile check
const firstResult = await executeCode(code, "cpp", testCases[0].input)
```

#### Step 4: HTTP Request to Docker Container

```typescript
// src/lib/piston.ts — executeWithPiston()

const requestBody = {
    language: "c++",
    version: "10.2.0",
    files: [{ content: code }],
    stdin: testCases[0].input,
    run_timeout: 3000,            // 3 second max
    run_memory_limit: 128000000,  // 128 MB
}

const response = await fetch("http://localhost:2000/api/v2/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
})
```

#### Step 5: Piston Container Executes in Sandbox

Inside the Docker container:

```
1. Create temporary directory (sandbox)
2. Write student code to temp file: solution.cpp
3. Compile: g++ -o solution solution.cpp
   - If compilation fails → return compile error
4. Run: ./solution < stdin
   - Capture stdout, stderr
   - Measure execution time
   - Measure memory usage
   - Kill if exceeds 3 seconds or 128MB
5. Return results as JSON
```

Response from Piston:

```json
{
    "compile": {
        "stdout": "",
        "stderr": "",
        "code": 0
    },
    "run": {
        "stdout": "Hello World\n",
        "stderr": "",
        "code": 0,
        "time": "0.003",
        "memory": "8574"
    }
}
```

#### Step 6: Results Processed and Returned

```typescript
// piston.ts parses response
return {
    success: true,
    result: {
        success: !runStderr && runExitCode === 0,
        stdout: "Hello World",
        stderr: "",
        executionTime: 3,        // 0.003 * 1000
        memoryUsed: 8.37,        // 8574 / 1024
    }
}
```

#### Step 7: All Test Cases Run Sequentially

```typescript
// For each test case in the problem:
for (let i = 0; i < testCases.length; i++) {
    const execution = await executeCode(code, language, testCases[i].input)
    
    // Normalize and compare output
    const passed = normalize(execution.stdout) === normalize(testCases[i].output)
    
    testResults.push({
        testCaseIndex: i,
        passed,
        executionTime: execution.executionTime,
        memoryUsed: execution.memoryUsed,
    })
}
```

#### Step 8: Submission Saved or Rejected

```typescript
// src/app/api/student/submissions/route.ts

if (!allTestsPassed) {
    // Return results WITHOUT saving — student must fix code
    return NextResponse.json({
        success: false,
        message: `Not all test cases passed. ${passedTests}/${totalTests}`,
        testResults,
    }, { status: 400 })
}

// All tests passed — save to MongoDB
await Submission.deleteOne({ userId, problemId })  // Allow re-submission

const submission = await Submission.create({
    assignmentId,
    problemId,
    userId,
    code,
    language,
    status: "Evaluated",
    score: problem.marks,        // Full marks
    testResults,
    executionTime,
    memoryUsed,
})
```

---

## Docker Volume: Piston Packages

### What It Stores

The Docker volume associated with the Piston container stores:

| Content | Description |
|---------|-------------|
| Language Runtimes | GCC, OpenJDK, Python, Node.js binaries |
| Package Dependencies | pip packages, npm modules, etc. |
| Runtime Configurations | Language-specific execution configs |
| Cached Artifacts | Pre-compiled standard libraries |

### Why a Volume?

- **Persistence**: Container restarts don't lose installed runtimes
- **Performance**: Shared volume avoids re-downloading packages
- **Isolation**: Packages are contained within Docker's storage system

### Managing the Volume

```bash
# List volumes
docker volume ls

# Inspect piston volume
docker volume inspect <piston-volume-name>

# Remove volume (if you need to reinstall runtimes)
docker volume rm <piston-volume-name>
```

**Warning**: Removing the volume will require reinstalling language runtimes in the Piston container.

---

## Key Files Involved

| File | Role |
|------|------|
| `src/lib/piston.ts` | Core Piston API client — handles all Docker communication |
| `src/app/api/student/submissions/route.ts` | Main submission endpoint — orchestrates test execution |
| `src/app/api/compile/route.ts` | General-purpose compilation endpoint (used elsewhere) |
| `src/models/Problem.ts` | Stores test cases that drive Docker execution |
| `src/models/Submission.ts` | Stores results (testResults, executionTime, memoryUsed) |

---

## Security Considerations

### What Docker Protects Against

| Threat | How Docker Mitigates |
|--------|---------------------|
| Filesystem access | Container has isolated filesystem |
| Network abuse | No outbound network by default |
| Resource exhaustion | cgroups enforce CPU/memory limits |
| Privilege escalation | Container runs with minimal privileges |
| Host compromise | Nested sandboxing prevents escape |

### Limitations

- **Not bulletproof**: Determined attackers might find ways to escape sandboxes
- **Privileged mode**: The `--privileged` flag increases attack surface (required for nested sandboxing)
- **Self-hosted responsibility**: You must keep the Piston image updated for security patches

---

## Troubleshooting

### Container Not Running

```bash
# Check status
docker ps | grep piston

# Start if stopped
docker start piston

# View logs for errors
docker logs piston
```

### Piston API Unreachable

The Piston URL is **hardcoded** in `src/lib/piston.ts`:

```typescript
const PISTON_API = "http://localhost:2000/api/v2"
```

If the container is running but unreachable:
1. Verify port mapping: `docker port piston`
2. Test API directly:
   ```bash
   curl http://localhost:2000/api/v2/execute \
     -X POST \
     -H "Content-Type: application/json" \
     -d '{"language":"python","version":"3.10.0","files":[{"content":"print(\"test\")"}]}'
   ```

### Language Runtime Missing

```bash
# Check installed runtimes
docker exec piston ls /var/piston/packages/

# Reinstall packages if needed
docker exec piston piston install <language>
```

### Container Won't Start

```bash
# Remove and recreate
docker rm -f piston

# Run fresh
docker run -d --name piston --privileged -p 2000:2000 \
  ghcr.io/engineer-man/piston:latest
```

---

## Production Considerations

### Current Setup (Development)

- Piston runs on `localhost:2000` alongside Next.js
- URL is hardcoded in source
- Single instance, no load balancing

### Production Recommendations

| Aspect | Recommendation |
|--------|---------------|
| Piston URL | Externalize to environment variable (`PISTON_API_URL`) |
| Deployment | Run Piston on a dedicated server or container orchestration platform |
| Scaling | Multiple Piston instances behind a load balancer |
| Security | Add API authentication between Next.js and Piston |
| Monitoring | Add health checks, logging, and alerting for Piston |
| Updates | Regularly pull latest Piston image for security patches |

---

## Summary

Docker (via Piston) is the **critical security and execution layer** that enables the Algo-Grade DAA Portal to:

1. ✅ **Safely execute** untrusted student code in isolated sandboxes
2. ✅ **Support multiple languages** without host-level installations
3. ✅ **Enforce resource limits** (3s timeout, 128MB memory) reliably
4. ✅ **Provide consistent behavior** across all student submissions
5. ✅ **Scale independently** from the main web application

Without Docker, the portal would either need to:
- Run code on the host (security risk)
- Use a third-party API (latency, cost, privacy concerns)
- Implement complex manual sandboxing (error-prone, hard to maintain)

The Piston Docker container provides a **production-ready, battle-tested** code execution engine that handles all the complexity of safe, multi-language code evaluation.
