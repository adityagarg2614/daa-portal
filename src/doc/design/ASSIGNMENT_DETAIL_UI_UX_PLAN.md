# Assignment Detail Page - UI/UX Improvement Plan

## Overview

**Page:** `/assignment/[id]` (Student Dashboard)
**File:** `src/app/(dashboard)/assignment/[id]/page.tsx`
**Users:** Students
**Goal:** Enhance the assignment submission experience with improved visual hierarchy, better code editing UX, and consistent branding

---

## 1. Current State Analysis

### 1.1 What Works Well
- ✅ Clear problem layout with description, constraints, and examples
- ✅ Language selection dropdown
- ✅ Reset code functionality
- ✅ Auto-submit on deadline
- ✅ Real-time deadline tracking
- ✅ Status-based access control (not-published, active, expired)

### 1.2 Areas for Improvement
- ❌ **No theme toggle** in student navbar
- ❌ **Reset button** lacks visual prominence and clear labeling
- ❌ **Submit button** could have better visual feedback
- ❌ **Problem cards** lack clear visual separation between description and submission areas
- ❌ **No loading skeletons** for initial page load
- ❌ **No confirmation** before auto-submit on deadline
- ❌ **Limited visual feedback** for submission states
- ❌ **Examples section** could be more visually distinct
- ❌ **No progress indicator** showing how many problems have been submitted
- ❌ **Language dropdown** styling could be enhanced
- ❌ **No keyboard shortcuts** for common actions (save, reset)

---

## 2. Design Goals

### 2.1 Primary Goals
1. **Implement theme toggle** in student navbar (light/dark mode) with animated icon transition
2. **Enhanced reset button** with better visual design and tooltip
3. **Improved submit button** with loading states and success feedback
4. **Better visual hierarchy** between problem description and code editor
5. **Add submission progress tracker** showing completed/total problems
6. **Enhanced examples display** with copy-to-clipboard functionality

### 2.2 Secondary Goals
1. Add loading skeletons for smoother perceived performance
2. Implement keyboard shortcuts (Ctrl/Cmd+S to save, Ctrl/Cmd+R to reset)
3. Add confirmation dialog before auto-submit on deadline
4. Improve accessibility (ARIA labels, keyboard navigation)
5. Add visual indicators for saved vs. unsaved work
6. Use animated icons for better micro-interactions

---

## 3. Implementation Plan

### Phase 1: Theme Toggle Implementation 🔧

#### 3.1.1 Add Theme Toggle to Student Navbar
**File:** `src/app/(dashboard)/DashboardLayoutClient.tsx`

```tsx
import { ThemeToggle } from '@/components/theme-toggle'

// In the navbar header section, add:
<div className="flex items-center gap-2">
  {/* Existing user info */}
  <ThemeToggle />
</div>
```

**Note:** Theme toggle component and hook already defined in CREATE_ASSIGNMENT_UI_UX_PLAN.md
- `src/hooks/use-theme.ts`
- `src/components/theme-toggle.tsx`

---

### Phase 2: Enhanced Page Header 📊

#### 3.2.1 Improved Assignment Info Header

**Current:**
```tsx
<div className="rounded-2xl border bg-background p-6 shadow-sm">
  <h1 className="text-2xl font-bold tracking-tight">{assignment.title}</h1>
  <p className="mt-2 text-sm text-muted-foreground">{assignment.description}</p>
  {/* Stats grid */}
</div>
```

