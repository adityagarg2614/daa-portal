# Announcement Feature Implementation Plan

## Overview
Add a dynamic announcement system where admins can create, manage, and publish announcements for students to view.

---

## 1. Database Model

### File: `src/models/Announcement.ts`
**Purpose:** Define the announcement schema

**Schema Fields:**
- `title` (String, required): Announcement title
- `content` (String, required): Full announcement message
- `type` (String, enum: ['general', 'assignment', 'event', 'urgent']): Category
- `priority` (String, enum: ['low', 'medium', 'high']): Display priority
- `isActive` (Boolean, default: true): Visibility toggle
- `publishAt` (Date, default: Date.now): When to publish
- `expiresAt` (Date, optional): When to auto-expire
- `createdBy` (ObjectId, ref: 'User'): Admin who created it
- `attachments` (Array, optional): Links/files (future enhancement)

**Indexes:**
- Compound index on `{ isActive: 1, publishAt: -1 }` for efficient active queries
- Index on `{ expiresAt: 1 }` for cleanup jobs

---

## 2. API Routes

### 2.1 Admin Announcement Routes

#### `src/app/api/admin/announcements/route.ts`
**Methods:**
- **GET**: Fetch all announcements (with pagination & filters)
  - Query params: `page`, `limit`, `type`, `status` (active/inactive/all)
  - Returns: Paginated list with total count
- **POST**: Create new announcement
  - Body: `{ title, content, type, priority, publishAt, expiresAt? }`
  - Validates admin role
  - Returns: Created announcement

#### `src/app/api/admin/announcements/[id]/route.ts`
**Methods:**
- **GET**: Get single announcement details
- **PUT**: Update announcement (title, content, status, etc.)
- **DELETE**: Delete announcement permanently
- **PATCH**: Toggle `isActive` status (quick enable/disable)

### 2.2 Student Announcement Routes

#### `src/app/api/student/announcements/route.ts`
**Methods:**
- **GET**: Fetch active announcements for students
  - Auto-filters: `isActive: true`, `publishAt <= now`, `expiresAt > now` OR `null`
  - Query params: `type` (optional filter), `limit` (default: 10)
  - Returns: Array of active announcements (sorted by publishAt desc)

#### `src/app/api/student/announcements/[id]/route.ts`
**Methods:**
- **GET**: Get single announcement details (with access check)

---

## 3. Admin UI Components

### 3.1 Main Announcements Page

#### `src/app/(dashboardAdmin)/admin/announcements/page.tsx`
**Features:**
- SectionHeader with "Announcements" title + "Create New" button
- Filter controls:
  - Type dropdown (All, General, Assignment, Event, Urgent)
  - Status dropdown (All, Active, Inactive)
  - Search input (by title/content)
- Announcement table (following `students/page.tsx` pattern):
  - Columns: Title, Type, Priority, Publish Date, Status, Actions
  - Row actions: Edit, Delete, Toggle Status
  - Pagination controls
- Stats cards at top:
  - Total Announcements
  - Active Now
  - Upcoming (scheduled)
  - Expired

### 3.2 Create/Edit Announcement Modal

#### `src/components/admin/AnnouncementForm.tsx`
**Form Fields:**
- Title (Input)
- Content (Textarea with rich text or plain)
- Type (Select: General, Assignment, Event, Urgent)
- Priority (Select: Low, Medium, High)
- Publish At (DateTime picker - default: now)
- Expires At (DateTime picker - optional)
- Status Toggle (Active/Inactive)

**Validation:**
- Title: Required, min 5 chars, max 100 chars
- Content: Required, min 10 chars, max 1000 chars
- Publish At: Cannot be in the past (unless editing)
- Expires At: Must be after publish date if set

**Actions:**
- Submit button (Create/Update based on mode)
- Cancel button
- Preview button (optional)

### 3.3 Announcement Card Component

#### `src/components/admin/AnnouncementCard.tsx`
**Purpose:** Display announcement in table/list view
**Props:** Announcement data, onEdit, onDelete, onToggle
**Features:**
- Badge for type (color-coded)
- Badge for priority
- Status indicator (active/inactive)
- Action buttons (Edit, Delete, Toggle)

