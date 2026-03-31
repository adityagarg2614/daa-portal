# Admin Authentication Setup Plan

## 📋 Overview

Set up a system to create admin users with any email domain (not restricted to college domain) and handle their onboarding flow differently from students. Admins should bypass the roll number requirement and be redirected directly to the admin dashboard.

---

## 🎯 Objectives

1. **Create Admin User**: Add a way to create admin users in the database with any email
2. **Skip Onboarding for Admins**: Admins should not see the roll number onboarding page
3. **Proper Redirects**: 
   - Admin → Redirect to `/admin` dashboard
   - Student → Redirect to `/onboarding` → then `/home`
4. **Clerk Metadata**: Store role properly in Clerk's public metadata
5. **Route Protection**: Ensure only admins can access `/admin/*` routes

---

## 🔍 Current Flow Analysis

### Student Flow (Current):
```
Login → Clerk Auth → Check DB → No user found → /onboarding 
→ Enter Roll No → Update DB + Clerk metadata → /home
```

### Admin Flow (Required):
```
Login → Clerk Auth → Check DB → Admin exists → /admin
Login → Clerk Auth → Check DB → No user found → Create as Admin → /admin
```

---

## 🗂️ Implementation Plan

### Phase 1: Database Seed Script / API Endpoint

**Option A: Seed Script (One-time setup)**
- Create a script to add admin user to MongoDB directly
- Run via `npm run seed:admin`
- Manual process, requires database access

**Option B: API Endpoint (Recommended)**
- Create `POST /api/admin/create-admin` endpoint
- Protected by environment variable secret
- Can be called from a simple admin page or curl command
- More flexible for adding multiple admins

**Recommendation**: Use **Option B** for flexibility

### Phase 2: Update Onboarding Logic

**File**: `src/app/onboarding/page.tsx`

Current behavior:
- Shows roll number input for all users
- Saves to DB with role "student" by default

Required changes:
- Check if user should be admin (based on email or pre-created DB entry)
- If admin, skip roll number requirement
- Redirect admin directly to `/admin`

### Phase 3: Update Onboarding Complete API

**File**: `src/app/api/onboarding/complete/route.ts`

Current behavior:
- Creates user with role "student"
- Requires roll number

Required changes:
- Check if admin email exists in pre-approved list
- If admin, create with role "admin" and skip roll number validation
- Update Clerk metadata with correct role

### Phase 4: Update Route Protection

**File**: `src/app/(dashboardAdmin)/layout.tsx`

Current behavior:
- Lines commented out for testing

Required changes:
- Uncomment admin role check
- Ensure proper redirect if non-admin tries to access

**File**: `src/app/(dashboard)/layout.tsx`

Required changes:
- Ensure students can't access admin routes
- Ensure admins can't access student routes (optional)

### Phase 5: Clerk Metadata Handling

**File**: `types/globals.d.ts` (already exists)

Ensure metadata includes:
```typescript
{
  onboardingComplete: boolean;
  rollNo?: string;
  role: "admin" | "student";
  name?: string;
}
```

---

## 📊 Detailed Implementation Steps

### Step 1: Create Admin Creation API

**File**: `src/app/api/admin/setup/route.ts`

```typescript
POST /api/admin/setup
Body: { email: string, name: string }
Secret: Check ADMIN_SETUP_SECRET env variable

Actions:
1. Verify secret key
2. Check if user exists in Clerk by email
3. Create/update user in DB with role: "admin"
4. Update Clerk metadata with role: "admin"
5. Return success
```

### Step 2: Environment Variables

**File**: `.env.local`

```bash
# Admin Setup
ADMIN_SETUP_SECRET="your-secure-secret-key-here"
ADMIN_EMAILS="admin@example.com,admin2@example.com" # Optional: comma-separated list
```

### Step 3: Update Onboarding Page

**File**: `src/app/onboarding/page.tsx`

Changes:
- Add check: Is this email in admin list?
- If admin, show different UI (no roll number required)
- If student, show current roll number form
- On submit, set role accordingly

### Step 4: Update Onboarding Complete API

**File**: `src/app/api/onboarding/complete/route.ts`

Changes:
- Check if email is admin email
- If admin, create user with role "admin", rollNo optional
- If student, create user with role "student", rollNo required
- Update Clerk metadata with correct role

