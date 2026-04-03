# Next Plans - Algo-Grade Development Roadmap

## 🎯 Current Status

**Phase 1: Foundation** ✅
- [x] Project setup with Next.js 16
- [x] Clerk authentication integration
- [x] MongoDB/Mongoose configuration
- [x] Landing page with modern UI
- [x] Onboarding flow with email-based roll number extraction
- [x] Role-based routing (student/admin)
- [x] Theme provider (dark/light mode)
- [x] shadcn/ui component library (55+ components)

---

## 📋 Upcoming Tasks

### Phase 2: Core Features (Priority: High)

#### Student Dashboard (`/home`)
- [ ] Design dashboard layout with sidebar navigation
- [ ] Assignment list view with status indicators
- [ ] Submission history table
- [ ] Performance analytics charts (using Recharts)
- [ ] Quick stats cards (total submissions, average score, etc.)

#### Admin Dashboard (`/admin`)
- [ ] Admin sidebar with navigation
- [ ] Student management interface
- [ ] Assignment creation form
- [ ] Bulk operations (import/export students)
- [ ] Analytics overview

#### Assignment System
- [ ] Assignment model (title, description, due date, test cases)
- [ ] Create assignment API (`/api/assignments`)
- [ ] Assignment listing with filters
- [ ] Assignment detail page
- [ ] Test case storage strategy

#### Submission System
- [ ] Submission model (code, language, status, score)
- [ ] Code editor component (Monaco or CodeMirror)
- [ ] File upload for code submissions
- [ ] Submission status tracking (pending, graded, error)
- [ ] Real-time submission updates

### Phase 3: Auto-Grading Engine (Priority: High)

#### Grading Infrastructure
- [ ] Design grading queue system
- [ ] Code execution sandbox (Docker-based)
- [ ] Test case runner service
- [ ] Time/memory limit enforcement
- [ ] Plagiarism detection integration

#### Supported Languages
- [ ] C++ compiler setup
- [ ] Java compiler setup
- [ ] Python interpreter setup
- [ ] JavaScript runtime (Node.js)

#### Grading API
- [ ] `/api/submissions/[id]/grade` endpoint
- [ ] Webhook for grading completion
- [ ] Grade notification system (Sonner toasts)

### Phase 4: Enhanced UX (Priority: Medium)

#### Notifications
- [ ] Notification model
- [ ] Real-time notifications (Server-Sent Events or WebSocket)
- [ ] Notification bell UI component
- [ ] Mark as read/unread functionality

#### Profile Management
- [ ] Edit profile page
- [ ] Change password
- [ ] View submission statistics
- [ ] Download grade report (PDF)

#### Search & Filters
- [ ] Global search (Command palette with cmdk)
- [ ] Assignment filters (by status, date)
- [ ] Student search (admin)

### Phase 5: Polish & Optimization (Priority: Low)

#### Performance
- [ ] Implement caching strategies
- [ ] Database indexing
- [ ] Image optimization
- [ ] Code splitting for large components

#### Accessibility
- [ ] ARIA labels for all interactive elements
- [ ] Keyboard navigation testing
- [ ] Screen reader compatibility
- [ ] Color contrast audits

#### Testing
- [ ] Unit tests (Vitest/Jest)
- [ ] Integration tests for API routes
- [ ] E2E tests (Playwright)
- [ ] Load testing for grading engine

---

## 🏗️ Architecture Decisions Needed

1. **Code Execution Strategy**
   - Option A: Self-hosted Docker containers
   - Option B: Third-party API (Judge0, Piston)
   - Option C: Serverless functions with timeouts

2. **Real-time Updates**
   - Option A: Server-Sent Events (SSE)
   - Option B: WebSocket (Socket.io)
   - Option C: Polling with exponential backoff

3. **File Storage**
   - Option A: MongoDB GridFS
   - Option B: AWS S3 / Cloudflare R2
   - Option C: Local filesystem (development only)

---

## 📅 Milestone Timeline

| Milestone | Target | Key Deliverables |
|-----------|--------|------------------|
| M1 | Week 1-2 | Student & Admin dashboards |
| M2 | Week 3-4 | Assignment CRUD + Submission system |
| M3 | Week 5-6 | Auto-grading engine (MVP) |
| M4 | Week 7-8 | Notifications + Profile features |
| M5 | Week 9-10 | Testing + Performance optimization |

---

## 🐛 Known Issues / Technical Debt

- [ ] `components/ui/` and `src/components/` duplication needs resolution
- [ ] Empty Student.ts and Admin.ts models need schema definitions
- [ ] No error boundaries implemented
- [ ] Missing loading states for async operations
- [ ] No rate limiting on API routes

---

## 💡 Feature Ideas (Backlog)

- [ ] Leaderboard/ranking system
- [ ] Discussion forum per assignment
- [ ] Code plagiarism detection
- [ ] Email notifications for deadlines
- [ ] Mobile-responsive PWA
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Webhook integrations (Discord, Slack)
- [ ] Export grades to CSV/Excel
- [ ] Assignment templates
- [ ] Batch regrading functionality

---

## 🔒 Security Considerations

- [ ] Implement rate limiting (express-rate-limit or custom)
- [ ] Add CSRF protection
- [ ] Sanitize code submissions before execution
- [ ] Implement proper error handling (no stack traces in prod)
- [ ] Add request validation with Zod schemas
- [ ] Set up security headers (Helmet)

---

**Last Updated:** March 22, 2026
