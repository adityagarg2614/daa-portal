# Admin View Assignment Page Plan

## Overview
Create a dedicated page for admins to view detailed information about a specific assignment. This page will be accessible from the admin assignments list page when clicking the "View Details" button.

## Route Structure
```
/admin/assignments/[id]
```
- Dynamic route where `[id]` is the assignment ID
- Protected route (admin access only via middleware)

## Page Location
```
src/app/(dashboardAdmin)/admin/assignments/[id]/page.tsx
```

## Features

### 1. Assignment Details Section
- Assignment title
- Description
- Difficulty level
- Points/weightage
- Created date
- Due date
- Status (active/draft/archived)
- Allowed programming languages
- Test cases count
- Submission count

### 2. Test Cases Overview
- List of all test cases
- Input/output samples (masked if needed)
- Test case status (active/inactive)
- Points per test case

### 3. Submissions Summary
- Total submissions count
- Pending submissions
- Graded submissions
- Average score
- Top performers

### 4. Action Buttons
- Edit Assignment
- Delete Assignment (with confirmation)
- View All Submissions
- Back to Assignments List

## API Routes Required

### GET /api/admin/assignments/[id]
**Purpose:** Fetch complete assignment details including test cases and submission stats

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "title": "...",
    "description": "...",
    "difficulty": "...",
    "points": 100,
    "dueDate": "2024-12-31",
    "status": "active",
    "allowedLanguages": ["cpp", "python", "java"],
    "testCases": [...],
    "submissionStats": {
      "total": 50,
      "pending": 10,
      "graded": 40,
      "averageScore": 75.5
    },
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

### DELETE /api/admin/assignments/[id]
**Purpose:** Delete an assignment (with all related test cases)

**Request:** None (just the ID in URL)

**Response:**
```json
{
  "success": true,
  "message": "Assignment deleted successfully"
}
```

## UI Components

### Main Layout
- Header with back button and assignment title
- Action buttons (Edit, Delete, View Submissions)
- Grid layout with cards for different sections

### Cards
1. **Assignment Info Card** - Core details
2. **Test Cases Card** - List of test cases
3. **Submissions Stats Card** - Submission statistics
4. **Metadata Card** - Dates and status

### Loading State
- Skeleton loaders for each section
- "Loading assignment details..." message

### Error State
- "Assignment not found" message
- "Error loading assignment" with retry button

## Navigation Flow
```
Admin Assignments List (/admin/assignments)
    ↓ (Click "View Details")
Assignment Details (/admin/assignments/[id])
    ↓ (Click "Edit")
Edit Assignment (/admin/assignments/create?id=[id])
    ↓ (Click "View Submissions")
Submissions Page (/admin/assignments/[id]/submissions)
```

## Security
- Route protected by middleware (admin only)
- Verify assignment ownership
- Sanitize all user inputs
- Confirm before destructive actions (delete)

## Implementation Steps
1. ✅ Create API route: `/api/admin/assignments/[id]/route.ts`
2. ✅ Create page component: `/admin/assignments/[id]/page.tsx`
3. ✅ Add loading and error states
4. ✅ Implement delete functionality
5. ✅ Add navigation links
6. ✅ Test with sample data

## Status: ✅ COMPLETED
All features have been implemented successfully:
- API routes for fetching and deleting assignments
- Complete view assignment page with all details
- Integration with assignments list page
- Build tested and verified

## Dependencies
- Existing Assignment model
- Existing TestCase model
- Existing Submission model
- Clerk authentication (already set up)
- MongoDB (already set up)