**Improved:**
```tsx
import { FileText, Clock, CalendarDays, Award, BookOpen, Timer } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

<div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-background to-muted p-8 shadow-sm">
  {/* Decorative background */}
  <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/5 blur-3xl" />
  
  <div className="relative z-10">
    {/* Header with icon */}
    <div className="flex items-start gap-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
        <FileText className="h-7 w-7 icon-bounce" />
      </div>
      <div className="flex-1">
        <h1 className="text-2xl font-bold tracking-tight">{assignment.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{assignment.description}</p>
      </div>
      <Badge variant="outline" className="gap-1">
        <BookOpen className="h-3 w-3" />
        {assignment.totalProblems} Problems
      </Badge>
    </div>

    {/* Progress Bar */}
    <div className="mt-6">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-muted-foreground">Submission Progress</span>
        <span className="font-medium text-primary">
          {submittedCount}/{assignment.totalProblems} Completed
        </span>
      </div>
      <Progress 
        value={(submittedCount / assignment.totalProblems) * 100} 
        className="mt-2 h-2"
        indicatorClassName="bg-primary transition-all duration-500"
      />
    </div>

    {/* Enhanced Stats Grid */}
    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        icon={Award}
        label="Total Marks"
        value={assignment.totalMarks}
        variant="primary"
      />
      <StatCard
        icon={CalendarDays}
        label="Published"
        value={formatDate(assignment.publishAt)}
        variant="default"
      />
      <StatCard
        icon={Clock}
        label="Due Date"
        value={formatDate(assignment.dueAt)}
        variant={isExpiringSoon ? "warning" : "default"}
      />
      <StatCard
        icon={Timer}
        label="Time Remaining"
        value={formatTimeRemaining(assignment.dueAt)}
        variant={isExpiringSoon ? "warning" : "success"}
      />
    </div>
  </div>
</div>
```

#### 3.2.2 Create Time Remaining Utility Hook
**File:** `src/hooks/use-time-remaining.ts` (new)

```typescript
'use client'

import { useState, useEffect } from 'react'

export function useTimeRemaining(dueAt: string) {
  const [timeRemaining, setTimeRemaining] = useState('')
  const [isExpiringSoon, setIsExpiringSoon] = useState(false)

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date()
      const due = new Date(dueAt)
      const diff = due.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeRemaining('Expired')
        setIsExpiringSoon(false)
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h`)
        setIsExpiringSoon(days <= 2)
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`)
        setIsExpiringSoon(true)
      } else {
        setTimeRemaining(`${minutes}m`)
        setIsExpiringSoon(true)
      }
    }

    calculateTimeRemaining()
    const interval = setInterval(calculateTimeRemaining, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [dueAt])

  return { timeRemaining, isExpiringSoon }
}
```

---

### Phase 3: Enhanced Problem Cards 🎯

#### 3.3.1 Problem Card Structure Redesign

**Current Structure:**
```
Problem Card
├── Header (title, difficulty, marks)
├── Description
├── Constraints
├── Examples
├── Tags
└── Submission Area (language, editor, buttons)
```

**Improved Structure:**
```
Problem Card
├── Header (title, difficulty, marks, submission status badge)
├── Tabs (Description | Examples | Submissions)
│   ├── Description Tab
│   │   ├── Problem description
│   │   ├── Constraints (collapsible)
│   │   └── Tags
│   ├── Examples Tab
│   │   └── Enhanced examples with copy buttons
│   └── Submissions Tab
│       └── Submission history
└── Code Editor Area (sticky)
    ├── Language selector + Reset button
    ├── Code editor
    └── Action buttons (Save, Reset)
```

#### 3.3.2 Enhanced Problem Card Implementation

