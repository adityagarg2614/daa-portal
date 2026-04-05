# Admin View/Edit Problem Page - Implementation Plan

## Overview
Build a dedicated "View Problem" page for admins that displays an existing problem in an editable form. Admins can modify any field, and the page will show "Save Changes" and "Discard Changes" buttons at the bottom when edits are detected. Changes are persisted to the database only after clicking "Save Changes".

---

## Architecture

### 1. New API Route: `GET/PUT/DELETE /api/admin/problems/[id]/route.ts`

**Purpose:** Handle single problem CRUD operations

**Methods:**
- **GET** - Fetch a single problem by ID (with auth verification)
- **PUT** - Update an existing problem (with auth verification)
- **DELETE** - Delete a problem (with auth verification)

**Authentication:**
- Verify user is logged in via Clerk `auth()`
- Verify user has `admin` role via DB lookup
- Return 401/403 for unauthorized/forbidden access

**GET Implementation:**
```typescript
- Accept params: { id: string }
- Find problem by ID using Problem.findById(id)
- Return 404 if not found
- Return { success: true, data: problem }
```

**PUT Implementation:**
```typescript
- Accept params: { id: string }
- Accept body with all problem fields (partial updates supported)
- Find problem by ID
- Return 404 if not found
- Validate required fields if provided (title, slug, description)
- Check for duplicate slug if slug is changed
- Update fields on the problem document
- Save and return updated problem
- Return { success: true, message: "Problem updated successfully", data: problem }
```

**DELETE Implementation:**
```typescript
- Accept params: { id: string }
- Find and delete problem by ID
- Return 404 if not found
- Return { success: true, message: "Problem deleted successfully" }
```

**Validation Rules:**
- `title`: required, trim, min 3 chars, max 100 chars
- `slug`: required, unique, URL-friendly (lowercase, hyphens)
- `description`: required, min 10 chars
- `difficulty`: enum ["Easy", "Medium", "Hard"]
- `marks`: required, number, min 1
- `tags`: array of strings, each max 20 chars
- `constraints`: array of strings
- `examples`: array of { input, output, explanation? }
- `testCases`: array of { input, output, isHidden }
- `starterCode`: object with { cpp, java, python, javascript }

---

### 2. New Page: `/admin/problems/[id]/page.tsx`

**Route:** `/admin/problems/[id]` (dynamic route)
**Type:** Client Component (`'use client'`)

**Features:**
1. **Fetch problem data** on mount via `GET /api/admin/problems/[id]`
2. **Display all problem fields** in editable form inputs
3. **Track changes** - compare current form state with original problem data
4. **Show action buttons** only when changes are detected
5. **Save Changes** - sends PUT request to update problem in database
6. **Discard Changes** - reverts form to original problem data

**State Management:**
```typescript
// Original problem data (unchanged)
const [originalProblem, setOriginalProblem] = useState<Problem | null>(null)

// Current form state (editable)
const [formData, setFormData] = useState<ProblemFormData>({...})

// Loading states
const [loading, setLoading] = useState(true)
const [saving, setSaving] = useState(false)

// UI states
const [message, setMessage] = useState("")
const [messageType, setMessageType] = useState<"success" | "destructive" | "info">("info")

// Track if form has unsaved changes
const hasChanges = useMemo(() => {
    if (!originalProblem) return false
    return JSON.stringify(formData) !== JSON.stringify(originalProblem)
}, [formData, originalProblem])
```

**Form Sections (matching create page structure):**

1. **Basic Details Section**
   - Title (text input)
   - Slug (text input)
   - Difficulty (select dropdown: Easy/Medium/Hard)
   - Marks (number input)
   - Tags (tag input with add/remove)
   - Description (textarea)

2. **Constraints Section**
   - Dynamic list of constraint strings
   - Add/Remove constraint buttons

3. **Examples Section**
   - Dynamic list of examples (input, output, explanation)
   - Add/Remove example buttons

4. **Test Cases Section**
   - Dynamic list of test cases (input, output, isHidden checkbox)
   - Add/Remove test case buttons

5. **Starter Code Section**
   - Textarea for each language (cpp, java, python, javascript)
   - Tab or accordion interface for different languages

**Bottom Action Bar (sticky, visible only when `hasChanges === true`):**
```tsx
{hasChanges && (
    <div className="sticky bottom-0 rounded-t-2xl border bg-background p-4 shadow-lg">
        <div className="flex items-center justify-end gap-3">
            <Button variant="outline" onClick={handleDiscardChanges}>
                Discard Changes
            </Button>
            <Button onClick={handleSaveChanges} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
            </Button>
        </div>
    </div>
)}
```

**Event Handlers:**

```typescript
// Save changes to database
const handleSaveChanges = async () => {
    try {
        setSaving(true)
        const res = await axios.put(`/api/admin/problems/${problemId}`, formData)
        setMessage(res.data.message || "Problem updated successfully")
        setMessageType("success")
        // Update originalProblem to new formData
        setOriginalProblem(res.data.data)
    } catch (error) {
        setMessage("Failed to update problem")
        setMessageType("destructive")
    } finally {
        setSaving(false)
    }
}

// Revert to original data
const handleDiscardChanges = () => {
    if (originalProblem) {
        setFormData(originalProblem)
        setMessage("Changes discarded")
        setMessageType("info")
    }
}
```