---

## 4. Student UI Components

### 4.1 Announcements Page

#### `src/app/(dashboard)/announcements/page.tsx`
**Features:**
- SectionHeader with "Announcements & Updates"
- Filter controls (simpler than admin):
  - Type dropdown (All, General, Assignment, Event, Urgent)
- Announcement cards grid/list (following home page pattern):
  - Card layout with:
    - Header: Title + Type badge + Priority indicator
    - Content: Truncated or full content
    - Footer: Publish date, "Read More" if truncated
- Empty state if no announcements
- Loading skeleton during fetch

### 4.2 Announcement Detail Modal/Dialog

#### `src/components/student/AnnouncementDialog.tsx`
**Purpose:** Show full announcement details on click
**Features:**
- Title with type & priority badges
- Full content (formatted if rich text)
- Publish date & expiry info
- Close button

### 4.3 Home Page Integration

#### Update: `src/app/(dashboard)/home/page.tsx`
**Changes:**
- Replace hardcoded announcements array with API fetch
- Fetch from `/api/student/announcements?limit=3`
- Show latest 3 announcements in existing card
- Add "View All" link to `/announcements`

---

## 5. Navigation Updates

### 5.1 Student Sidebar

#### Update: `src/components/app-sidebar.tsx`
**Changes:**
- Replace placeholder "Announcements" nav item:
  ```typescript
  {
    title: "Updates",
    items: [
      { 
        title: "Announcements", 
        url: "/announcements",
        icon: Megaphone // or Bell
      },
      // Keep Events, Notifications as placeholders or remove
    ],
  }
  ```

### 5.2 Admin Sidebar

#### Update: `src/components/app-sidebar-admin.tsx`
**Changes:**
- Add "Announcements" under management section:
  ```typescript
  {
    title: "Management",
    items: [
      // ... existing items
      { 
        title: "Announcements", 
        url: "/admin/announcements",
        icon: Megaphone
      },
    ],
  }
  ```

---

## 6. Shared UI Components

### 6.1 Announcement List Component

#### `src/components/AnnouncementList.tsx`
**Purpose:** Reusable component for displaying announcements
**Props:** Announcements array, variant ('card' | 'table' | 'compact')
**Usage:** Both admin and student pages

### 6.2 Type/Priority Badge Helpers

#### `src/lib/announcement.ts`
**Utilities:**
```typescript
- getTypeColor(type: string): string  // Returns Tailwind color class
- getPriorityColor(priority: string): string
- getTypeLabel(type: string): string   // Returns display name
- getPriorityIcon(priority: string): JSX.Element
```

---

## 7. Environment Variables (if needed)

No new environment variables required for basic implementation.

**Future enhancements might need:**
- `ANNOUNCEMENT_CACHE_TTL` - Cache duration for student announcements
- `MAX_ANNOUNCEMENTS_PER_PAGE` - Pagination default

---

## 8. Implementation Order

### Phase 1: Backend Foundation
1. Create `Announcement` model
2. Create admin API routes (CRUD)
3. Create student API routes (read-only)
4. Test APIs with Postman/curl

### Phase 2: Admin UI
5. Create admin announcements page (list view)
6. Create announcement form component
7. Add create/edit/delete functionality
8. Add filters and search
9. Add toggle status functionality

### Phase 3: Student UI
10. Create student announcements page
11. Create announcement detail dialog
12. Update home page to fetch dynamic announcements
13. Add empty states and loading skeletons

### Phase 4: Polish & Integration
14. Update sidebar navigation (both admin & student)
15. Add toast notifications for actions
16. Add confirmation dialogs for delete
17. Test role-based access control
18. Responsive design checks
19. Dark mode compatibility

### Phase 5: Optional Enhancements
20. Add Inngest job to auto-expire announcements
21. Add attachment support
22. Add rich text editor for content
23. Add announcement templates (quick create)
24. Add bulk actions (delete multiple, toggle multiple)