```tsx
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronUp,
  Code2,
  Lightbulb,
  Save,
  RotateCcw,
  Send,
  Loader2,
  AlertCircle,
  FileClock
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from '@/lib/utils'

// Problem Card Component
<div
  key={problem._id}
  className={cn(
    "group relative overflow-hidden rounded-2xl border bg-background shadow-sm transition-all duration-300",
    "hover:shadow-md"
  )}
>
  {/* Submission Status Indicator */}
  {submissionState[problem._id]?.message === "Submission saved successfully" && (
    <div className="absolute -right-1 -top-1 z-10">
      <div className="flex items-center gap-1 rounded-bl-xl rounded-tr-xl bg-green-500 px-3 py-1.5 text-xs font-medium text-white shadow-lg animate-in slide-in-from-top">
        <CheckCircle2 className="h-3.5 w-3.5 icon-bounce" />
        Saved
      </div>
    </div>
  )}

  <div className="p-6">
    {/* Enhanced Header */}
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
            {index + 1}
          </span>
          <h2 className="text-xl font-semibold">{problem.title}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge 
            variant="outline" 
            className={cn(
              "gap-1",
              problem.difficulty === 'Easy' && "border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400",
              problem.difficulty === 'Medium' && "border-yellow-500/50 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
              problem.difficulty === 'Hard' && "border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400",
            )}
          >
            {problem.difficulty === 'Easy' && <CheckCircle2 className="h-3 w-3" />}
            {problem.difficulty === 'Medium' && <AlertCircle className="h-3 w-3" />}
            {problem.difficulty === 'Hard' && <Lightbulb className="h-3 w-3" />}
            {problem.difficulty}
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <Award className="h-3 w-3" />
            {problem.marks} marks
          </Badge>
          {submissionState[problem._id]?.message === "Submission saved successfully" && (
            <Badge variant="success" className="gap-1">
              <CheckCircle2 className="h-3 w-3 icon-bounce" />
              Submitted
            </Badge>
          )}
        </div>
      </div>
    </div>

    {/* Tabs for Description, Examples, Submissions */}
    <Tabs defaultValue="description" className="mb-6">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="description" className="gap-2">
          <FileText className="h-4 w-4" />
          Description
        </TabsTrigger>
        <TabsTrigger value="examples" className="gap-2">
          <Lightbulb className="h-4 w-4" />
          Examples
        </TabsTrigger>
        <TabsTrigger value="submissions" className="gap-2">
          <FileClock className="h-4 w-4" />
          Submissions
        </TabsTrigger>
      </TabsList>

      {/* Description Tab */}
      <TabsContent value="description" className="space-y-4">
        <div>
          <h3 className="mb-2 flex items-center gap-2 font-medium">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            Problem Statement
          </h3>
          <p className="text-sm leading-7 text-muted-foreground">
            {problem.description}
          </p>
        </div>

        {problem.constraints?.length > 0 && (
          <Collapsible defaultOpen={false}>
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-muted/50 p-3 text-sm font-medium hover:bg-muted/80 transition-colors">
              <span className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                Constraints ({problem.constraints.length})
              </span>
              <ChevronDown className="h-4 w-4 transition-transform duration-200 [[data-state=open]&]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ul className="mt-3 space-y-2 rounded-lg border bg-background p-4">
                {problem.constraints.map((constraint, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                    {constraint}
                  </li>
                ))}
              </ul>
            </CollapsibleContent>
          </Collapsible>
        )}

        {problem.tags?.length > 0 && (
          <div>
            <h3 className="mb-2 flex items-center gap-2 font-medium">
              <Code2 className="h-4 w-4 text-muted-foreground" />
              Topics
            </h3>
            <div className="flex flex-wrap gap-2">
              {problem.tags.map((tag, idx) => (
                <Badge 
                  key={idx} 
                  variant="outline"
                  className="gap-1 hover:bg-muted transition-colors cursor-default"
                >
                  <Tag className="h-3 w-3" />
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </TabsContent>

      {/* Examples Tab */}
      <TabsContent value="examples" className="space-y-4">
        {problem.examples?.map((example, idx) => (
          <ExampleCard 
            key={idx} 
            example={example} 
            exampleNumber={idx + 1}
          />
        ))}
      </TabsContent>

      {/* Submissions Tab */}
      <TabsContent value="submissions" className="space-y-4">
        <SubmissionHistory problemId={problem._id} />
      </TabsContent>
    </Tabs>

    {/* Enhanced Code Editor Area */}
    <div className="rounded-xl border bg-muted/30 p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium">Language</label>
          <Select 
            value={submissionState[problem._id]?.language || "cpp"}
            onValueChange={(lang) => handleLanguageChange(problem._id, lang, problem.starterCode)}
          >
            <SelectTrigger className="w-[160px] gap-2">
              <Code2 className="h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cpp">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  C++
                </div>
              </SelectItem>
              <SelectItem value="java">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                  Java
                </div>
              </SelectItem>
              <SelectItem value="python">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-yellow-500" />
                  Python
                </div>
              </SelectItem>
              <SelectItem value="javascript">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  JavaScript
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleResetCode(problem._id, problem.starterCode)}
            className="gap-1.5"
            disabled={submissionState[problem._id]?.loading}
          >
            <RotateCcw className="h-4 w-4 icon-hover-scale" />
            Reset
          </Button>
          <Button
            onClick={() => handleSubmitSolution(problem._id)}
            disabled={submissionState[problem._id]?.loading || accessStatus !== "active"}
            className="gap-1.5"
            size="sm"
          >
            {submissionState[problem._id]?.loading ? (
              <>
                <Loader2 className="h-4 w-4 icon-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 icon-hover-scale" />
                Save
              </>
            )}
          </Button>
        </div>
      </div>

      <CodeEditor
        language={submissionState[problem._id]?.language || "cpp"}
        value={submissionState[problem._id]?.code || ""}
        onChange={(value) => handleInputChange(problem._id, "code", value)}
      />

      {/* Status Message */}
      {submissionState[problem._id]?.message && (
        <Alert 
          variant={submissionState[problem._id]?.message.includes("successfully") ? "success" : "info"}
          className="mt-4"
        >
          {submissionState[problem._id]?.message}
        </Alert>
      )}
    </div>
  </div>
</div>
```