### Step 5: Update Admin Layout Protection

**File**: `src/app/(dashboardAdmin)/layout.tsx`

Uncomment and verify:
```typescript
if (!dbUser || dbUser.role !== "admin") {
  redirect("/"); // or show unauthorized page
}
```

### Step 6: Update Sidebar Navigation

**File**: `src/components/app-sidebar-admin.tsx`

Already handles role-based navigation, verify it's working correctly.

### Step 7: Create Simple Admin Setup Page (Optional)

**File**: `src/app/admin/setup/page.tsx`

A simple page (protected by secret) to create admin users via UI instead of API call.

---

## 🔐 Security Considerations

1. **Admin Setup Secret**: Must be strong and kept secure
2. **Email Validation**: Verify email ownership via Clerk before creating admin
3. **Rate Limiting**: Prevent abuse on admin creation endpoint
4. **Audit Log**: Log when admin users are created (optional)
5. **Environment Variables**: Never commit secrets to git

---

## 📁 Files to Create/Modify

### Create:
- [ ] `src/app/api/admin/setup/route.ts` - Admin creation endpoint
- [ ] `.env.local` - Add ADMIN_SETUP_SECRET

### Modify:
- [ ] `src/app/onboarding/page.tsx` - Handle admin vs student flow
- [ ] `src/app/api/onboarding/complete/route.ts` - Role-based user creation
- [ ] `src/app/(dashboardAdmin)/layout.tsx` - Uncomment protection
- [ ] `src/app/(dashboard)/layout.tsx` - Ensure student protection
- [ ] `src/components/app-sidebar-admin.tsx` - Verify role handling

### Optional:
- [ ] `src/app/admin/setup/page.tsx` - UI for admin creation
- [ ] `scripts/seed-admin.ts` - One-time seed script

---

## 🧪 Testing Strategy

### Test Case 1: Admin Login Flow
1. Create admin user via API
2. Login with admin credentials
3. Verify redirect to `/admin` (not `/onboarding`)
4. Verify admin dashboard loads
5. Verify sidebar shows admin navigation

### Test Case 2: Student Login Flow
1. Login with student credentials
2. Verify redirect to `/onboarding`
3. Enter roll number
4. Verify redirect to `/home`
5. Verify student dashboard loads

### Test Case 3: Unauthorized Access
1. Login as student
2. Try to access `/admin/students`
3. Verify redirect to `/home` or unauthorized page

### Test Case 4: Multi-Browser Testing
1. Browser 1: Login as admin
2. Browser 2: Login as student
3. Verify both sessions work independently
4. Verify admin can see student data

---

## 🚀 Quick Start Guide (For You)

### Immediate Setup (After Plan Approval):

1. **Add to `.env.local`**:
   ```bash
   ADMIN_SETUP_SECRET="change-this-to-a-secure-random-string"
   ```

2. **Create Admin User** (via curl):
   ```bash
   curl -X POST http://localhost:3000/api/admin/setup \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer change-this-to-a-secure-random-string" \
     -d '{"email":"your-email@example.com","name":"Admin User"}'
   ```

3. **Login**:
   - Go to localhost:3000
   - Login with your email
   - Should redirect to `/admin` directly

4. **Student Testing**:
   - Use different browser/incognito
   - Login with student email
   - Goes through normal onboarding flow

---

## ✅ Success Criteria

- [ ] Admin user can be created with any email domain
- [ ] Admin login redirects to `/admin` (skips onboarding)
- [ ] Student login redirects to `/onboarding` → `/home`
- [ ] Admin role is stored in DB and Clerk metadata
- [ ] Admin routes are protected (non-admins can't access)
- [ ] Multi-browser testing works (admin + student simultaneously)
- [ ] No console errors or redirect loops

---

## 📋 Summary

This plan creates a **flexible admin authentication system** that:
- Allows any email domain for admins (not just college)
- Skips onboarding for admins (no roll number needed)
- Maintains separate flows for admin and student
- Properly protects routes based on role
- Supports multi-browser testing

**Estimated Implementation Time**: 2-3 hours

---

**Ready to implement?** Please confirm and I'll proceed with the implementation.