---

## 9. File Structure Summary

```
src/
├── models/
│   └── Announcement.ts                    [NEW]
├── lib/
│   └── announcement.ts                    [NEW] - Helper utilities
├── components/
│   ├── admin/
│   │   ├── AnnouncementForm.tsx           [NEW]
│   │   └── AnnouncementCard.tsx           [NEW]
│   ├── student/
│   │   └── AnnouncementDialog.tsx         [NEW]
│   └── AnnouncementList.tsx               [NEW]
├── app/
│   ├── (dashboardAdmin)/
│   │   └── admin/
│   │       └── announcements/
│   │           ├── page.tsx               [NEW]
│   │           └── [id]/
│   │               └── edit/
│   │                   └── page.tsx       [NEW] (optional, or use modal)
│   ├── (dashboard)/
│   │   └── announcements/
│   │       └── page.tsx                   [NEW]
│   └── api/
│       ├── admin/
│       │   └── announcements/
│       │       ├── route.ts               [NEW]
│       │       └── [id]/
│       │           └── route.ts           [NEW]
│       └── student/
│           └── announcements/
│               ├── route.ts               [NEW]
│               └── [id]/
│                   └── route.ts           [NEW]
└── components/
    ├── app-sidebar.tsx                    [MODIFY]
    └── app-sidebar-admin.tsx              [MODIFY]
```

---

## 10. Testing Checklist

### Backend
- [ ] Admin can create announcement
- [ ] Admin can update announcement
- [ ] Admin can delete announcement
- [ ] Admin can toggle announcement status
- [ ] Non-admin cannot access admin routes
- [ ] Student can fetch active announcements
- [ ] Student cannot access inactive announcements
- [ ] Pagination works correctly
- [ ] Filters work correctly

### Frontend
- [ ] Admin can see announcements list
- [ ] Admin can create new announcement
- [ ] Admin can edit existing announcement
- [ ] Admin can delete with confirmation
- [ ] Admin can filter by type/status
- [ ] Student can view announcements page
- [ ] Student sees only active announcements
- [ ] Student home page shows latest announcements
- [ ] Loading states display correctly
- [ ] Empty states display correctly
- [ ] Navigation works in both dashboards
- [ ] Dark mode renders correctly
- [ ] Mobile responsive layout works

---

## 11. Design Specifications

### Color Coding

**Type Badges:**
- General: `bg-blue-500`
- Assignment: `bg-green-500`
- Event: `bg-purple-500`
- Urgent: `bg-red-500`

**Priority Indicators:**
- Low: `bg-gray-400`
- Medium: `bg-yellow-500`
- High: `bg-orange-500`

**Status:**
- Active: `bg-green-500`
- Inactive: `bg-gray-300`

### Layout Patterns
- **Admin**: Table view with filters (like students page)
- **Student**: Card grid view (like home page announcements)
- **Mobile**: Stack cards vertically, collapsible filters

---

## 12. Future Enhancements (Out of Scope)

1. **Rich Text Editor**: Add formatting, links, images
2. **Attachments**: File uploads for announcements
3. **Scheduled Publishing**: Inngest job to auto-publish at `publishAt`
4. **Auto Expiry**: Inngest job to auto-deactivate at `expiresAt`
5. **Targeted Announcements**: Filter by batch, course, section
6. **Read Receipts**: Track which students viewed announcement
7. **Email Notifications**: Send email on urgent announcements
8. **Push Notifications**: Browser push for urgent items
9. **Templates**: Pre-defined announcement templates
10. **Analytics**: View counts, engagement metrics

---

## Questions for Implementation

1. Should we use a modal for create/edit or a separate page?
2. Do we need rich text editing or plain text is sufficient?
3. Should announcements auto-expire or stay until manually deactivated?
4. Do we need to support attachments in the initial version?
5. Should there be a preview feature before publishing?

---

**Total Estimated Files:** 12 new files, 4 modified files
**Complexity:** Medium
**Dependencies:** Existing auth, role system, UI components
