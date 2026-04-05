# Admin User Management Page - Implementation Plan

## Overview
Build a comprehensive user management page at `/admin/users` where admins can view, search, filter, and manage all users (both students and admins). The page will include role-based filtering, user details viewing, role changes, and user deletion capabilities.

---

## Key Technical Considerations

### Clerk Integration
- Users are managed in **Cerk** (authentication provider)
- MongoDB stores user metadata (role, rollNo, etc.)
- **Important**: Deleting a user requires:
  1. Delete from Clerk (using Clerk API)
  2. Delete from MongoDB (will be handled by Inngest webhook `clerk/user.deleted`)
- Creating users requires:
  1. Create in Clerk (using Clerk API)
  2. Create in MongoDB

### Existing Infrastructure
- User model already exists with `role: "admin" | "student"`
- Students page exists with table, filters, pagination patterns
- Inngest functions handle Clerk ↔ MongoDB sync
- Clerk SDK available: `@clerk/nextjs`

---

## Architecture

### 1. API Routes: `/api/admin/users/`

#### A. Collection Route: `/api/admin/users/route.ts`

**Methods:**
- **GET** - Fetch all users with pagination, search, filtering
- **POST** - Create a new user (student or admin)

**GET Implementation:**
```typescript
Query Parameters:
- page: number (default: 1)
- limit: number (default: 20)
- search: string (name, email, rollNo)
- role: "all" | "admin" | "student" (default: "all")
- sortBy: "name" | "email" | "role" | "createdAt" (default: "createdAt")
- order: "asc" | "desc" (default: "desc")

Response:
{
  success: true,
  data: {
    users: [...],
    pagination: {
      currentPage, totalPages, totalUsers, hasNext, hasPrev
    }
  }
}
```

**POST Implementation:**
```typescript
Body:
{
  email: string (required)
  name: string (required)
  role: "admin" | "student" (required)
  rollNo?: string (optional, for students only)
  password?: string (optional, auto-generated if not provided)
}

Process:
1. Verify admin auth
2. Validate inputs
3. Check if user already exists (by email)
4. Create user in Clerk using clerkClient.users.createUser()
5. Create user in MongoDB
6. Return success with user data

Response:
{
  success: true,
  message: "User created successfully",
  data: { user }
}
```

#### B. Single User Route: `/api/admin/users/[id]/route.ts`

**Methods:**
- **GET** - Fetch single user details
- **PUT** - Update user (role, name, etc.)
- **DELETE** - Delete user from Clerk and MongoDB

**GET Implementation:**
```typescript
- Fetch user from MongoDB by _id
- Return user details
- Include stats if student (submissions, scores, etc.)
```

**PUT Implementation:**
```typescript
Body (partial updates supported):
{
  name?: string
  role?: "admin" | "student"
  rollNo?: string
}

Process:
1. Verify admin auth
2. Find user in MongoDB
3. If role is changing:
   - Update MongoDB
   - Update Clerk metadata (publicMetadata.role)
4. If rollNo is changing (student only):
   - Validate uniqueness
   - Update MongoDB
5. Return updated user

Response:
{
  success: true,
  message: "User updated successfully",
  data: { user }
}
```

**DELETE Implementation:**
```typescript
Process:
1. Verify admin auth
2. Find user in MongoDB
3. Prevent admin from deleting themselves
4. Delete user from Clerk using clerkClient.users.deleteUser(clerkId)
5. MongoDB deletion handled by Inngest webhook
6. Return success

Response:
{
  success: true,
  message: "User deleted successfully"
}
```

---

### 2. Page: `/admin/users/page.tsx`

**Route:** `/admin/users`
**Type:** Client Component

**Features:**
1. **Stats Cards**
   - Total Users
   - Total Admins
   - Total Students
   - Recent Signups (last 7 days)

2. **Filters & Search**
   - Search by name, email, rollNo
   - Role filter tabs: All | Admins | Students
   - Sort by: name, email, role, createdAt
   - Export to CSV

3. **Users Table**
   - Columns: User (name + avatar), Email, Role, Roll No (if student), Created At, Actions
   - Row actions: View Details, Edit Role, Delete
   - Color-coded role badges
   - Avatar with initials

4. **Pagination**
   - Same pattern as students page
   - Configurable items per page

5. **Dialogs**
   - User Detail Dialog (view full profile)
   - Edit Role Dialog (change admin ↔ student)
   - Create User Dialog (add new user)
   - Delete Confirmation Dialog

