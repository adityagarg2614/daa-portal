# Production Readiness Audit — Algo-Grade DAA Portal

> **Scope:** Application-level features, architecture, and code quality only.
> **Excluded:** DevOps topics (Docker, Kubernetes, CI/CD, cloud hosting).
> **Date:** April 15, 2026

---

## Executive Summary

The Algo-Grade DAA Portal is a **functional auto-grading platform** with a solid foundation: Clerk authentication, MongoDB data layer, Piston-based code execution, role-based dashboards, and an announcement system. However, several **critical gaps** prevent it from being truly production-ready for a live course with hundreds of students.

This document identifies **35+ actionable improvements** organized into **8 categories**, with a heavy focus on **Inngest background jobs**, **missing features**, **reliability**, **security**, and **user experience**.

---

## Table of Contents

1. [Inngest Background Jobs (Highest Priority)](#1-inngest-background-jobs-highest-priority)
2. [Missing Core Features](#2-missing-core-features)
3. [Submission & Grading Improvements](#3-submission--grading-improvements)
4. [Email & Notification System](#4-email--notification-system)
5. [Security & Data Integrity](#5-security--data-integrity)
6. [Performance & Scalability](#6-performance--scalability)
7. [User Experience & Polish](#7-user-experience--polish)
8. [Testing & Observability](#8-testing--observability)

---

## 1. Inngest Background Jobs (Highest Priority)

### Current State
Inngest is installed but **severely underutilized**. Only 2 functions exist:
- `syncUser` — Syncs Clerk user data to MongoDB on `clerk/user.updated` and `clerk/user.created` events.
- `deleteUserFromDB` — Deletes user from MongoDB on `clerk/user.deleted` event.

**Critical issue:** The `serve()` call in `src/app/api/inngest/route.ts` has an **empty functions array** — meaning these functions are **not actually registered** with the Inngest server. They will never execute.

```typescript
// src/app/api/inngest/route.ts — CURRENT (BROKEN)
export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [
        // ← EMPTY! Functions are never registered.
    ],
});
```

### 1.1 Fix: Register Existing Functions

```typescript
import { syncUser, deleteUserFromDB } from "@/inngest/functions";

export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [
        syncUser,
        deleteUserFromDB,
    ],
});
```

Without this fix, **no Inngest function will ever run**.

---

### 1.2 Job: Assignment Deadline Reminder Emails

**Problem:** Students get no notification before an assignment deadline. In a live course, this leads to mass confusion and missed submissions.

**Inngest Solution:** Schedule an email 24 hours and 1 hour before each assignment's `dueAt`.

```typescript
export const assignmentDeadlineReminder = inngest.createFunction(
    {
        id: "assignment-deadline-reminder",
        triggers: [{ event: "assignment/created" }, { event: "assignment/updated" }],
    },
    async ({ event, step }) => {
        const { assignmentId, dueAt, title } = event.data;

        // Schedule reminder 24 hours before deadline
        const reminder24h = new Date(new Date(dueAt).getTime() - 24 * 60 * 60 * 1000);
        if (reminder24h > new Date()) {
            await step.sleepUntil("wait-24h-before", reminder24h);

            const students = await step.run("fetch-students", async () => {
                await connectDB();
                return await User.find({ role: "student" }).select("email name");
            });

            await step.run("send-reminder-24h", async () => {
                for (const student of students) {
                    await sendEmail({
                        to: student.email,
                        subject: `⏰ 24 Hours Left: "${title}" Assignment`,
                        html: generateDeadlineReminderHTML({ studentName: student.name, assignmentTitle: title, dueAt }),
                    });
                }
            });
        }
    },
);
```

**Trigger:** When an admin creates or updates an assignment via `/api/admin/assignments`, the backend should send an Inngest event:

```typescript
await inngest.send({
    event: "assignment/created",
    data: { assignmentId, dueAt: assignment.dueAt, title: assignment.title },
});
```

**Why Inngest?** This is a **time-delayed job** — you can't use `setTimeout` in a serverless environment. Inngest persists the job state and wakes up at the exact scheduled time, even if your server restarts.

---

### 1.3 Job: Assignment Auto-Publish

**Problem:** Assignments have a `publishAt` field, but there's no mechanism to auto-publish them at that time. Currently, the frontend filters by `publishAt <= now`, which means assignments are "soft-published" but there's no notification sent to students when they go live.

**Inngest Solution:** Schedule a job at `publishAt` that:
1. Marks the assignment as "published" (if you add a `isPublished` boolean).
2. Sends notification emails to all students.
3. Creates an announcement automatically.

```typescript
export const autoPublishAssignment = inngest.createFunction(
    {
        id: "auto-publish-assignment",
        triggers: [{ event: "assignment/created" }],
    },
    async ({ event, step }) => {
        const { assignmentId, publishAt, title } = event.data;

        // Wait until publishAt
        await step.sleepUntil("wait-for-publish", new Date(publishAt));

        // Send emails to all students
        await step.run("notify-students", async () => {
            const students = await User.find({ role: "student" }).select("email name");
            for (const student of students) {
                await sendEmail({
                    to: student.email,
                    subject: `📝 New Assignment Published: "${title}"`,
                    html: generateNewAssignmentHTML({ studentName: student.name, assignmentTitle: title }),
                });
            }
        });

        // Auto-create an announcement
        await step.run("create-announcement", async () => {
            await Announcement.create({
                title: `New Assignment: ${title}`,
                content: `A new assignment "${title}" has been published. Check your dashboard for details.`,
                type: "assignment",
                priority: "high",
                createdBy: event.data.createdBy,
            });
        });
    },
);
```

---

### 1.4 Job: Auto-Expire Announcements

**Problem:** Announcements have an `expiresAt` field, but nothing automatically deactivates them. The `expiresAt` index exists but is never used by a cleanup job.

**Inngest Solution:** A scheduled job that runs daily and deactivates expired announcements.

```typescript
export const autoExpireAnnouncements = inngest.createFunction(
    {
        id: "auto-expire-announcements",
        triggers: [{ event: "inngest/scheduled.daily" }],
    },
    async ({ step }) => {
        const expired = await step.run("find-expired", async () => {
            await connectDB();
            return await Announcement.find({
                isActive: true,
                expiresAt: { $ne: null, $lte: new Date() },
            });
        });

        if (expired.length === 0) return;

        await step.run("deactivate", async () => {
            await Announcement.updateMany(
                { _id: { $in: expired.map((a) => a._id) } },
                { $set: { isActive: false } },
            );
        });

        console.log(`[auto-expire] Deactivated ${expired.length} expired announcements`);
    },
);
```

**Schedule trigger:** Use Inngest's cron-like scheduling:
```typescript
// Send this event daily via Inngest CLI or external cron
inngest.send({ event: "inngest/scheduled.daily" });
```

Or use Inngest's built-in scheduled triggers (if available in your plan).

---

### 1.5 Job: Bulk Submission Processing (Queue-Based)

**Problem:** The current submission flow is **synchronous**. When a student submits code:
1. The API fetches test cases.
2. Calls Piston for each test case sequentially.
3. Waits for all results.
4. Saves to MongoDB.
5. Returns response.

For a problem with 10 test cases, this can take **15-30 seconds**. During assignment deadlines, hundreds of students submit simultaneously, causing:
- API timeouts (Next.js default timeout is 60s).
- MongoDB connection pool exhaustion.
- Poor user experience (spinner for 30 seconds).

**Inngest Solution:** Make submission **asynchronous**. The API immediately returns "Submission received, processing..." and Inngest handles the heavy lifting in the background.

```typescript
// Step 1: API route — quick response
export async function POST(req: Request) {
    // ... validation ...

    // Save submission as "Pending"
    const submission = await Submission.create({
        assignmentId, problemId, userId, code, language,
        status: "Pending",
    });

    // Queue grading job
    await inngest.send({
        event: "submission/grade",
        data: { submissionId: submission._id.toString(), problemId, code, language },
    });

    return NextResponse.json({
        success: true,
        message: "Submission received. Grading in progress.",
        submissionId: submission._id,
    });
}

// Step 2: Inngest function — background grading
export const gradeSubmission = inngest.createFunction(
    {
        id: "grade-submission",
        triggers: [{ event: "submission/grade" }],
    },
    async ({ event, step }) => {
        const { submissionId, problemId, code, language } = event.data;

        // Fetch test cases
        const problem = await step.run("fetch-problem", async () => {
            await connectDB();
            return await Problem.findById(problemId);
        });

        // Run test cases (can parallelize with step.run in parallel)
        const results = await step.run("run-tests", async () => {
            return await runTestCases(code, language, problem.testCases);
        });

        // Update submission with results
        await step.run("update-submission", async () => {
            await connectDB();
            await Submission.findByIdAndUpdate(submissionId, {
                status: results.allPassed ? "Evaluated" : "Attempted",
                score: results.allPassed ? problem.marks : 0,
                testResults: results.results,
                executionTime: results.executionTime,
                memoryUsed: results.memoryUsed,
            });
        });

        // Notify student if all tests passed
        if (results.allPassed) {
            await step.run("notify-student", async () => {
                const student = await User.findById(/* userId */);
                await sendEmail({
                    to: student.email,
                    subject: `✅ Submission Graded: ${problem.title}`,
                    html: generateSubmissionResultHTML({ studentName: student.name, problemTitle: problem.title, passed: true }),
                });
            });
        }
    },
);
```

**Benefits:**
- API responds in <1 second instead of 30 seconds.
- Inngest handles retries if Piston is temporarily down.
- No API timeout issues during peak load.
- Can process submissions in parallel with concurrency limits.

---

### 1.6 Job: Welcome Email via Inngest (Replace Direct API Call)

**Problem:** The welcome email is sent synchronously via `/api/admin/email/welcome`. If Resend API is slow or fails, the admin sees a loading spinner and potentially an error.

**Inngest Solution:** Queue the email as a background job.

```typescript
export const sendWelcomeEmailJob = inngest.createFunction(
    {
        id: "send-welcome-email",
        triggers: [{ event: "user/created" }],
    },
    async ({ event, step }) => {
        const { to, name, password, role, rollNo } = event.data;

        const result = await step.run("send-email", async () => {
            return await sendWelcomeEmail({ to, name, password, role, rollNo });
        });

        if (!result.success) {
            // Retry with backoff
            await step.sleep("retry-delay", "1m");
            await step.run("retry-email", async () => {
                return await sendWelcomeEmail({ to, name, password, role, rollNo });
            });
        }
    },
);
```

**Trigger:** When admin creates a user via `/api/admin/users`:
```typescript
await inngest.send({
    event: "user/created",
    data: { to: email, name, password, role, rollNo },
});
```

---

### 1.7 Job: Daily Digest Email to Admin

**Problem:** Admins have no way to get a daily summary of platform activity (new submissions, new students, upcoming deadlines).

**Inngest Solution:** A scheduled daily job that compiles stats and emails the admin.

```typescript
export const dailyAdminDigest = inngest.createFunction(
    {
        id: "daily-admin-digest",
        triggers: [{ event: "inngest/scheduled.daily" }],
    },
    async ({ step }) => {
        const stats = await step.run("collect-stats", async () => {
            await connectDB();
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

            const [newSubmissions, newStudents, upcomingDeadlines] = await Promise.all([
                Submission.countDocuments({ createdAt: { $gte: yesterday } }),
                User.countDocuments({ role: "student", createdAt: { $gte: yesterday } }),
                Assignment.countDocuments({
                    dueAt: { $gte: new Date(), $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
                }),
            ]);

            return { newSubmissions, newStudents, upcomingDeadlines };
        });

        await step.run("send-digest", async () => {
            const admins = await User.find({ role: "admin" }).select("email name");
            for (const admin of admins) {
                await sendEmail({
                    to: admin.email,
                    subject: "📊 Algo-Grade Daily Digest",
                    html: generateDailyDigestHTML({ adminName: admin.name, ...stats }),
                });
            }
        });
    },
);
```

---

### 1.8 Job: Auto-Clean Old Submissions

**Problem:** Over a semester, thousands of submissions accumulate in MongoDB. There's no cleanup strategy.

**Inngest Solution:** A weekly job that archives or deletes submissions older than a configurable threshold (e.g., 90 days).

```typescript
export const cleanOldSubmissions = inngest.createFunction(
    {
        id: "clean-old-submissions",
        triggers: [{ event: "inngest/scheduled.weekly" }],
    },
    async ({ step }) => {
        const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 days ago

        const oldSubmissions = await step.run("find-old", async () => {
            await connectDB();
            return await Submission.find({ createdAt: { $lte: cutoffDate } }).select("_id");
        });

        if (oldSubmissions.length === 0) return;

        const result = await step.run("delete-old", async () => {
            return await Submission.deleteMany({ _id: { $in: oldSubmissions.map((s) => s._id) } });
        });

        console.log(`[clean-old-submissions] Deleted ${result.deletedCount} submissions older than ${cutoffDate}`);
    },
);
```

---

### 1.9 Job: Piston Health Check & Auto-Restart Notification

**Problem:** If the Piston container crashes or becomes unresponsive, all code submissions fail silently. There's no monitoring.

**Inngest Solution:** A periodic health check that tests Piston and alerts the admin if it's down.

```typescript
export const pistonHealthCheck = inngest.createFunction(
    {
        id: "piston-health-check",
        triggers: [{ event: "inngest/scheduled.every-5-minutes" }],
    },
    async ({ step }) => {
        const isHealthy = await step.run("check-piston", async () => {
            try {
                const response = await fetch(`${PISTON_API}/execute`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        language: "python",
                        version: "3.10.0",
                        files: [{ content: 'print("health check")' }],
                        run_timeout: 2000,
                    }),
                });
                return response.ok;
            } catch {
                return false;
            }
        });

        if (!isHealthy) {
            await step.run("alert-admin", async () => {
                const admins = await User.find({ role: "admin" }).select("email name");
                for (const admin of admins) {
                    await sendEmail({
                        to: admin.email,
                        subject: "🚨 CRITICAL: Piston Code Execution Engine is Down",
                        html: generatePistonDownAlertHTML({ adminName: admin.name }),
                    });
                }
            });
        }
    },
);
```

---

### 1.10 Job: Assignment Auto-Close on Deadline

**Problem:** After an assignment's `dueAt` passes, students can still technically submit (the check exists in `/api/student/assignments/[id]/submit/route.ts`, but the main submission route `/api/student/submissions/route.ts` has **no deadline check**).

**Inngest Solution:** A job that runs at `dueAt` and:
1. Marks the assignment as "closed."
2. Prevents any further submissions at the database level.
3. Sends a "deadline passed" notification to students who haven't submitted.

```typescript
export const autoCloseAssignment = inngest.createFunction(
    {
        id: "auto-close-assignment",
        triggers: [{ event: "assignment/created" }],
    },
    async ({ event, step }) => {
        const { assignmentId, dueAt, title } = event.data;

        // Wait until deadline
        await step.sleepUntil("wait-for-deadline", new Date(dueAt));

        // Mark assignment as closed
        await step.run("close-assignment", async () => {
            await connectDB();
            await Assignment.findByIdAndUpdate(assignmentId, { $set: { isClosed: true } });
        });

        // Find students who haven't submitted
        const nonSubmitters = await step.run("find-non-submitters", async () => {
            await connectDB();
            const assignment = await Assignment.findById(assignmentId).populate("problemIds");
            const allStudents = await User.find({ role: "student" }).select("email name");
            const submitters = await Submission.distinct("userId", { assignmentId });

            return allStudents.filter((s) => !submitters.includes(s._id.toString()));
        });

        // Notify non-submitters
        if (nonSubmitters.length > 0) {
            await step.run("notify-non-submitters", async () => {
                for (const student of nonSubmitters) {
                    await sendEmail({
                        to: student.email,
                        subject: `⚠️ Assignment "${title}" Deadline Passed — No Submission Found`,
                        html: generateDeadlinePassedHTML({ studentName: student.name, assignmentTitle: title }),
                    });
                }
            });
        }
    },
);
```

---

### Summary of All Inngest Jobs

| # | Job | Trigger | Timing | Priority |
|---|-----|---------|--------|----------|
| 1.1 | Register existing functions | N/A (fix) | Immediate | **CRITICAL** |
| 1.2 | Assignment deadline reminder (24h + 1h) | `assignment/created`, `assignment/updated` | Scheduled before deadline | **HIGH** |
| 1.3 | Auto-publish assignment + notify students | `assignment/created` | Scheduled at `publishAt` | **HIGH** |
| 1.4 | Auto-expire announcements | `inngest/scheduled.daily` | Daily | **MEDIUM** |
| 1.5 | Bulk submission processing (async queue) | `submission/grade` | Immediate | **CRITICAL** |
| 1.6 | Welcome email via Inngest | `user/created` | Immediate | **MEDIUM** |
| 1.7 | Daily admin digest email | `inngest/scheduled.daily` | Daily | **LOW** |
| 1.8 | Auto-clean old submissions | `inngest/scheduled.weekly` | Weekly | **LOW** |
| 1.9 | Piston health check | `inngest/scheduled.every-5-minutes` | Every 5 min | **HIGH** |
| 1.10 | Auto-close assignment + notify non-submitters | `assignment/created` | Scheduled at `dueAt` | **HIGH** |

---

## 2. Missing Core Features

### 2.1 Submission History & Re-Submission Tracking

**Problem:** The current submission route **deletes** the previous submission when a student re-submits (`await Submission.deleteOne({ userId, problemId })`). This means:
- No history of improvement over time.
- No way to see how many attempts a student made.
- No way to detect if a student is just guessing solutions.

**Fix:** Keep all submissions. Add an `attemptNumber` field. Show only the latest (best) score on the dashboard, but keep history accessible.

```typescript
interface ISubmission {
    // ... existing fields ...
    attemptNumber: number;  // 1, 2, 3, ...
    isBestScore: boolean;   // Only one submission per problem has this true
}
```

**UI Impact:** Add a "Submission History" tab on the student dashboard showing all attempts with timestamps, scores, and code diffs.

---

### 2.2 Assignment Leaderboard / Rankings

**Problem:** No competitive element. Students have no visibility into how they rank against peers.

**Fix:** Add a leaderboard endpoint that ranks students by:
1. Total score (descending).
2. Submission speed (tiebreaker — who submitted first).
3. Number of attempts (tiebreaker — fewer attempts = better).

```typescript
// GET /api/student/leaderboard/:assignmentId
export async function GET(req: Request, { params }: { params: { assignmentId: string } }) {
    const { assignmentId } = params;

    const leaderboard = await Submission.aggregate([
        { $match: { assignmentId: new mongoose.Types.ObjectId(assignmentId) } },
        { $group: {
            _id: "$userId",
            totalScore: { $sum: "$score" },
            firstSubmission: { $min: "$createdAt" },
            attempts: { $sum: 1 },
        }},
        { $sort: { totalScore: -1, firstSubmission: 1, attempts: 1 } },
        { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
        { $project: {
            rank: 1,
            name: { $arrayElemAt: ["$user.name", 0] },
            rollNo: { $arrayElemAt: ["$user.rollNo", 0] },
            totalScore: 1,
            firstSubmission: 1,
            attempts: 1,
        }},
    ]);

    return NextResponse.json({ success: true, leaderboard });
}
```

**Privacy consideration:** Show only rank, roll number (partially masked), and score. Don't expose full names or code.

---

### 2.3 Code Diff View (Between Attempts)

**Problem:** Students can't see what changed between their first and latest submission.

**Fix:** Add a diff view that compares two submissions side-by-side. Use a library like `diff` or `react-diff-viewer`.

```bash
npm install react-diff-viewer
```

This helps students understand what they improved and learn from mistakes.

---

### 2.4 Plagiarism Detection

**Problem:** No mechanism to detect copied solutions. In a course with 500+ students, this is a real concern.

**Approach (MVP):**
1. When a submission is saved, compare its code against all other submissions for the same problem.
2. Use a simple similarity metric: **token-based comparison** (strip comments, normalize variable names, compare token sequences).
3. Flag submissions with >80% similarity for admin review.

**Inngest Integration:** This is a **heavy computation** job — perfect for Inngest background processing.

```typescript
export const plagiarismCheck = inngest.createFunction(
    {
        id: "plagiarism-check",
        triggers: [{ event: "submission/graded" }],
    },
    async ({ event, step }) => {
        const { submissionId, problemId, userId, code, language } = event.data;

        // Fetch all other submissions for this problem
        const otherSubmissions = await step.run("fetch-submissions", async () => {
            await connectDB();
            return await Submission.find({ problemId, userId: { $ne: userId }, language }).select("code userId");
        });

        // Compare against each
        const flagged = await step.run("compare", async () => {
            const results = [];
            for (const other of otherSubmissions) {
                const similarity = calculateSimilarity(code, other.code);
                if (similarity > 0.8) {
                    results.push({ submissionId, otherSubmissionId: other._id, similarity, userId, otherUserId: other.userId });
                }
            }
            return results;
        });

        // Alert admin if flagged
        if (flagged.length > 0) {
            await step.run("alert-admin", async () => {
                // Create a plagiarism report entry
                // Send email to admin
            });
        }
    },
);
```

**Note:** Full plagiarism detection (MOSS-style) is complex. Start with the MVP above and iterate.

---

### 2.5 Assignment Access Control (Late Submission Policy)

**Problem:** The current access control is binary — either the deadline has passed (no submission allowed) or it hasn't (full access). Real courses need:
- **Grace period** — Allow late submissions with a penalty (e.g., 10% deduction per hour).
- **Soft deadline** — Students can see the assignment but can't submit after the deadline.
- **Hard deadline** — Assignment becomes completely invisible after a certain date.

**Fix:** Add fields to the Assignment model:

```typescript
interface IAssignment {
    // ... existing fields ...
    lateSubmissionAllowed: boolean;
    latePenaltyPercent: number;    // e.g., 10 = 10% deduction per hour
    lateDeadline: Date;            // Final cutoff (hard deadline)
    visibleAfterDeadline: boolean; // Can students still see it after deadline?
}
```

Then update the submission route to apply penalties:

```typescript
if (now > dueAt && now <= lateDeadline && lateSubmissionAllowed) {
    const hoursLate = Math.ceil((now.getTime() - dueAt.getTime()) / (1000 * 60 * 60));
    const penalty = hoursLate * (latePenaltyPercent / 100);
    finalScore = Math.max(0, rawScore * (1 - penalty));
}
```

---

### 2.6 Problem Categories / Tags System

**Problem:** Problems have a `tags` array, but there's no UI for browsing problems by tag, no tag management, and no filtering.

**Fix:**
1. Create a predefined set of tags (Dynamic Programming, Greedy, Graphs, Sorting, Searching, etc.).
2. Add a tag filter on the admin problems page.
3. Add a "Browse Problems by Category" page for students.
4. Show tag-based analytics on the admin dashboard (e.g., "Students struggle most with Graph problems").

---

### 2.7 Custom Test Cases for Students

**Problem:** Students can only test their code against the problem's predefined test cases. They can't create their own test cases to validate edge cases.

**Fix:** The `/api/compile` route already supports custom `stdin` input. Expose this in the UI:
1. Add a "Custom Test" tab next to the problem description.
2. Student enters custom input.
3. Code runs and output is displayed.
4. No grading — just execution feedback.

This is already partially supported by the `/api/compile` route (it handles `stdin`), but the UI doesn't expose it.

---

## 3. Submission & Grading Improvements

### 3.1 Partial Scoring

**Problem:** The current grading is **all-or-nothing**. If a student passes 4 out of 5 test cases, they get **0 marks**. This is unfair and demotivating.

**Fix:** Calculate proportional scores:

```typescript
const score = (passedTests / totalTests) * problem.marks;
// e.g., 4/5 tests passed, 10 marks → score = 8
```

Update the submission route:

```typescript
// CURRENT (all-or-nothing):
score: allTestsPassed ? problem.marks : 0,

// PROPOSED (proportional):
score: Math.round((passedTests / totalTests) * problem.marks),
```

Also update the save logic — currently, submissions are only saved if ALL tests pass. Change this to save regardless of score:

```typescript
// Remove the "if not all tests pass, don't save" logic
// Always save the submission with whatever score was earned
```

---

### 3.2 Test Case Weighting

**Problem:** All test cases carry equal weight. In reality, some test cases are harder (large inputs, edge cases) and should carry more weight.

**Fix:** Add a `weight` field to test cases:

```typescript
interface ITestCase {
    input: string;
    output: string;
    isHidden: boolean;
    weight: number;  // Default 1, harder tests can be 2 or 3
}
```

Score calculation:
```typescript
const totalWeight = testCases.reduce((sum, tc) => sum + tc.weight, 0);
const earnedWeight = testResults.filter(r => r.passed).reduce((sum, r) => sum + testCases[r.testCaseIndex].weight, 0);
const score = (earnedWeight / totalWeight) * problem.marks;
```

---

### 3.3 Submission Rate Limiting

**Problem:** A student can spam submissions — hundreds per minute. This wastes Piston resources and can be used to brute-force test cases (submit random code until one passes).

**Fix:** Implement rate limiting:

```typescript
// In-memory or Redis-based rate limiting
const MAX_SUBMISSIONS_PER_MINUTE = 5;
const MAX_SUBMISSIONS_PER_HOUR = 20;

// Check before processing
const recentSubmissions = await Submission.countDocuments({
    userId,
    createdAt: { $gte: new Date(Date.now() - 60 * 1000) }, // last 1 minute
});

if (recentSubmissions >= MAX_SUBMISSIONS_PER_MINUTE) {
    return NextResponse.json(
        { success: false, message: "Too many submissions. Please wait before submitting again." },
        { status: 429 },
    );
}
```

For production, use a proper rate limiter like `express-rate-limit` or Redis-based counters.

---

### 3.4 Hidden Test Case Disclosure After Deadline

**Problem:** Students never see the hidden test cases' inputs/outputs — even after the deadline. This means they don't know why they failed.

**Fix:** After the assignment deadline, reveal hidden test case details to students who failed them.

```typescript
// GET /api/student/submissions/:id/results
// After deadline:
if (now > assignment.dueAt) {
    // Reveal all test case details (including hidden)
    testResults = submission.testResults.map(tr => ({
        ...tr.toObject(),
        hiddenTestCaseInput: problem.testCases[tr.testCaseIndex].input,
        hiddenTestCaseOutput: problem.testCases[tr.testCaseIndex].output,
    }));
}
```

This is a **learning opportunity** — students can understand what edge cases they missed.

---

### 3.5 Code Execution Timeout Feedback

**Problem:** When code exceeds the 3-second Piston timeout, the error message is generic ("Execution failed"). Students don't know if it was a timeout, memory limit, or runtime error.

**Fix:** Parse Piston's response more carefully and provide specific feedback:

```typescript
if (result.run?.signal === "SIGKILL" || result.run?.time >= 3000) {
    return {
        success: false,
        message: "⏱️ Time Limit Exceeded — Your code took more than 3 seconds. Optimize your algorithm.",
    };
}

if (result.run?.memory >= 128000000) {
    return {
        success: false,
        message: "💾 Memory Limit Exceeded — Your code used more than 128MB. Check for memory leaks or large data structures.",
    };
}

if (result.run?.code === 137) {
    return {
        success: false,
        message: "🚫 Process Killed (Exit Code 137) — Likely caused by infinite loop or excessive memory usage.",
    };
}
```

---

## 4. Email & Notification System

### 4.1 Email Types Needed

Currently, only **welcome emails** are implemented. A production-grade platform needs:

| Email | Trigger | Recipient | Priority |
|-------|---------|-----------|----------|
| Welcome email | Admin creates user | New user | ✅ Done |
| Assignment published | `publishAt` reached | All students | **HIGH** |
| Deadline reminder (24h) | 24h before `dueAt` | All students | **HIGH** |
| Deadline reminder (1h) | 1h before `dueAt` | Students who haven't submitted | **HIGH** |
| Submission graded | Submission evaluated | Student | **MEDIUM** |
| Score published | Admin releases scores | Student | **MEDIUM** |
| Deadline passed (no submission) | After `dueAt` | Non-submitters | **MEDIUM** |
| Announcement (urgent) | Admin creates urgent announcement | All students | **HIGH** |
| Password reset | User requests reset | User | **LOW** |
| Daily admin digest | Daily scheduled | All admins | **LOW** |
| Piston down alert | Health check fails | All admins | **HIGH** |

### 4.2 Email Template System

**Problem:** The current email system has only one template (welcome email). Each new email type requires a new function and HTML template.

**Fix:** Create a template registry:

```typescript
// src/lib/email-templates/registry.ts
export const emailTemplates = {
    "welcome": generateWelcomeEmailHTML,
    "assignment-published": generateAssignmentPublishedHTML,
    "deadline-reminder": generateDeadlineReminderHTML,
    "submission-graded": generateSubmissionGradedHTML,
    "urgent-announcement": generateUrgentAnnouncementHTML,
    "daily-digest": generateDailyDigestHTML,
};

// Generic send function
export async function sendTemplatedEmail(params: {
    template: keyof typeof emailTemplates;
    to: string;
    subject: string;
    data: Record<string, any>;
}) {
    const html = emailTemplates[params.template](params.data);
    return await resend.emails.send({
        from: `Algo-Grade <${fromEmail}>`,
        to: [params.to],
        subject: params.subject,
        html,
    });
}
```

### 4.3 Email Delivery Tracking & Retry

**Problem:** The `EmailLog` model exists but is only used for welcome emails. If an email fails, there's no automatic retry.

**Fix:** Use Inngest's built-in retry mechanism for email jobs. Inngest automatically retries failed steps with exponential backoff.

```typescript
export const sendEmailJob = inngest.createFunction(
    {
        id: "send-email",
        retries: 3,  // Automatic retries
    },
    async ({ event, step }) => {
        const result = await step.run("send", async () => {
            return await sendTemplatedEmail(event.data);
        });

        // Log result
        await step.run("log", async () => {
            await EmailLog.create({
                to: event.data.to,
                subject: event.data.subject,
                type: event.data.template,
                status: result.success ? "sent" : "failed",
                sentAt: result.success ? new Date() : undefined,
            });
        });
    },
);
```

---

## 5. Security & Data Integrity

### 5.1 API Route Authorization Gaps

**Problem:** Several API routes have **no authorization checks**:

| Route | Issue |
|-------|-------|
| `POST /api/student/submissions` | No check that `userId` matches the authenticated user. Any logged-in user can submit on behalf of another. |
| `GET /api/student/submissions` | No check that `userId` matches the authenticated user. Any user can view another's submissions. |
| `POST /api/compile` | No authentication required. Anyone can use your Piston instance for arbitrary code execution. |
| `GET /api/admin/dashboard` | Listed as public in `proxy.ts` — accessible without authentication. |

**Fix:** Add authentication and ownership checks to every route:

```typescript
export async function POST(req: Request) {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
        return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const dbUser = await User.findOne({ clerkId: clerkUserId });
    if (!dbUser) {
        return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    // Ensure user can only submit for themselves
    if (body.userId !== dbUser._id.toString()) {
        return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    // ... rest of the logic ...
}
```

### 5.2 Input Validation with Zod

**Problem:** Most API routes do manual validation (`if (!field) return error`). This is error-prone and inconsistent.

**Fix:** Use Zod schemas for all request bodies:

```typescript
import { z } from "zod";

const submissionSchema = z.object({
    assignmentId: z.string().min(1, "Assignment ID is required"),
    problemId: z.string().min(1, "Problem ID is required"),
    code: z.string().min(1, "Code is required").max(50000, "Code too long"),
    language: z.enum(["cpp", "java", "python", "javascript"]),
});

export async function POST(req: Request) {
    const body = await req.json();
    const parsed = submissionSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json(
            { success: false, message: "Validation failed", errors: parsed.error.format() },
            { status: 400 },
        );
    }

    // ... use parsed.data ...
}
```

### 5.3 MongoDB Injection Prevention

**Problem:** Some routes use user input directly in MongoDB queries without sanitization.

**Example risk:**
```typescript
const user = await User.findOne({ clerkId: userId });
```

If `userId` is somehow manipulated, this could be exploited.

**Fix:** Always validate and sanitize inputs before using them in database queries. Use Zod for type validation and explicitly cast to expected types.

### 5.4 Sensitive Data Exposure in API Responses

**Problem:** Submission responses include the full `code` field, test case inputs, and expected outputs. A student could potentially intercept another student's submission response and see their code.

**Fix:**
1. Never include `code` in list/fetch responses — only in the student's own submission detail.
2. Never include hidden test case `input`/`output` in responses before the deadline.
3. Use response DTOs (Data Transfer Objects) to control what's sent to the client:

```typescript
// Instead of returning the raw MongoDB document:
return NextResponse.json({ submission });

// Return a sanitized version:
return NextResponse.json({
    submission: {
        id: submission._id,
        problemTitle: submission.problemId.title,
        score: submission.score,
        status: submission.status,
        submittedAt: submission.submittedAt,
        // NO code field
        // NO hidden test case details
    },
});
```

### 5.5 CSRF Protection

**Problem:** Next.js API routes are vulnerable to CSRF attacks if the app uses cookie-based authentication (Clerk uses cookies for sessions).

**Fix:** Add CSRF token validation for state-changing requests (POST, PUT, DELETE). Clerk provides CSRF protection for its own routes, but your custom API routes need their own protection.

For a Next.js app with Clerk, the simplest approach is to use **SameSite cookie attributes** (Clerk handles this) and verify the `Origin` header on sensitive requests:

```typescript
const origin = req.headers.get("origin");
const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL;
if (origin && origin !== allowedOrigin) {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
}
```

---

## 6. Performance & Scalability

### 6.1 MongoDB Connection Pooling

**Problem:** The `connectDB()` function is called in every API route. If it creates a new connection each time, the MongoDB connection pool will be exhausted under load.

**Current state:** Check `src/lib/db.ts` — it likely uses the standard Mongoose pattern of caching the connection:

```typescript
// Typical pattern (verify this is what you have):
let cached = global.mongoose;
if (!cached) cached = global.mongoose = { conn: null, promise: null };

export async function connectDB() {
    if (cached.conn) return cached.conn;
    // ... create connection ...
}
```

**If this pattern is NOT implemented**, fix it immediately. Without connection caching, every API request creates a new MongoDB connection, which will crash the database under load.

### 6.2 Database Indexing

**Problem:** Only a few indexes are defined. As data grows, queries will become slow.

**Missing indexes:**

```typescript
// Submission model — add these:
SubmissionSchema.index({ userId: 1, assignmentId: 1 });       // Fetch submissions by user + assignment
SubmissionSchema.index({ assignmentId: 1, problemId: 1 });     // Leaderboard queries
SubmissionSchema.index({ userId: 1, problemId: 1 });           // Check if user submitted for a problem
SubmissionSchema.index({ createdAt: -1 });                     // Recent submissions

// Assignment model:
AssignmentSchema.index({ publishAt: 1, dueAt: 1 });            // Find active assignments
AssignmentSchema.index({ dueAt: 1 });                          // Upcoming deadlines

// User model:
UserSchema.index({ role: 1 });                                 // Fetch all students or all admins
UserSchema.index({ clerkId: 1 });                              // Already unique (good)
```

### 6.3 API Response Caching

**Problem:** The admin dashboard fetches `Problem.find()`, `Assignment.find()`, and `Submission.find()` on every page load. These are expensive queries that don't change frequently.

**Fix:** Use Next.js `revalidate` or in-memory caching:

```typescript
// Using Next.js revalidation (for server components):
export const revalidate = 60; // Cache for 60 seconds

// Or in-memory caching for API routes:
const cache = new Map();
const CACHE_TTL = 60 * 1000; // 60 seconds

export async function GET() {
    const cached = cache.get("dashboard-stats");
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return NextResponse.json(cached.data);
    }

    const data = await computeDashboardStats();
    cache.set("dashboard-stats", { data, timestamp: Date.now() });
    return NextResponse.json(data);
}
```

### 6.4 Piston Sequential Execution → Parallel

**Problem:** `runTestCases()` in `src/lib/piston.ts` runs test cases **sequentially** in a `for` loop:

```typescript
for (let i = 0; i < testCases.length; i++) {
    const execution = await executeCode(code, language, testCase.input);
    // ...
}
```

For 10 test cases at 3 seconds each, this is **30 seconds** of blocking.

**Fix:** Run test cases in parallel with a concurrency limit:

```typescript
import pLimit from "p-limit";

export async function runTestCasesParallel(code: string, language: string, testCases: TestCase[]) {
    const limit = pLimit(3); // Max 3 concurrent executions

    const results = await Promise.all(
        testCases.map((tc, i) =>
            limit(async () => {
                const execution = await executeCode(code, language, tc.input);
                // ... process result ...
                return { testCaseIndex: i, passed, ... };
            }),
        ),
    );

    return results;
}
```

This reduces 10 test cases from 30 seconds to ~10 seconds (3 at a time).

**Caution:** Piston has its own resource limits. Don't overload it — 3 concurrent executions is a safe starting point.

### 6.5 N+1 Query Problem

**Problem:** The submissions GET route uses `.populate()`:

```typescript
const submissions = await Submission.find({ userId })
    .populate("assignmentId")
    .populate("problemId");
```

If there are 100 submissions, this triggers 201 queries (1 for submissions + 100 for assignmentId + 100 for problemId).

**Fix:** Use MongoDB aggregation with `$lookup` instead:

```typescript
const submissions = await Submission.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    { $lookup: { from: "assignments", localField: "assignmentId", foreignField: "_id", as: "assignment" } },
    { $lookup: { from: "problems", localField: "problemId", foreignField: "_id", as: "problem" } },
    { $unwind: "$assignment" },
    { $unwind: "$problem" },
    { $sort: { createdAt: -1 } },
]);
```

This is a single query with joins, much faster than N+1.

---

## 7. User Experience & Polish

### 7.1 Assignment Visibility Before Publish Date

**Problem:** Students can't see upcoming assignments. They have no way to prepare in advance.

**Fix:** Show assignments with a "Publishes in X days" label before `publishAt`. Students can see the title and description but can't submit until published.

### 7.2 Real-Time Submission Status

**Problem:** After submitting code, the student waits 15-30 seconds with a loading spinner. There's no progress indication.

**Fix (without Inngest):** Show step-by-step progress:
```
⏳ Compiling your code...
✅ Compilation successful
⏳ Running test case 1/5...
✅ Test case 1 passed
⏳ Running test case 2/5...
...
```

**Fix (with Inngest async grading):** Use Server-Sent Events (SSE) or polling to update the UI as the background job progresses.

### 7.3 Code Auto-Save / Draft Recovery

**Problem:** If a student's browser crashes or they accidentally close the tab, their code is lost.

**Fix:** Auto-save code to `localStorage` every 30 seconds:

```typescript
useEffect(() => {
    const interval = setInterval(() => {
        localStorage.setItem(`draft-${problemId}-${userId}`, code);
    }, 30000);
    return () => clearInterval(interval);
}, [code, problemId, userId]);

// On page load, check for draft:
const draft = localStorage.getItem(`draft-${problemId}-${userId}`);
if (draft) {
    // Show "You have unsaved draft. Restore?" dialog
}
```

### 7.4 Keyboard Shortcuts

**Problem:** No keyboard shortcuts for common actions.

**Fix:**
- `Ctrl+S` / `Cmd+S` — Save/Submit code
- `Ctrl+Enter` — Run code (custom test)
- `Ctrl+/` — Toggle comment
- `Ctrl+Z` / `Ctrl+Y` — Undo/Redo (CodeMirror handles this)

### 7.5 Mobile Responsiveness Audit

**Problem:** The code editor (CodeMirror) and admin dashboards are likely not optimized for mobile.

**Fix:** Test all pages on mobile viewport (375px width). Key areas:
- Code editor should be full-width on mobile.
- Admin tables should be horizontally scrollable or convert to card layout.
- Sidebar should collapse to a hamburger menu.

### 7.6 Accessibility (a11y)

**Problem:** No explicit accessibility considerations.

**Fix:**
- All interactive elements should be keyboard-navigable.
- Color contrast ratios should meet WCAG AA standards.
- Form inputs should have associated `<label>` elements.
- Loading states should use `aria-busy` and `aria-live` attributes.
- Toast notifications should use `role="alert"`.

---

## 8. Testing & Observability

### 8.1 No Tests

**Problem:** Zero unit tests, integration tests, or end-to-end tests.

**Recommended testing strategy:**

| Test Type | Tool | What to Test |
|-----------|------|-------------|
| Unit | Jest / Vitest | Utility functions (`normalizeOutput`, `calculateScore`, `formatRelativeTime`) |
| API | Supertest | All API routes (auth, validation, CRUD operations) |
| Integration | Jest + MongoDB Memory Server | Submission flow (create problem → submit code → grade → save) |
| E2E | Playwright | Student journey (login → view assignment → write code → submit → see results) |

**Priority tests (write these first):**
1. Submission API — validates input, runs Piston, saves result.
2. Deadline check — rejects submissions after `dueAt`.
3. Role-based access — students can't access admin routes.
4. Score calculation — proportional scoring logic.

### 8.2 Error Tracking

**Problem:** Errors are logged to console but not tracked or alerted on.

**Fix:** Integrate an error tracking service:

| Service | Cost | Setup |
|---------|------|-------|
| **Sentry** | Free tier (5,000 errors/mo) | `npm install @sentry/nextjs` |
| **LogRocket** | Free tier | Session replay + errors |
| **Better Stack** | Free tier | Log aggregation + alerts |

**Sentry integration (recommended):**
```typescript
// src/app/api/student/submissions/route.ts
import * as Sentry from "@sentry/nextjs";

export async function POST(req: Request) {
    try {
        // ... logic ...
    } catch (error) {
        Sentry.captureException(error, {
            tags: { route: "submission-create" },
            user: { id: userId },
        });
        return NextResponse.json({ success: false, message: "Internal error" }, { status: 500 });
    }
}
```

### 8.3 Request Logging

**Problem:** No structured logging for API requests.

**Fix:** Add middleware-level logging:

```typescript
// In proxy.ts or a separate middleware:
export default clerkMiddleware(async (auth, req) => {
    const start = Date.now();

    // ... existing logic ...

    const duration = Date.now() - start;
    console.log(JSON.stringify({
        method: req.method,
        path: req.nextUrl.pathname,
        status: response.status,
        durationMs: duration,
        userId: userId || "anonymous",
    }));
});
```

For production, use a structured logging library like `pino`:

```bash
npm install pino pino-pretty
```

### 8.4 API Response Time Monitoring

**Problem:** No visibility into which endpoints are slow.

**Fix:** Track response times and log slow endpoints:

```typescript
const SLOW_THRESHOLD_MS = 1000;

if (duration > SLOW_THRESHOLD_MS) {
    console.warn(`[SLOW REQUEST] ${req.method} ${req.nextUrl.pathname} took ${duration}ms`);
}
```

### 8.5 Health Check Enhancement

**Problem:** The `/api/health` endpoint only reports basic Node.js metrics. It doesn't check:
- MongoDB connectivity.
- Piston API availability.
- Clerk connectivity.

**Fix:**

```typescript
export async function GET() {
    const checks = {
        mongodb: false,
        piston: false,
        clerk: false,
    };

    // Check MongoDB
    try {
        await connectDB();
        await mongoose.connection.db.admin().ping();
        checks.mongodb = true;
    } catch {
        checks.mongodb = false;
    }

    // Check Piston
    try {
        const response = await fetch(`${PISTON_API}/runtimes`, { method: "GET" });
        checks.piston = response.ok;
    } catch {
        checks.piston = false;
    }

    const allHealthy = Object.values(checks).every(Boolean);

    return NextResponse.json(
        {
            status: allHealthy ? "healthy" : "degraded",
            checks,
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
        },
        { status: allHealthy ? 200 : 503 },
    );
}
```

---

## Priority Matrix

### Critical (Do First)
| # | Improvement | Effort | Impact |
|---|------------|--------|--------|
| 1.1 | Register Inngest functions (fix empty array) | 5 min | **BREAKING FIX** |
| 5.1 | Add authorization checks to all API routes | 2 hours | Security |
| 3.1 | Implement partial scoring | 30 min | Fairness |
| 3.3 | Add submission rate limiting | 1 hour | Resource protection |
| 1.5 | Async submission grading via Inngest | 4 hours | Scalability |

### High Priority
| # | Improvement | Effort | Impact |
|---|------------|--------|--------|
| 1.2 | Deadline reminder emails | 2 hours | Student experience |
| 1.3 | Auto-publish assignment + notify | 2 hours | Automation |
| 1.10 | Auto-close assignment + notify non-submitters | 2 hours | Automation |
| 1.9 | Piston health check | 1 hour | Reliability |
| 2.1 | Submission history (don't delete on re-submit) | 2 hours | Data integrity |
| 5.2 | Zod validation for all API routes | 3 hours | Reliability |
| 6.4 | Parallel test case execution | 2 hours | Performance |
| 8.5 | Enhanced health check (MongoDB + Piston) | 30 min | Observability |

### Medium Priority
| # | Improvement | Effort | Impact |
|---|------------|--------|--------|
| 1.4 | Auto-expire announcements | 1 hour | Automation |
| 1.6 | Welcome email via Inngest | 1 hour | Reliability |
| 2.2 | Leaderboard | 3 hours | Engagement |
| 2.5 | Late submission policy | 3 hours | Flexibility |
| 3.2 | Test case weighting | 2 hours | Fairness |
| 3.4 | Reveal hidden test cases after deadline | 1 hour | Learning |
| 3.5 | Better timeout/error feedback | 1 hour | UX |
| 4.2 | Email template registry | 2 hours | Maintainability |
| 6.2 | Database indexing | 1 hour | Performance |
| 7.3 | Code auto-save / draft recovery | 1 hour | UX |

### Low Priority (Nice to Have)
| # | Improvement | Effort | Impact |
|---|------------|--------|--------|
| 1.7 | Daily admin digest | 2 hours | Nice to have |
| 1.8 | Auto-clean old submissions | 1 hour | Maintenance |
| 2.3 | Code diff view | 3 hours | Learning |
| 2.4 | Plagiarism detection | 8+ hours | Academic integrity |
| 2.6 | Problem categories/tags UI | 4 hours | Organization |
| 2.7 | Custom test cases UI | 2 hours | Learning |
| 6.3 | API response caching | 2 hours | Performance |
| 6.5 | Fix N+1 queries | 2 hours | Performance |
| 7.1 | Show upcoming assignments | 1 hour | UX |
| 7.2 | Real-time submission progress | 3 hours | UX |
| 7.4 | Keyboard shortcuts | 2 hours | UX |
| 7.5 | Mobile responsiveness | 4 hours | Accessibility |
| 7.6 | Accessibility (a11y) | 4 hours | Compliance |
| 8.1 | Unit/API tests | 8+ hours | Quality |
| 8.2 | Sentry error tracking | 1 hour | Observability |
| 8.3 | Request logging | 1 hour | Observability |

---

## Implementation Roadmap

### Phase 1: Critical Fixes (Week 1)
- [ ] Fix Inngest function registration (1.1)
- [ ] Add authorization to all API routes (5.1)
- [ ] Implement partial scoring (3.1)
- [ ] Add rate limiting (3.3)
- [ ] Enhance health check endpoint (8.5)

### Phase 2: Inngest Jobs (Week 2)
- [ ] Deadline reminder emails (1.2)
- [ ] Auto-publish assignment (1.3)
- [ ] Auto-close assignment (1.10)
- [ ] Piston health check (1.9)
- [ ] Async submission grading (1.5)

### Phase 3: Data & Performance (Week 3)
- [ ] Submission history (2.1)
- [ ] Zod validation (5.2)
- [ ] Parallel test execution (6.4)
- [ ] Database indexing (6.2)
- [ ] Fix N+1 queries (6.5)

### Phase 4: Features & UX (Week 4)
- [ ] Leaderboard (2.2)
- [ ] Late submission policy (2.5)
- [ ] Hidden test case disclosure (3.4)
- [ ] Better error feedback (3.5)
- [ ] Code auto-save (7.3)
- [ ] Email template registry (4.2)

### Phase 5: Polish & Testing (Week 5+)
- [ ] Sentry integration (8.2)
- [ ] Request logging (8.3)
- [ ] Write critical tests (8.1)
- [ ] Mobile responsiveness (7.5)
- [ ] Accessibility audit (7.6)
- [ ] Plagiarism detection MVP (2.4)

---

## Conclusion

The Algo-Grade DAA Portal has a **strong foundation** but needs **critical fixes** before it can handle a live course:

1. **Fix the Inngest registration** — without this, zero background jobs run.
2. **Secure all API routes** — currently, any authenticated user can access any other user's data.
3. **Implement partial scoring** — all-or-nothing grading is unfair.
4. **Add rate limiting** — prevent resource abuse.
5. **Move submission grading to Inngest** — synchronous grading will fail under peak load.

After these critical fixes, the Inngest jobs for deadline reminders, auto-publish, auto-close, and health checks will transform this from a manual tool into an **automated, self-managing platform** that requires minimal admin intervention.