**Loading State:**
- Show skeleton while fetching problem data
- Disable all inputs while saving
- Show spinner on save button

**Error Handling:**
- Show error message if problem not found (404)
- Show validation errors from API
- Network error handling

**Navigation:**
- Back button to return to `/admin/problems`
- Success toast notifications using `sonner`

---

### 3. Update Existing Problems List Page

**File:** `/admin/problems/page.tsx`

**Changes:**
- Update the "View Details" button to link to the new view page:
```tsx
<Link href={`/admin/problems/${problem._id}`}>
    <Button>View Details</Button>
</Link>
```

---

## File Structure

```
src/
├── app/
│   └── (dashboardAdmin)/
│       └── admin/
│           └── problems/
│               ├── page.tsx                    # Existing (minor update)
│               ├── create/
│               │   └── page.tsx                # Existing (no changes)
│               └── [id]/
│                   └── page.tsx                # NEW - View/Edit Problem Page
├── app/
│   └── api/
│       └── admin/
│           └── problems/
│               ├── route.ts                    # Existing (no changes)
│               └── [id]/
│                   └── route.ts                # NEW - Single Problem API
└── doc/
    └── ADMIN_VIEW_EDIT_PROBLEM_PLAN.md         # THIS FILE
```

---

## Implementation Steps

### Step 1: Create API Route
**File:** `src/app/api/admin/problems/[id]/route.ts`
- Implement GET handler
- Implement PUT handler with validation
- Implement DELETE handler
- Add auth middleware logic (same pattern as announcements)
- Add proper error handling and response formatting

### Step 2: Create View/Edit Problem Page
**File:** `src/app/(dashboardAdmin)/admin/problems/[id]/page.tsx`
- Create client component
- Implement data fetching on mount
- Build all form sections (reuse patterns from create page)
- Implement change detection logic
- Implement save/discard handlers
- Add loading and error states
- Add sticky action bar

### Step 3: Update Problems List Page
**File:** `src/app/(dashboardAdmin)/admin/problems/page.tsx`
- Update "View Details" button to link to `/admin/problems/[id]`

### Step 4: Testing & Validation
- Test fetching existing problem
- Test editing all fields
- Test change detection
- Test save functionality (verify DB update)
- Test discard functionality
- Test validation errors
- Test auth/permissions
- Test edge cases (invalid ID, not found, etc.)

---

## UI/UX Design Decisions

### Form Layout
- **Match create page styling** for consistency
- Use same rounded cards, sections, and spacing
- Reuse FormField component for labeled inputs
- Same icon usage and visual hierarchy

### Change Detection
- **Deep comparison** using JSON.stringify
- Visual indicator (optional): subtle highlight on changed fields
- Action bar only appears when changes exist

### Action Bar
- **Sticky at bottom** of viewport
- Always visible when scrolling
- Clear visual distinction (elevated shadow)
- Disabled state during save

### Validation Feedback
- Inline error messages for invalid fields
- Toast notification on success/error
- Alert banner for form-level errors

### Loading States
- Skeleton loader matching form structure
- Disabled inputs during save
- Spinner on save button

---

## Security Considerations

1. **Authentication:** All API routes require admin role
2. **Authorization:** Verify user is admin before any operation
3. **Input Validation:** Server-side validation on all fields
4. **Slug Uniqueness:** Prevent duplicate slugs on update
5. **XSS Prevention:** Sanitize user inputs (already handled by React)
6. **MongoDB Injection:** Use Mongoose (already parameterized)

---

## Edge Cases to Handle

1. **Problem not found:** Show 404 message with back button
2. **Invalid ID format:** Handle MongoDB ObjectId validation
3. **Concurrent edits:** Last write wins (no locking mechanism)
4. **Network failure during save:** Show error, keep form data
5. **Duplicate slug on update:** Show validation error
6. **Empty required fields:** Prevent save, show errors
7. **Browser navigation warning:** (Optional) Prompt on unsaved changes

---

## Dependencies

**Already available in project:**
- `axios` - API calls
- `lucide-react` - Icons
- shadcn/ui components (Button, Badge, Select, FormField, Alert, etc.)
- `sonner` - Toast notifications (optional)
- Clerk auth (`@clerk/nextjs`)
- Mongoose

**No new dependencies required**

---

## Estimated Complexity

- **API Route:** ~150-200 lines (GET, PUT, DELETE with auth & validation)
- **View/Edit Page:** ~600-800 lines (form, state management, handlers)
- **List Page Update:** ~5 lines (link update)

**Total:** ~750-1000 lines of new code

---

## Future Enhancements (Out of Scope)

1. Real-time collaboration/locking
2. Revision history
3. Problem preview (student view)
4. Bulk edit operations
5. Problem duplication feature
6. Soft delete with trash
7. Assignment impact warning (if problem is used in assignments)

---

## Questions for Review

1. **Should we add a delete button on the view page?** (API will support it)
2. **Should we warn if problem is used in existing assignments?**
3. **Do you want a "Preview as Student" feature?**
4. **Should we add rich text/Markdown editor for description?**
5. **Do you want auto-save (debounced) or only manual save?**

---

**Ready for implementation?** Review this plan and let me know if you'd like to proceed or if any changes are needed.
