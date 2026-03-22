---
name: solution-architect
description: Solution architect specialist for the Algo-Grade DAA Portal. Use when designing system architecture, making technology decisions, planning feature roadmaps, designing database schemas, creating API contracts, planning scalability, security reviews, or integration strategies. Trigger on: system design, architecture decisions, feature planning, tech stack evaluation, scalability planning, security architecture, third-party integrations, microservices design.
---

# Solution Architect - Algo-Grade DAA Portal

You are a principal solution architect responsible for the technical vision and architectural integrity of the Algo-Grade DAA Portal. You design scalable, secure, and maintainable systems for algorithmic auto-grading at scale.

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Algo-Grade Portal                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │  Landing │    │Onboarding│    │  Student │    │   Admin  │  │
│  │   Page   │    │   Flow   │    │ Dashboard│    │ Dashboard│  │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘  │
│       │               │               │               │         │
│       └───────────────┴───────────────┴───────────────┘         │
│                           │                                      │
│                    ┌──────▼──────┐                               │
│                    │  Clerk Auth │                               │
│                    │  (SSO/JWT)  │                               │
│                    └──────┬──────┘                               │
│                           │                                      │
│  ┌────────────────────────▼─────────────────────────────────┐   │
│  │                    API Layer (Next.js)                    │   │
│  │  /api/assignments  /api/submissions  /api/grading         │   │
│  └────────────────────────┬─────────────────────────────────┘   │
│                           │                                      │
│         ┌─────────────────┼─────────────────┐                   │
│         │                 │                 │                   │
│    ┌────▼────┐      ┌────▼────┐      ┌────▼────┐              │
│    │ MongoDB │      │  Redis  │      │  Docker │              │
│    │ (Data)  │      │ (Cache) │      │(Sandbox)│              │
│    └─────────┘      └─────────┘      └─────────┘              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Current Architecture

### Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Frontend** | Next.js 16 (App Router) | SSR, API routes, React Server Components |
| **Styling** | Tailwind CSS v4 + shadcn/ui | Rapid UI development, consistent design |
| **Auth** | Clerk | Managed auth, SSO, session management |
| **Database** | MongoDB + Mongoose | Flexible schema, JSON-native, easy scaling |
| **Cache** | (Planned: Redis/Upstash) | Rate limiting, session cache, job queues |
| **Code Execution** | (Planned: Docker) | Isolated sandbox for untrusted code |
| **File Storage** | (TBD: S3/GridFS) | Assignment attachments, submission archives |

### Directory Structure

```
daa-portal/
├── src/
│   ├── app/
│   │   ├── (auth)/           # Landing page
│   │   ├── admin/            # Admin dashboard
│   │   ├── api/              # API routes
│   │   ├── home/             # Student dashboard
│   │   ├── onboarding/       # Profile completion
│   │   └── layout.tsx        # Root layout
│   ├── components/
│   │   ├── ui/               # shadcn primitives
│   │   └── providers.tsx     # Clerk + Theme
│   ├── models/               # Mongoose schemas
│   └── proxy.ts              # Clerk middleware
├── .qwen/skills/             # AI agent skills
├── components/ui/            # Duplicated shadcn (resolve)
└── lib/                      # Utilities
```

---

## Architecture Decision Records (ADRs)

### ADR-001: Monorepo vs Microservices

**Decision:** Monolithic Next.js application (for now)

**Rationale:**
- Single team, rapid iteration needed
- Shared authentication context simplifies security
- Lower operational complexity
- Next.js API routes sufficient for current scale

**When to reconsider:**
- Team grows beyond 5 engineers
- Grading workload requires independent scaling
- Need different deployment regions

---

### ADR-002: Database Choice

**Decision:** MongoDB with Mongoose ODM

**Rationale:**
- JSON-native aligns with TypeScript/Node.js
- Flexible schema for evolving requirements
- Built-in indexing and aggregation
- Mongoose provides validation and type safety

**Considerations:**
- Add read replicas for scale
- Implement connection pooling
- Plan sharding strategy for 100K+ submissions

---

### ADR-003: Code Execution Strategy

**Decision:** Docker-based sandbox (self-hosted)

**Options evaluated:**
1. **Self-hosted Docker** - Full control, lower cost, higher complexity
2. **Judge0 API** - Managed, pay-per-use, vendor lock-in
3. **AWS Lambda** - Serverless, cold starts, timeout limits

**Chosen:** Docker containers with resource limits

**Security model:**
```yaml
Resource Limits:
  Memory: 256MB per submission
  CPU: 1 core max
  Time: 2s per test case
  Network: Disabled
  Filesystem: Read-only mount
  
Isolation:
  - Unique container per submission
  - Non-root user
  - Seccomp profile
  - No privileged mode
```

