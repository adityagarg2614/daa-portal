# Admin Authentication Setup - Usage Guide

## ✅ Implementation Complete!

The admin authentication system is now fully set up with **automatic admin detection** and **onboarding bypass**.

---

## 🚀 Quick Start

### Step 1: Restart Your Server

```bash
# Stop the dev server if running
# Then restart to load the new environment variable
npm run dev
```

### Step 2: Create an Admin User

You have **two options**:

#### Option A: Using the UI (Recommended)

1. Go to: `http://localhost:3000/setup-admin`
2. Enter the setup secret: `admin-setup-secret-change-this-in-production`
3. Enter any email (e.g., `your-email@gmail.com`) - **Any domain accepted!**
4. Enter a name (e.g., `Admin User`)
5. Click "Create Admin User"
6. **Sign in with that email**
7. **Auto-redirect to `/admin` dashboard** ✨ (No onboarding!)

#### Option B: Using cURL

```bash
curl -X POST http://localhost:3000/api/admin/setup \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer admin-setup-secret-change-this-in-production" \
  -d '{"email":"your-email@gmail.com","name":"Admin User"}'
```

Then sign in with that email - you'll be redirected to `/admin` automatically.

---

## 🎯 User Flows

### Admin User Flow (NEW - Simplified!):
```
/setup-admin → Create Admin → Sign In → /admin dashboard (INSTANT!)
```
- ✅ **No onboarding page**
- ✅ **No roll number required**
- ✅ **Any email domain accepted**
- ✅ **Direct access to admin dashboard**

### Student User Flow (Unchanged):
```
Login → /onboarding → Enter roll no → /home dashboard
```
- ✅ Roll number required (from college email)
- ✅ College email domain required
- ✅ Access to student routes only

---

## 🔐 Route Protection

### Admin Routes (Protected)
- `/admin/*` - Only admins can access
- Non-admins are redirected to `/home`

### Student Routes (Protected)
- `/home`, `/dashboard`, `/assignment/*`, etc.
- Admins are redirected to `/admin`

### Setup Page (Public with restrictions)
- `/setup-admin` - Accessible without login
- **Students** → Can access page but see "Access Denied" message
- **Admins** → Redirected to `/admin`
- **Not logged in** → Can create admin user

### Middleware Protection
All route protection is handled by `src/proxy.ts` (Clerk middleware):
- Public routes: `/`, `/setup-admin`, `/onboarding`, `/api/admin/setup`
- Protected routes: All other routes require authentication
- **Admins bypass onboarding completely**
- Role-based redirects for admin/student dashboards

---

## 🧪 Multi-Browser Testing

### Browser 1 (Admin):
1. Go to `http://localhost:3000/setup-admin`
2. Create admin with **any email** (e.g., `admin@gmail.com`)
3. Sign in with that email
4. **Auto-redirect to `/admin`** (no onboarding!)
5. Access: `http://localhost:3000/admin/students`
6. View all student data

### Browser 2 (Student):
1. Use **Incognito mode** or different browser
2. Login with student email (e.g., `22bcs010@iiitdmj.ac.in`)
3. Complete onboarding with roll number
4. Access: `http://localhost:3000/home`
5. Try accessing `/setup-admin` → Should see "Access Denied"

---

## 📋 API Endpoints

### Create Admin User
```
POST /api/admin/setup
Headers:
  - Authorization: Bearer <ADMIN_SETUP_SECRET>
Body:
  {
    "email": "admin@example.com",
    "name": "Admin User"
  }

Response (Success):
{
  "message": "Admin user created successfully...",
  "user": {
    "email": "admin@example.com",
    "name": "Admin User",
    "role": "admin"
  },
  "note": "User must sign in with Clerk to complete setup..."
}
```

### Check Setup Status
```
GET /api/admin/setup
Response:
  {
    "configured": true,
    "message": "Admin setup is configured..."
  }
```

---

## 🔧 Environment Variables

```bash
# Already added to .env.local
ADMIN_SETUP_SECRET="admin-setup-secret-change-this-in-production"
```

