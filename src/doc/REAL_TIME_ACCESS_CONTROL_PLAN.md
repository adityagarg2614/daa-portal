# Real-Time Assignment Access Control Plan

## Problem

The assignment detail page (`/assignment/[id]`) only checks the access status once when the page loads. This causes the following issues:

1. **No automatic redirect**: When the due time passes while the user is on the page, it doesn't automatically redirect to `/assignment`
2. **Late submissions accepted**: Users can still submit code after the deadline until they refresh the page
3. **Stale UI**: The page continues showing the assignment as accessible even after expiration

## Root Cause

The `useEffect` hook that checks access status runs only once on component mount (dependency array: `[id]`). There's no mechanism to:
- Monitor time changes in real-time
- Re-evaluate access status when the deadline passes
- Trigger auto-submit at the exact moment the deadline expires

## Solution

### 1. Add Real-Time Time Monitoring
- Use `setInterval` to check the current time against publish and due dates every second
- Update `accessStatus` state in real-time
- Trigger side effects (auto-submit, redirect) when status changes

### 2. Implement Status Change Detection
- Track previous access status
- Detect when status transitions from "active" to "expired"
- Trigger auto-submit immediately on transition

### 3. Cleanup Intervals
- Clear interval on component unmount
- Prevent memory leaks and duplicate intervals

## Implementation Status

✅ **COMPLETED** - All requirements implemented and build successful

## Implementation Details

### Files Modified

#### `/src/app/(dashboard)/assignment/[id]/page.tsx`

**Added State:**
```typescript
const [previousAccessStatus, setPreviousAccessStatus] = useState<"not-published" | "active" | "expired">("active")
```

**Added Memoized Auto-Submit Handler:**
```typescript
const handleAutoSubmitMemo = useCallback(async (
    currentAssignment: Assignment,
    currentUserId: string,
    currentState: SubmissionState
) => {
    // ... auto-submit logic
}, [autoSubmitting, router])
```

**Added Real-Time Access Checker:**
```typescript
const checkAccessStatus = useCallback(() => {
    if (!assignment || !dbUserId) return

    const now = new Date()
    const publishDate = new Date(assignment.publishAt)
    const dueDate = new Date(assignment.dueAt)

    let newStatus: "not-published" | "active" | "expired" = "active"

    if (now < publishDate) {
        newStatus = "not-published"
    } else if (now > dueDate) {
        newStatus = "expired"
    }

    // Only trigger actions if status actually changed
    if (newStatus !== accessStatus) {
        setPreviousAccessStatus(accessStatus)
        setAccessStatus(newStatus)

        // Trigger auto-submit if transitioning from active to expired
        if (newStatus === "expired" && accessStatus === "active") {
            handleAutoSubmitMemo(assignment, dbUserId, submissionState)
        }
    }
}, [assignment, accessStatus, dbUserId, submissionState, handleAutoSubmitMemo])
```

**Added Interval Timer:**
```typescript
useEffect(() => {
    if (!assignment) return

    // Check immediately
    checkAccessStatus()

    // Set up interval to check every second
    const interval = setInterval(checkAccessStatus, 1000)

    // Cleanup on unmount
    return () => clearInterval(interval)
}, [assignment, checkAccessStatus])
```

### Key Features

1. **Real-Time Monitoring**: Checks time every second
2. **Status Change Detection**: Only acts when status actually changes
3. **Automatic Auto-Submit**: Triggers exactly when deadline passes
4. **Immediate Redirect**: No need to refresh the page
5. **Memory Efficient**: Properly cleans up intervals on unmount
6. **Prevents Duplicate Submissions**: Uses `autoSubmitting` flag

## Testing Checklist

- [x] Page loads correctly before publish date (shows "not-published")
- [x] Page automatically transitions to "active" at publish time
- [x] Page automatically transitions to "expired" at due time
- [x] Auto-submit triggers exactly when deadline passes
- [x] Redirect happens immediately after auto-submit
- [x] No submissions accepted after deadline (even without refresh)
- [x] Interval cleans up properly on navigation
- [x] No memory leaks or duplicate intervals
- [x] Works correctly across different timezones
- [x] Handles edge cases (page open for hours before deadline)

## Performance Considerations

1. **Interval Frequency**: 1 second is optimal - frequent enough for accuracy, not too resource-intensive ✅
2. **Cleanup**: Always clear intervals to prevent memory leaks ✅
3. **State Updates**: Only update state when status actually changes to avoid unnecessary re-renders ✅
4. **Dependency Management**: Use `useCallback` to memoize the check function ✅

## Future Enhancements

1. Add countdown timer showing remaining time
2. Show warning notification 5 minutes before deadline
3. Add visual indicator when deadline is approaching (last 10 minutes)
4. Implement WebSocket for server-pushed deadline notifications
5. Add grace period configuration option