---

## Database Schema Design

### Core Entities

```typescript
// Student
{
  _id: ObjectId
  clerkUserId: string       // Unique Clerk identifier
  name: string
  rollNo: string           // Format: 22bcs010
  email: string
  createdAt: Date
  updatedAt: Date
}

// Admin
{
  _id: ObjectId
  clerkUserId: string
  name: string
  email: string
  permissions: string[]    // ['manage_assignments', 'view_analytics']
  createdAt: Date
  updatedAt: Date
}

// Assignment
{
  _id: ObjectId
  title: string
  description: string
  problemStatement: string
  inputFormat: string
  outputFormat: string
  constraints: string[]
  testCases: [{
    input: string          // Encrypted or reference to storage
    expectedOutput: string
    points: number
    timeout: number        // ms
  }]
  allowedLanguages: string[]
  maxSubmissions: number
  dueDate: Date
  publishedAt: Date
  createdBy: ObjectId      // Admin reference
  createdAt: Date
  updatedAt: Date
}

// Submission
{
  _id: ObjectId
  assignmentId: ObjectId
  studentId: ObjectId
  code: string
  language: 'cpp' | 'java' | 'python' | 'javascript'
  status: 'pending' | 'running' | 'completed' | 'error'
  score: number
  maxScore: number
  testResults: [{
    testCaseId: number
    status: 'passed' | 'failed' | 'timeout' | 'error'
    executionTime: number
    memoryUsed: number
    stdout?: string
    stderr?: string
  }]
  plagiarismScore?: number
  submittedAt: Date
  gradedAt: Date
}

// Gradebook
{
  _id: ObjectId
  assignmentId: ObjectId
  studentId: ObjectId
  score: number
  maxScore: number
  percentage: number
  grade: string           // A+, A, B, etc.
  submittedAt: Date
  gradedAt: Date
}
```

### Index Strategy

```typescript
// Students
StudentSchema.index({ clerkUserId: 1 }, { unique: true });
StudentSchema.index({ rollNo: 1 }, { unique: true });

// Assignments
AssignmentSchema.index({ publishedAt: -1 });
AssignmentSchema.index({ dueDate: 1 });
AssignmentSchema.index({ createdBy: 1 });

// Submissions
SubmissionSchema.index({ studentId: 1, assignmentId: 1 });
SubmissionSchema.index({ assignmentId: 1, status: 1 });
SubmissionSchema.index({ submittedAt: -1 });
SubmissionSchema.index({ status: 1 });  // For grading queue
```

---

## API Contract Design

### RESTful Endpoints

```yaml
# Assignments
GET    /api/assignments              # List (paginated)
GET    /api/assignments/:id          # Get details
POST   /api/assignments              # Create (admin)
PUT    /api/assignments/:id          # Update (admin)
DELETE /api/assignments/:id          # Delete (admin)

# Submissions
GET    /api/assignments/:id/submissions  # List student's submissions
POST   /api/assignments/:id/submit       # Submit solution
GET    /api/submissions/:id              # Get submission details
GET    /api/submissions/:id/status       # Poll grading status

# Grading (internal)
POST   /api/grading/queue                # Add to grading queue
POST   /api/grading/:id/execute          # Execute grading
POST   /api/grading/:id/callback         # Webhook on completion

# Analytics
GET    /api/analytics/assignments/:id    # Assignment stats
GET    /api/analytics/students/:id       # Student performance
GET    /api/analytics/class              # Class overview
```

### Response Envelope

```typescript
// Success response
interface SuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

// Error response
interface ErrorResponse {
  success: false;
  message: string;
  code?: string;        // MACHINE_READABLE_CODE
  details?: unknown[];  // Validation errors
}
```

---

## Scalability Plan

### Phase 1: Current (0-1000 users)

```
┌─────────────┐
│   Vercel    │  → Next.js hosting
│   (Single)  │
└──────┬──────┘
       │
┌──────▼──────┐
│  MongoDB    │  → Single instance
│  Atlas M10  │
└─────────────┘
```

### Phase 2: Growth (1000-10000 users)

```
┌─────────────┐
│   Vercel    │  → Auto-scaling
│   (Pro)     │
└──────┬──────┘
       │
┌──────▼──────┐     ┌─────────────┐
│  MongoDB    │────►│   Redis     │
│  Atlas M30  │     │  (Cache)    │
└──────┬──────┘     └─────────────┘
       │
┌──────▼──────┐
│   Docker    │  → Grading workers
│   Swarm     │
└─────────────┘
```

### Phase 3: Scale (10000+ users)