**State Management:**
```typescript
const [users, setUsers] = useState<User[]>([])
const [pagination, setPagination] = useState<PaginationData>(...)
const [loading, setLoading] = useState(true)
const [search, setSearch] = useState("")
const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "student">("all")
const [sortBy, setSortBy] = useState("createdAt")
const [order, setOrder] = useState("desc")
const [selectedUser, setSelectedUser] = useState<User | null>(null)
const [detailDialogOpen, setDetailDialogOpen] = useState(false)
const [editRoleDialogOpen, setEditRoleDialogOpen] = useState(false)
const [createDialogOpen, setCreateDialogOpen] = useState(false)
const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
```

---

### 3. Components to Create

#### A. `/components/admin/users-table.tsx`
- Table component matching students-table pattern
- Displays users with avatars, role badges
- Action menu: View, Edit Role, Delete

#### B. `/components/admin/users-filters.tsx`
- Search input
- Role filter tabs/buttons
- Sort dropdown
- Export CSV button
- Clear filters button

#### C. `/components/admin/user-detail-dialog.tsx`
- Full user profile view
- Shows: name, email, role, rollNo, clerkId, createdAt, updatedAt
- If student: shows submission stats, scores, rank
- Action buttons: Edit Role, Delete User

#### D. `/components/admin/user-role-dialog.tsx`
- Dialog to change user role
- Dropdown: Admin / Student
- Warning if changing role
- Confirmation required

#### E. `/components/admin/create-user-dialog.tsx`
- Form to create new user
- Fields: email, name, role, rollNo (conditional)
- Validation
- Auto-generate password or manual entry

#### F. `/components/admin/user-row.tsx`
- Individual table row component
- Avatar with initials
- Role badge (color-coded)
- Action dropdown menu

---

### 4. Utilities: `/lib/admin/users-utils.ts`

```typescript
// Export users to CSV
export function exportUsersToCSV(users: User[], filename: string)

// Generate avatar initials from name
export function getInitials(name: string): string

// Get role badge color
export function getRoleVariant(role: string): "default" | "secondary"

// Format date
export function formatDate(date: string): string
```

---

## File Structure

```
src/
├── app/
│   └── (dashboardAdmin)/
│       └── admin/
│           └── users/
│               └── page.tsx                    # NEW - User Management Page
├── app/
│   └── api/
│       └── admin/
│           └── users/
│               ├── route.ts                    # NEW - GET (list), POST (create)
│               └── [id]/
│                   └── route.ts                # NEW - GET, PUT, DELETE
├── components/
│   └── admin/
│       ├── users-table.tsx                     # NEW
│       ├── users-filters.tsx                   # NEW
│       ├── user-detail-dialog.tsx              # NEW
│       ├── user-role-dialog.tsx                # NEW
│       ├── create-user-dialog.tsx              # NEW
│       └── user-row.tsx                        # NEW
├── lib/
│   └── admin/
│       └── users-utils.ts                      # NEW
└── doc/
    └── ADMIN_USER_MANAGEMENT_PLAN.md           # THIS FILE
```

---

## Implementation Steps

### Step 1: Create API Routes
**Files:** 
- `src/app/api/admin/users/route.ts`
- `src/app/api/admin/users/[id]/route.ts`

**Tasks:**
- Implement GET with pagination, search, role filtering
- Implement POST for user creation (Clerk + MongoDB)
- Implement GET single user
- Implement PUT for role/name updates
- Implement DELETE (Clerk + MongoDB sync)
- Add auth middleware to all routes
- Add input validation

### Step 2: Create Utility Functions
**File:** `src/lib/admin/users-utils.ts`

**Tasks:**
- CSV export function
- Helper functions (initials, formatting, etc.)

### Step 3: Create UI Components
**Files:** All component files listed above

**Tasks:**
- Build table component (reuse students-table pattern)
- Build filters component (reuse students-filters pattern)
- Build detail dialog dialog
- Build role change dialog
- Build create user dialog
- Build row component with avatars

### Step 4: Create Main Page
**File:** `src/app/(dashboardAdmin)/admin/users/page.tsx`

**Tasks:**
- Build page layout with stats, filters, table, pagination
- Wire up all state management
- Connect to API routes
- Add loading states
- Add error handling

### Step 5: Update Admin Sidebar
**File:** `src/components/app-sidebar-admin.tsx`

**Tasks:**
- Add "Users" navigation item
- Link to `/admin/users`
- Add appropriate icon (Users icon)

### Step 6: Testing & Validation
- Test fetching users with different role filters
- Test search functionality
- Test creating new user (admin & student)
- Test role change
- Test user deletion
- Test pagination
- Test export to CSV
- Test auth/permissions
- Test edge cases (self-deletion prevention, duplicate emails, etc.)

---

## UI/UX Design Decisions

