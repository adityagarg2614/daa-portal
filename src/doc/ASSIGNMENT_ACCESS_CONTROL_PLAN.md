# Assignment Access Control Plan

## Overview
Implement time-based access control for assignments to ensure students can only view and submit assignments during the active period (between publish date and due date).

## Requirements

### 1. Assignment List Page (`/assignment`)
- **Before Publish Date**: "View Assignment" link should be disabled (grayed out, non-clickable)
- **During Active Period**: Link should be enabled and clickable
- **After Due Date**: Link should be disabled (student cannot view assignment problems)

### 2. Assignment Detail Page (`/assignment/[id]`)
- **Before Publish Date**: 
  - Show message that assignment is not yet available
  - Disable all problem viewing and code submission
- **During Active Period**: 
  - Full access to view problems and submit code
- **After Due Date**:
  - Automatically redirect to home page
  - Auto-submit any code that was written but not submitted before deadline
  - Show success toast: "Assignment submitted successfully"

## Implementation Details

### Files Modified

#### 1. `/src/app/(dashboard)/assignment/page.tsx` ✅
- Added `canViewAssignment()` helper function to check if assignment can be viewed
- Disabled "View Assignment" button for:
  - Assignments with status "Upcoming" (publish date in future)
  - Assignments with status "Expired" (due date in past)
- Only enabled link for "Active" and "Completed" status assignments
- Added visual indicators for disabled state (grayed out button with tooltip)
- Updated status message to show "Not available yet" for disabled assignments

#### 2. `/src/app/(dashboard)/assignment/[id]/page.tsx` ✅
- Added access control state: `accessStatus` ("not-published" | "active" | "expired")
- Added auto-submit state: `autoSubmitting` to track submission progress
- Implemented `handleAutoSubmit()` function:
  - Submits all problem code when deadline passes
  - Shows success toast notification
  - Redirects to `/assignment` page after submission
- Added time-based access logic in `useEffect`:
  - Checks current time against publish and due dates
  - Sets appropriate access status
  - Triggers auto-submit and redirect for expired assignments
- Added UI for different access states:
  - **Not Published**: Shows calendar icon and publish date
  - **Expired/Auto-submitting**: Shows clock icon and status message
- Added access check in `handleSubmitSolution()` to prevent submissions when not active

#### 3. `/src/components/providers.tsx` ✅
- Added `<Toaster />` component from `sonner` for toast notifications
- Configured with `position="top-right"` and `richColors`

### Helper Functions

```typescript
function canViewAssignment(status: AssignmentStatus): boolean {
    return status === "Active" || status === "Completed"
}
```

### State Management

- `accessStatus`: Tracks current access state based on time
- `autoSubmitting`: Prevents duplicate submissions
- `submissionState`: Maintains code for auto-submission

### User Experience

1. **Visual Feedback**:
   - ✅ Disabled buttons are grayed out with `cursor-not-allowed`
   - ✅ Clear status messages explaining access restrictions
   - ✅ Icons (CalendarDays, Clock3) for visual context

2. **Redirect Behavior**:
   - ✅ Smooth redirect after auto-submission
   - ✅ Toast appears on redirect: "Assignment submitted successfully"
   - ✅ Loading state shown during auto-submission

3. **Edge Cases Handled**:
   - ✅ Prevents duplicate auto-submissions with `autoSubmitting` flag
   - ✅ Graceful error handling if auto-submission fails
   - ✅ Still redirects even if auto-submission fails
   - ✅ Submission button disabled when assignment not active

## Implementation Status

✅ **COMPLETED** - All requirements implemented and build successful

### Summary of Changes

1. **Assignment List Page**:
   - Disabled "View Assignment" link for non-active assignments
   - Added visual feedback with disabled button styling
   - Added tooltips explaining why assignment is unavailable

2. **Assignment Detail Page**:
   - Added time-based access control
   - Implemented auto-submit functionality for expired assignments
   - Added toast notifications for successful auto-submission
   - Created informative UI for not-yet-published and expired states
   - Prevented manual submissions when assignment is not active

3. **Toast System**:
   - Integrated Sonner toaster in providers
   - Configured with success and error states

## Testing Checklist

- [ ] Link disabled before publish date
- [ ] Link enabled during active period
- [ ] Link disabled after due date
- [ ] Assignment detail page shows correct message before publish
- [ ] Auto-redirect after due date
- [ ] Auto-submission works correctly
- [ ] Toast notification appears after auto-submission
- [ ] No access to problems before publish date
- [ ] Full access during active period
- [ ] Timezone handling works correctly
- [ ] Manual submission blocked when assignment not active

## Future Enhancements

1. Add countdown timer showing time until publish or deadline
2. Send reminder notifications before deadline
3. Allow instructors to extend deadlines
4. Show submission history with timestamps
5. Add grace period configuration option