### ⚠️ Production Security

**Before deploying to production:**

1. **Change the setup secret** to a strong random string:
   ```bash
   ADMIN_SETUP_SECRET="your-super-secret-random-string-here"
   ```

2. **Remove or protect** the `/setup-admin` page:
   - Add authentication
   - Restrict to localhost only
   - Or delete the file entirely

3. **Use environment variables** in production (Vercel, etc.)

---

## 🐛 Troubleshooting

### Issue: Admin redirected to onboarding
- **Solution**: 
  1. Clear browser cache completely
  2. Sign out and sign in again
  3. Check DB: `db.users.findOne({email: "your-email"})` - should have `role: "admin"`

### Issue: Student can access /setup-admin
- **Solution**: They can access the page but should see "Access Denied" message with button to go to student dashboard.

### Issue: "Unauthorized: Missing or invalid authorization header"
- **Solution**: Make sure you're sending the `Authorization: Bearer <secret>` header

### Issue: Can't access `/admin/students`
- **Solution**:
  1. Verify user role in DB: `db.users.findOne({email: "your-email"})`
  2. Check Clerk metadata has `role: "admin"`
  3. Clear cache and re-login

### Issue: Student can access admin routes
- **Solution**: 
  1. Check if student has `role: "student"` in DB
  2. Clear cache and re-login
  3. Verify middleware protection is working

---

## 📊 Database Schema

Admin users in MongoDB:
```javascript
{
  _id: ObjectId,
  clerkId: "user_xxxxx",
  name: "Admin User",
  email: "admin@gmail.com",
  role: "admin",
  rollNo: undefined, // Not required for admins
  createdAt: Date,
  updatedAt: Date
}
```

Student users in MongoDB:
```javascript
{
  _id: ObjectId,
  clerkId: "user_xxxxx",
  name: "Student Name",
  email: "22bcs010@iiitdmj.ac.in",
  role: "student",
  rollNo: "22bcs010",
  createdAt: Date,
  updatedAt: Date
}
```

---

## 📝 Files Created/Modified

### Created:
- ✅ `src/app/api/admin/setup/route.ts` - Admin creation endpoint
- ✅ `src/app/setup-admin/page.tsx` - UI for creating admins (public with restrictions)

### Modified:
- ✅ `.env.local` - Added `ADMIN_SETUP_SECRET`
- ✅ `src/app/onboarding/page.tsx` - Handle admin vs student flow
- ✅ `src/app/api/onboarding/complete/route.ts` - Role-based creation
- ✅ `src/app/page.tsx` - **Admin detection and onboarding bypass**
- ✅ `src/proxy.ts` - **Middleware with admin role protection**
- ✅ `src/app/(dashboardAdmin)/layout.tsx` - Admin route protection
- ✅ `src/app/(dashboard)/layout.tsx` - Student route protection

---

## ✨ What's New

### Admin Flow Improvements:
- ✅ **Onboarding Bypass** - Admins go directly to `/admin` dashboard
- ✅ **Any Email Domain** - No college email requirement
- ✅ **No Roll Number** - Not required for admin accounts
- ✅ **Instant Access** - Sign in → Dashboard (no intermediate steps)
- ✅ **Auto-Detection** - System detects admin role from DB

### Student Flow (Unchanged):
- ✅ College email required
- ✅ Roll number required
- ✅ Onboarding page shown
- ✅ Redirect to `/home` after onboarding

---

## 🎉 Summary

You can now:
- ✅ Create admin users with **any email domain**
- ✅ Admins **skip onboarding completely**
- ✅ Admins redirect **directly to `/admin`** after sign-in
- ✅ Students follow **normal onboarding flow**
- ✅ **Multi-browser testing** (admin + student)
- ✅ Proper **route protection** for both roles
- ✅ Students **blocked** from admin setup page

---

**Ready to test!** 🚀

1. Open `http://localhost:3000/setup-admin`
2. Create admin with any email
3. Sign in → Auto-redirect to `/admin` ✨