### Table Design
- **Avatar**: Circular badge with user initials
- **Role Badge**: Color-coded (Admin = purple/default, Student = blue/secondary)
- **Actions**: Dropdown menu (⋮) with View, Edit Role, Delete
- **Empty State**: Friendly message with "Create User" CTA

### Role Filtering
- **Tab-style buttons** at top: All | Admins | Students
- Active tab highlighted with primary color
- Shows count in each tab (e.g., "Admins (3)")

### Create User Dialog
- Clean form with validation
- Role dropdown determines if rollNo field appears
- Password auto-generated (shown to admin) or manual entry
- Success toast with user details

### Edit Role Dialog
- Simple dropdown: Admin / Student
- Warning message: "Changing role may affect user permissions"
- If changing to student: show rollNo field
- Confirmation required

### Delete Confirmation
- Strong warning: "This action cannot be undone"
- Shows user being deleted (name + email)
- Note: "User will be removed from both Clerk and database"
- Prevents self-deletion (disabled for current admin)

### Color Scheme
- **Admin badge**: Purple/violet (distinctive)
- **Student badge**: Blue (matches existing student pages)
- **Avatar backgrounds**: Gradient based on name (consistent hash)

---

## Security Considerations

1. **Authentication**: All API routes require admin role
2. **Self-Deletion Prevention**: Admins cannot delete themselves
3. **Clerk Integration**: User deletion syncs with auth provider
4. **Input Validation**: Email format, required fields, role enum
5. **Duplicate Prevention**: Check existing email before creation
6. **Role Change Validation**: Ensure at least one admin exists
7. **Rate Limiting**: (Future) Prevent abuse on user creation

---

## Edge Cases to Handle

1. **Admin deleting themselves** → Disabled/blocked
2. **Last admin deletion** → Prevented with warning
3. **Duplicate email on creation** → Validation error
4. **Invalid email format** → Validation error
5. **Role change to student without rollNo** → Show rollNo field
6. **Clerk API failure during creation** → Rollback MongoDB, show error
7. **User not found in Clerk** → Handle gracefully, only delete from MongoDB
8. **Network failure during deletion** → Show retry option
9. **Empty search results** → Friendly empty state
10. **Concurrent role changes** → Last write wins

---

## Dependencies

**Already available:**
- `@clerk/nextjs` - Clerk SDK (clerkClient.users.*)
- `axios` or `fetch` - API calls
- `lucide-react` - Icons
- shadcn/ui components (Dialog, Table, Select, Badge, Button, etc.)
- `sonner` - Toast notifications
- Mongoose

**No new dependencies required**

---

## Clerk API Usage

```typescript
import { clerkClient } from "@clerk/nextjs/server"

// Create user
await clerkClient.users.createUser({
  emailAddress: [email],
  password: generatedPassword,
  firstName: name.split(" ")[0],
  lastName: name.split(" ").slice(1).join(" "),
  publicMetadata: {
    role: role,
    onboardingComplete: true,
  },
})

// Update user metadata
await clerkClient.users.updateUser(clerkId, {
  publicMetadata: {
    role: newRole,
  },
})

// Delete user
await clerkClient.users.deleteUser(clerkId)
```

---

## API Response Formats

### GET /api/admin/users
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "_id": "...",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "admin",
        "rollNo": null,
        "clerkId": "user_...",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalUsers": 45,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### POST /api/admin/users
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "user": { ... },
    "password": "auto-generated-password"
  }
}
```

### PUT /api/admin/users/[id]
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "user": { ... }
  }
}
```

### DELETE /api/admin/users/[id]
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

## Estimated Complexity

- **API Routes**: ~300-400 lines (GET, POST, PUT, DELETE with auth & validation)
- **Main Page**: ~250-350 lines (state, handlers, layout)
- **Components**: ~600-800 lines (6 components)
- **Utilities**: ~50-100 lines

**Total:** ~1200-1650 lines of new code

---

## Future Enhancements (Out of Scope)

1. Bulk user import (CSV upload)
2. Bulk role changes
3. User activity logs
4. Login as user (impersonation)
5. User status management (active/suspended)
6. Advanced filtering (date range, activity)
7. User analytics dashboard
8. Password reset for users
9. Email verification status
10. Two-factor authentication status

---

## Questions for Review

1. **Should admins be able to reset user passwords?** (Useful for student accounts)
2. **Do you want to show "Last Active" timestamp?** (Requires tracking)
3. **Should we add user status (active/suspended)?** (Not in current model)
4. **Do you want bulk operations?** (Select multiple users → change role/delete)
5. **Should we prevent deleting users who have submissions?** (Or warn first)
6. **Auto-generate passwords or let admin set them?**
7. **Should we send welcome email to new users?**

---

**Ready for implementation?** Review this plan and let me know if you'd like to proceed or if any changes are needed.