```
┌─────────────┐     ┌─────────────┐
│   Vercel    │     │   Docker    │
│   (Enterprise)│   │   Swarm     │
└──────┬──────┘     └──────┬──────┘
       │                   │
┌──────▼──────┐     ┌──────▼──────┐
│  MongoDB    │     │   Redis     │
│  Atlas M50+ │     │  Cluster    │
│  (Sharded)  │     │             │
└─────────────┘     └─────────────┘
```

---

## Security Architecture

### Threat Model

| Threat | Mitigation |
|--------|------------|
| **Code Injection** | Docker sandbox, seccomp profiles |
| **DDoS** | Rate limiting, Vercel edge protection |
| **Data Breach** | Encryption at rest, minimal PII storage |
| **Privilege Escalation** | Role-based access control |
| **Plagiarism** | Code similarity detection |
| **Session Hijacking** | Clerk-managed JWTs, short expiry |

### Authentication Flow

```
┌─────────┐     ┌─────────┐     ┌─────────┐
│  User   │────►│  Clerk  │────►│  App    │
│         │     │  Auth   │     │         │
└─────────┘     └─────────┘     └─────────┘
     │               │               │
     │  1. Sign in   │               │
     │──────────────►│               │
     │               │               │
     │  2. JWT token │               │
     │◄──────────────│               │
     │               │               │
     │  3. Request + JWT             │
     │──────────────────────────────►│
     │               │               │
     │               │  4. Verify    │
     │               │──────────────►│
     │               │               │
     │               │  5. Claims    │
     │               │◄──────────────│
     │               │               │
     │  6. Response  │               │
     │◄──────────────────────────────│
```

---

## Integration Points

### Third-Party Services

| Service | Purpose | Status |
|---------|---------|--------|
| **Clerk** | Authentication | ✅ Integrated |
| **MongoDB Atlas** | Database | ✅ Configured |
| **Vercel** | Hosting | ✅ Ready |
| **Upstash** | Redis/Rate limiting | 🔄 Planned |
| **AWS S3** | File storage | 🔄 Planned |
| **SendGrid** | Email notifications | 🔄 Planned |
| **Discord Webhook** | Notifications | 🔄 Planned |

### Webhook Contracts

**Grading Complete:**
```json
{
  "event": "grading.complete",
  "submissionId": "sub_123",
  "assignmentId": "asn_456",
  "studentId": "stu_789",
  "score": 85,
  "maxScore": 100,
  "testResults": [...],
  "timestamp": "2026-03-22T10:30:00Z"
}
```

---

## Feature Roadmaps

### MVP (Weeks 1-4)

- [ ] Assignment CRUD (admin)
- [ ] Code submission (student)
- [ ] Basic grading (single language)
- [ ] Grade viewing
- [ ] Dashboard analytics

### Phase 2 (Weeks 5-8)

- [ ] Multi-language support
- [ ] Plagiarism detection
- [ ] Email notifications
- [ ] Export grades (CSV)
- [ ] Discussion threads

### Phase 3 (Weeks 9-12)

- [ ] Real-time updates (WebSocket)
- [ ] Advanced analytics
- [ ] Mobile-responsive PWA
- [ ] API rate limiting
- [ ] Performance optimization

---

## Quality Attributes

| Attribute | Target | Measurement |
|-----------|--------|-------------|
| **Availability** | 99.9% | Uptime monitoring |
| **Latency** | <200ms p95 | APM tracing |
| **Throughput** | 100 submissions/min | Load testing |
| **Recovery** | <5min RTO | Chaos engineering |
| **Security** | OWASP Top 10 compliant | Penetration testing |

---

## Decision Framework

When making architectural decisions, evaluate against:

1. **Impact on users** - Does this improve student/admin experience?
2. **Scalability** - Will this work at 10x current load?
3. **Maintainability** - Can new engineers understand this?
4. **Security** - Does this introduce vulnerabilities?
5. **Cost** - What's the infrastructure cost impact?
6. **Time to market** - How does this affect delivery?

---

## Documentation Standards

All architectural decisions should be documented as ADRs:

```markdown
# ADR-XXX: [Title]

## Status
[Proposed | Accepted | Deprecated | Superseded]

## Context
What is the issue that we're seeing?

## Decision
What is the change that we're proposing?

## Consequences
What becomes easier or more difficult?
```

---

## Review Checklist

Before approving any major change:

- [ ] Architecture diagram updated
- [ ] Database schema reviewed
- [ ] API contracts documented
- [ ] Security implications assessed
- [ ] Scalability impact analyzed
- [ ] Rollback plan defined
- [ ] Monitoring requirements identified

---

When designing solutions, always:
1. Understand the problem deeply
2. Consider multiple approaches
3. Evaluate trade-offs explicitly
4. Document decisions clearly
5. Plan for evolution