---

### Phase 4: Example Card Component 📝

#### 3.4.1 Create Enhanced Example Card

**File:** `src/components/example-card.tsx` (new)

```tsx
'use client'

import { useState } from 'react'
import { Copy, Check, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Example {
  input: string
  output: string
  explanation?: string
}

interface ExampleCardProps {
  example: Example
  exampleNumber: number
}

export function ExampleCard({ example, exampleNumber }: ExampleCardProps) {
  const [copiedField, setCopiedField] = useState<'input' | 'output' | null>(null)

  const handleCopy = async (text: string, field: 'input' | 'output') => {
    await navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  return (
    <div className="rounded-xl border bg-muted/30 p-4 transition-all hover:shadow-md">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          Example {exampleNumber}
        </span>
      </div>

      <div className="space-y-4">
        {/* Input */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">Input</label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopy(example.input, 'input')}
              className="h-7 gap-1"
            >
              {copiedField === 'input' ? (
                <Check className="h-3.5 w-3.5 text-green-500 icon-bounce" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
          <pre className="overflow-x-auto rounded-lg border bg-background p-3 text-sm font-mono">
            {example.input}
          </pre>
        </div>

        {/* Output */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">Output</label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopy(example.output, 'output')}
              className="h-7 gap-1"
            >
              {copiedField === 'output' ? (
                <Check className="h-3.5 w-3.5 text-green-500 icon-bounce" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
          <pre className="overflow-x-auto rounded-lg border bg-background p-3 text-sm font-mono">
            {example.output}
          </pre>
        </div>

        {/* Explanation */}
        {example.explanation && (
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Lightbulb className="h-3.5 w-3.5 text-yellow-500 icon-pulse" />
              <label className="text-xs font-medium text-muted-foreground">Explanation</label>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              {example.explanation}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
```

---

### Phase 5: Keyboard Shortcuts ⌨️

#### 3.5.1 Create Keyboard Shortcuts Hook

**File:** `src/hooks/use-keyboard-shortcuts.ts` (new)

```typescript
'use client'

import { useEffect } from 'react'

interface KeyboardShortcutsOptions {
  onSave?: () => void
  onReset?: () => void
  enabled: boolean
}

export function useKeyboardShortcuts({
  onSave,
  onReset,
  enabled,
}: KeyboardShortcutsOptions) {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        onSave?.()
      }

      // Ctrl/Cmd + R to reset
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault()
        onReset?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onSave, onReset, enabled])
}
```

#### 3.5.2 Add Keyboard Shortcuts Info Component

```tsx
import { Keyboard } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function KeyboardShortcutsDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Keyboard className="h-4 w-4" />
          Shortcuts
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Save code</span>
            <kbd className="rounded-md border bg-muted px-2 py-1 text-xs font-mono">
              Ctrl/Cmd + S
            </kbd>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Reset code</span>
            <kbd className="rounded-md border bg-muted px-2 py-1 text-xs font-mono">
              Ctrl/Cmd + R
            </kbd>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

---

### Phase 6: Loading Skeletons ⏳

#### 3.6.1 Create Assignment Detail Skeletons

**File:** `src/components/ui/skeleton.tsx` (enhance)

```tsx
export function AssignmentDetailSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-2">
      {/* Header Skeleton */}
      <div className="rounded-2xl border bg-background p-8 shadow-sm">
        <div className="flex items-start gap-4">
          <Skeleton className="h-14 w-14 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
        <Skeleton className="mt-6 h-2 w-full" />
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>

      {/* Problem Card Skeleton */}
      <div className="rounded-2xl border bg-background p-6 shadow-sm">
        <div className="mb-6 space-y-2">
          <Skeleton className="h-6 w-1/2" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
        <Skeleton className="mb-4 h-4 w-full" />
        <Skeleton className="mb-4 h-4 w-2/3" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    </div>
  )
}
```

---

### Phase 7: Auto-Submit Confirmation 🔔

#### 3.7.1 Create Auto-Submit Warning Component

```tsx
import { AlertTriangle, Clock } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface AutoSubmitWarningProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  timeRemaining: string
}

