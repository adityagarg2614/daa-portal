# Safe Exam Browser (SEB) — Complete Integration Guide

> **Read this before touching any SEB-related code.**  
> This document explains everything: what was built, why it was built that way, what the keys mean, and exactly how a student interacts with the system.

---

## Table of Contents

1. [What is Safe Exam Browser?](#1-what-is-safe-exam-browser)
2. [How SEB Integration Works in This App](#2-how-seb-integration-works-in-this-app)
3. [Verification Strategy — The Key Decision](#3-verification-strategy--the-key-decision)
4. [What Are the Keys? (Config Key & Browser Exam Key)](#4-what-are-the-keys-config-key--browser-exam-key)
5. [Files Changed & What They Do](#5-files-changed--what-they-do)
6. [Admin Flow — How to Create a SEB Assignment](#6-admin-flow--how-to-create-a-seb-assignment)
7. [Student Flow — Step by Step](#7-student-flow--step-by-step)
8. [Common Errors & What They Mean](#8-common-errors--what-they-mean)
9. [Running the App (Dev vs Docker)](#9-running-the-app-dev-vs-docker)

---

## 1. What is Safe Exam Browser?

Safe Exam Browser (SEB) is a locked-down web browser used in academic exams. When a student opens SEB:

- They **cannot** switch to other apps
- They **cannot** open new tabs or other websites
- They **cannot** copy-paste (unless allowed)
- Every HTTP request SEB makes includes **special security headers** that prove the request is coming from SEB specifically

Those special headers are:
| Header | Description |
|---|---|
| `X-SafeExamBrowser-ConfigKeyHash` | A hash computed from the `.seb` config file settings + the **current page URL** |
| `X-SafeExamBrowser-BrowserExamKeyHash` | A hash computed only from the `.seb` config file settings (URL-independent) |
| `User-Agent` | Always contains the string `SEB/` followed by a version number |

---

## 2. How SEB Integration Works in This App

When a student opens an assignment, the browser calls:
```
GET /api/student/assignments/:id
```

This route checks:
1. Is the assignment SEB-protected (`isSebRequired: true`)?
2. If yes → run `verifySebSession()` from `src/lib/seb.ts`
3. If verification fails → return 403 with an error code
4. If verification passes → check if an `ExamAttempt` record exists for the student
5. If no attempt → return 403 with `ATTEMPT_REQUIRED` error
6. If attempt exists and is not submitted → mark as started and return the assignment data

---

## 3. Verification Strategy — The Key Decision

### ❌ The Old (Broken) Approach
The original code matched the `ConfigKeyHash` header against a stored value in the database.

**Why this always broke:**  
The Config Key is computed as:  
```
SHA256(seb_config_file_contents + current_page_URL)
```
So the key for `localhost:3000/home` is **completely different** from the key for `localhost:3000/assignment/abc123`.  
Every assignment has a unique URL → every Config Key is different → it could never be matched reliably.

### ✅ The New (Correct) Approach — User-Agent Verification

**Primary check (always runs):** Does the `User-Agent` header contain `SEB/`?  
- Normal Chrome/Firefox/Safari → `User-Agent` does **not** contain `SEB/` → **BLOCKED** ✅  
- Safe Exam Browser → `User-Agent` always contains e.g. `SEB/3.6.1` → **ALLOWED** ✅

This check is:
- **URL-independent** — works for any assignment URL
- **Stable** — never changes between sessions
- **Unfakeable** by students in a real deployment (SEB locks the browser)

**Secondary check (optional, only if keys are filled in):** If the admin has stored a `sebConfigKey` or `sebBrowserExamKey` on the assignment, they are also matched. This is for extra security if you want to lock an assignment to a specific `.seb` configuration file.  
**For normal use, leave both key fields empty.**

---

## 4. What Are the Keys? (Config Key & Browser Exam Key)

### Config Key (`sebConfigKey`)
- **What it is:** A hash of `(your .seb file settings) + (the assignment URL)`
- **How to get it:** Open SEB → press `Cmd+,` → look in the dialog → copy the displayed hash
- **Problem:** The key shown in the dialog is for the **Start URL** you configured (e.g. `/home`). When the student navigates to `/assignment/abc123`, SEB computes a **different** hash for that URL.
- **Conclusion:** ⚠️ Almost never use this. It only works if your assignment URL exactly matches the Start URL in the `.seb` config.

### Browser Exam Key (`sebBrowserExamKey`)
- **What it is:** A hash of only your `.seb` file settings, **without the URL**
- **How to get it:** You must configure your `.seb` file to send this header (enable "Send Browser Exam Key" in the SEB configuration tool), then read it from server logs
- **Advantage:** URL-independent — the same key works for any assignment URL
- **Problem:** Many SEB versions don't send this header by default (it arrives as `null`)

### 🎯 Recommendation
**Leave both fields empty for all assignments.** The User-Agent check is sufficient and always works. The key fields only exist for advanced scenarios (e.g., institutional deployments with a specific `.seb` file distributed to all students).

---

## 5. Files Changed & What They Do

### `src/lib/seb.ts` — Core Verification Logic
The heart of the integration. The `verifySebSession()` function:
1. Reads SEB headers from the incoming request
2. Checks if User-Agent contains `SEB/`
3. If `sebConfigKey` or `sebBrowserExamKey` are set on the assignment, validates them too
4. Checks if an `ExamAttempt` record exists for the student
5. Marks the attempt as "started" if it was in "pending" state

### `src/models/Assignment.ts` — Database Schema
Added two optional fields:
```ts
sebConfigKey?: string;      // Optional: lock to specific .seb config
sebBrowserExamKey?: string; // Optional: lock to specific .seb file (URL-independent)
```

### `src/app/api/student/assignments/[id]/route.ts` — Student Assignment API
- After fetching the assignment, calls `verifySebSession()` if `isSebRequired` is true
- Returns descriptive error codes (`SEB_REQUIRED`, `ATTEMPT_REQUIRED`, `INVALID_CONFIG`, `ALREADY_SUBMITTED`)

### `src/app/api/student/submissions/by-assignment/[assignmentId]/route.ts` — Submissions API
Fixed a critical bug: previously required `?userId=` as a query parameter, which the frontend never sent (causing 400 errors that silently broke the assignment page). Now uses Clerk server-side auth to resolve the user automatically.

### `src/app/api/admin/assignments/route.ts` — Create Assignment API  
Accepts `isSebRequired`, `sebConfigKey`, and `sebBrowserExamKey` when creating assignments.

### `src/app/api/admin/assignments/[id]/route.ts` — Update Assignment API  
Same fields available when patching/editing an existing assignment.

### `src/app/(dashboardAdmin)/admin/assignments/create/page.tsx` — Admin UI
Added fields for:
- **SEB Required toggle** — enables SEB protection for the assignment
- **Config Key** field (optional, leave empty)
- **Browser Exam Key** field (optional, leave empty)

---

## 6. Admin Flow — How to Create a SEB Assignment

1. Go to **Admin → Assignments → Create Assignment**
2. Fill in title, description, problems, publish date, due date as normal
3. Toggle **"SEB Required"** to **ON**
4. Leave **Config Key** and **Browser Exam Key** fields **empty**
5. Click **Create**

That's it. The assignment is now SEB-protected via User-Agent verification.

> **Do NOT paste keys into those fields unless you have a specific reason to.**  
> If you paste an incorrect key, students will be blocked even in SEB.

---

## 7. Student Flow — Step by Step

Here is the complete journey a student takes to access and submit a SEB assignment.

### Phase 1: Before SEB (Normal Browser)

```
Student opens normal browser → logs in → goes to /assignment
→ Sees the SEB-protected assignment listed
→ Clicks on it
→ Sees "Secure Exam Access Required" screen
→ Sees a green "Start Exam Attempt Now" button
→ Clicks that button
```

**What "Start Exam Attempt Now" does:**
- Calls `POST /api/student/exam/start/:assignmentId`
- Creates an `ExamAttempt` record in the database with `status: "pending"`
- This record must exist before SEB can grant access

> ⚠️ This step is **mandatory**. If the student skips it and opens SEB directly, they will be blocked even if SEB verification passes, because there's no `ExamAttempt` record.

### Phase 2: In SEB

```
Student opens Safe Exam Browser
→ Enters the URL: http://your-domain.com/assignment/:assignmentId
→ SEB sends request with User-Agent containing "SEB/3.x.x"
→ Server checks: User-Agent contains "SEB/"? → YES ✅
→ Server checks: ExamAttempt exists? → YES ✅ (created in Phase 1)
→ Server marks attempt as "started"
→ Assignment loads with all problems ✅
```

### Phase 3: Working on the Assignment

```
Student sees all problems in SEB
→ Writes code in the editor
→ Can click "Run Code" to test against examples
→ Can click "Submit" per problem to save their code
→ When done → clicks "Submit Assignment"
→ All submissions are finalized
→ Status of ExamAttempt updates to "submitted"
→ Student sees "Submission Complete" screen
→ SEB can be closed
```

### Phase 4: After Submission

```
If student opens the assignment again (in SEB or normal browser):
→ Server finds ExamAttempt with status: "submitted"
→ Returns 403 with errorCode: "ALREADY_SUBMITTED"
→ Student sees the "Submission Complete" screen with their submission timestamp
→ Cannot edit or resubmit ✅
```

---

## 8. Common Errors & What They Mean

| Error Code | Message Shown | Cause | Fix |
|---|---|---|---|
| `SEB_REQUIRED` | "Safe Exam Browser is required" | Request came from a non-SEB browser (Chrome, Firefox, etc.) | Open in SEB |
| `ATTEMPT_REQUIRED` | "No active exam attempt found. Please start via the portal." | Student hasn't clicked "Start Exam Attempt Now" yet | Go to assignment in normal browser, click the green button first |
| `INVALID_CONFIG` | "Invalid SEB configuration file" | Admin stored a Key in the assignment, but SEB is sending a different one | Edit assignment in Admin panel → clear both key fields |
| `ALREADY_SUBMITTED` | "Submission Complete" | Student already submitted | This is correct — shows the success screen |

---

## 9. Running the App (Dev vs Docker)

### Local Development (`npm run dev`)
- Uses your **Atlas cloud MongoDB** (set in `.env.local`)
- All assignments created before are available
- Code changes take effect instantly (hot reload)
- **Use this when: developing, testing SEB, debugging**

```bash
npm run dev
```

### Docker (`make up`)
- Uses a **fresh local MongoDB** (empty on first start)
- Any code change requires a full rebuild (~2 min)
- Data is stored in a Docker volume (persists between restarts, but separate from Atlas)
- **Use this when: testing production-like deployment, sharing with others on a server**

```bash
make up      # build and start all containers
make down    # stop all containers
```

> ⚠️ If you run `make up` after developing locally, your Atlas assignments won't be there. You'll need to create new assignments through the Admin panel in Docker.

---

## Quick Reference

```
Is SEB toggle ON + Keys are EMPTY   → Verified by User-Agent only (RECOMMENDED)
Is SEB toggle ON + Keys are FILLED  → Verified by User-Agent AND specific key match
Is SEB toggle OFF                   → No SEB check, anyone can access
```

```
Student Flow:
1. Normal browser → assignment page → click "Start Exam Attempt Now"
2. Open SEB → navigate to same assignment URL → loads directly
3. Write code → submit → see success screen → close SEB
```
