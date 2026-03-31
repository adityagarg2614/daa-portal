# Scripts Documentation

Utility scripts for managing the DAA Portal database and administration.

## Setup

All scripts are located in the `/scripts` folder. Before running any script, update the `MONGODB_URI` constant with your actual MongoDB connection string:

```javascript
const MONGODB_URI = 'mongodb://localhost:27017/daa-portal';
// or
const MONGODB_URI = 'mongodb+srv://username:password@cluster.mongodb.net/daa-portal';
```

## Available Scripts

### 1. Get Users (`get-users.js`)

Fetches and displays all users from the database.

```bash
node scripts/get-users.js
```

**Output:**
- Total user count
- List of all users with details (ID, Clerk ID, Name, Email, Roll No, Role, Timestamps)

---

### 2. Drop RollNo Index (`drop-rollno-index.js`)

Removes the problematic unique index on the `rollNo` field that causes duplicate key errors.

```bash
node scripts/drop-rollno-index.js
```

**Use when:**
- Getting `E11000 duplicate key error collection: daa-portal.users index: rollNo_1 dup key: { rollNo: null }`
- Multiple admins can't be created due to null rollNo conflicts

**What it does:**
- Lists all current indexes on the `users` collection
- Drops the `rollNo_1` unique index
- Verifies the final state of indexes

---

### 3. Sync Pending Admins (`sync-pending-admins.js`)

Lists all admin users with pending Clerk IDs.

```bash
node scripts/sync-pending-admins.js
```

**Use when:**
- You've created admins via `/api/admin/setup` but they haven't logged in yet
- You need to see which admins are waiting for first login sync

**What it does:**
- Finds all users with `clerkId` starting with `pending_`
- Displays their email, name, and creation date
- These users will be automatically synced on their first login

---

### 4. Cleanup Admins (`cleanup-admins.js`)

Comprehensive admin management utility.

```bash
node scripts/cleanup-admins.js
```

**Use when:**
- You need to audit all admin users
- You suspect duplicate email entries
- You want to see pending vs active admins

**What it does:**
- Lists all pending admin users (awaiting first login)
- Lists all admin users with their status (PENDING/ACTIVE)
- Checks for duplicate email entries
- Provides recommendations for cleanup

---

## Common Workflows

### Setting Up a New Admin

1. Use the admin setup API (via dashboard or curl):
   ```bash
   curl -X POST http://localhost:3000/api/admin/setup \
     -H "Authorization: Bearer YOUR_ADMIN_SETUP_SECRET" \
     -H "Content-Type: application/json" \
     -d '{"email": "admin@example.com", "name": "Admin Name"}'
   ```

2. The admin will be created with `clerkId: "pending_<email>"`

3. When the admin logs in:
   - Their `clerkId` is automatically updated
   - Clerk metadata is updated with `role: "admin"`
   - They are redirected to `/admin` (not onboarding)

4. Verify with:
   ```bash
   node scripts/cleanup-admins.js
   ```

### Fixing Duplicate Key Errors

If you get `E11000 duplicate key error` for `rollNo`:

```bash
# Drop the problematic index
node scripts/drop-rollno-index.js

# Restart your dev server
npm run dev
```

### Auditing Users

```bash
# View all users
node scripts/get-users.js

# View admin-specific details
node scripts/cleanup-admins.js
```

---

## Troubleshooting

### Admin still goes to onboarding instead of admin dashboard

1. Run cleanup script to check status:
   ```bash
   node scripts/cleanup-admins.js
   ```

2. Check if the admin is marked as `PENDING` or `ACTIVE`

3. If `PENDING`, the admin needs to log out and log back in

4. If still not working, check:
   - Clerk metadata has `role: "admin"`
   - DB has correct `clerkId` (not `pending_*`)

### Can't create multiple admins

1. Drop the rollNo index:
   ```bash
   node scripts/drop-rollno-index.js
   ```

2. The model has been updated to not create this index again

3. Try creating admins again

---

## Notes

- All scripts use a hardcoded MongoDB URI for simplicity
- Scripts don't modify data except `drop-rollno-index.js`
- Always backup your database before running cleanup operations
- The `pending_` prefix is automatically resolved on first login