export function AutoSubmitWarning({
  open,
  onOpenChange,
  onConfirm,
  timeRemaining,
}: AutoSubmitWarningProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500 icon-pulse" />
            Assignment Deadline Reached
          </AlertDialogTitle>
          <AlertDialogDescription>
            The deadline for this assignment has passed. Your current code will be 
            automatically submitted. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Review Code</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            <Clock className="mr-2 h-4 w-4" />
            Submit Now
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

---

## 4. File Structure

```
src/
├── app/
│   └── (dashboard)/
│       ├── DashboardLayoutClient.tsx (add theme toggle)
│       └── assignment/[id]/
│           └── page.tsx (redesigned)
├── components/
│   ├── ui/
│   │   ├── example-card.tsx (new)
│   │   ├── skeleton.tsx (enhanced)
│   │   └── alert.tsx (from admin plan)
│   ├── theme-toggle.tsx (from admin plan)
│   ├── auto-submit-warning.tsx (new)
│   └── keyboard-shortcuts-dialog.tsx (new)
├── hooks/
│   ├── use-theme.ts (from admin plan)
│   ├── use-time-remaining.ts (new)
│   └── use-keyboard-shortcuts.ts (new)
└── lib/
    └── utils.ts (add time formatting utilities)
```

---

## 5. New Component Dependencies

Install if not already present:

```bash
npm install @radix-ui/react-collapsible
npm install @radix-ui/react-tabs
npm install @radix-ui/react-select
```

---

## 6. Success Metrics

### 6.1 UX Metrics
- [ ] Improved submission completion rate
- [ ] Reduced time to submit assignments
- [ ] Better student satisfaction scores
- [ ] Decreased support requests about submissions

### 6.2 Visual Quality
- [ ] Consistent with other dashboard pages
- [ ] Proper theme support (light/dark)
- [ ] Responsive on all screen sizes
- [ ] Smooth animations and transitions

### 6.3 Code Quality
- [ ] No TypeScript errors
- [ ] Proper component separation
- [ ] Reusable components created
- [ ] Proper error handling

---

## 7. Testing Checklist

### 7.1 Functional Testing
- [ ] Theme toggle works in student dashboard
- [ ] Problem tabs switch correctly
- [ ] Code editor works in all languages
- [ ] Reset code functions properly
- [ ] Save submission works
- [ ] Auto-submit on deadline works
- [ ] Keyboard shortcuts function
- [ ] Copy examples to clipboard works

### 7.2 Visual Testing
- [ ] Light theme looks correct
- [ ] Dark theme looks correct
- [ ] Responsive on mobile (320px)
- [ ] Responsive on tablet (768px)
- [ ] Responsive on desktop (1920px)
- [ ] All states visible (hover, focus, active, disabled)
- [ ] Animations smooth and performant

### 7.3 Accessibility Testing
- [ ] Keyboard navigation works
- [ ] Screen reader announces correctly
- [ ] Focus indicators visible
- [ ] Color contrast meets WCAG AA
- [ ] ARIA labels present
- [ ] Keyboard shortcuts documented

---

## 8. Implementation Priority

### High Priority (Phase 1-2)
1. ✅ Theme toggle implementation
2. ✅ Enhanced header with progress bar
3. ✅ Time remaining indicator
4. ✅ Improved stats cards

### Medium Priority (Phase 3-4)
1. ✅ Tabbed problem layout
2. ✅ Enhanced examples with copy
3. ✅ Better submission feedback
4. ✅ Improved reset/submit buttons

### Low Priority (Phase 5-7)
1. Keyboard shortcuts
2. Auto-submit confirmation dialog
3. Submission history tab
4. Loading skeletons

---

## 9. Notes

- Reuse components from admin dashboard where possible (StatCard, Alert, etc.)
- Maintain consistent styling with other student dashboard pages
- Ensure smooth transition between assignment states (not-published → active → expired)
- Consider mobile experience for code editor (may need special handling)

---

*Created: March 28, 2026*
*Status: Ready for Implementation*
