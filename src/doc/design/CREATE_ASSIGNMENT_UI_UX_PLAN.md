# Create Assignment Page - UI/UX Improvement Plan

## Overview

**Page:** `/admin/assignments/create`  
**Users:** Professors, Teaching Assistants  
**Goal:** Streamline the assignment creation process with improved visual hierarchy, better UX patterns, and consistent branding  

---

## 1. Current State Analysis

### 1.1 What Works Well
- ✅ Clear form structure with logical sections
- ✅ Problem search functionality
- ✅ Visual feedback for selected problems
- ✅ Summary statistics (selected problems, total marks)
- ✅ Responsive grid layouts

### 1.2 Areas for Improvement
- ❌ **No theme toggle** - users can't switch between light/dark modes
- ❌ Flat visual hierarchy - all sections look similar
- ❌ No visual feedback on form validation
- ❌ Problem cards lack clear interaction states
- ❌ Missing helpful UI patterns (tooltips, hints)
- ❌ No loading skeletons for better perceived performance
- ❌ Message alerts not styled consistently
- ❌ No confirmation before submission
- ❌ Limited keyboard navigation support
- ❌ No way to reorder selected problems
- ❌ Search could be more prominent with filters

---

## 2. Design Goals

### 2.1 Primary Goals
1. **Implement theme toggle** in navbar (light/dark mode) with animated icon transition
2. **Improve visual hierarchy** with better spacing and typography
3. **Enhance form UX** with real-time validation and helpful hints
4. **Create clearer interaction states** for problem selection
5. **Add micro-interactions** with **lucide-react animated icons** for better feedback

### 2.2 Secondary Goals
1. Improve accessibility (keyboard navigation, ARIA labels)
2. Add loading skeletons for smoother experience
3. Implement confirmation dialog before submission
4. Add problem reordering capability
5. Enhanced search with filters (difficulty, tags)
6. Use animated icons throughout for enhanced UX

---

## 3. Implementation Plan

### Phase 1: Theme System Foundation 🔧

#### 3.1.1 Create Theme Provider Hook
**File:** `src/hooks/use-theme.ts` (new)

```typescript
'use client'

import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('theme') as Theme
    const system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    setTheme(saved || system)
  }, [])

  useEffect(() => {
    if (mounted) {
      document.documentElement.classList.toggle('dark', theme === 'dark')
      localStorage.setItem('theme', theme)
    }
  }, [theme, mounted])

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light')

  return { theme, toggleTheme, mounted }
}
```

#### 3.1.2 Create Theme Toggle Component
**File:** `src/components/theme-toggle.tsx` (new)

```tsx
'use client'

import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/hooks/use-theme'

export function ThemeToggle() {
  const { theme, toggleTheme, mounted } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="relative"
    >
      <div className="relative">
        <Sun 
          className={cn(
            "h-5 w-5 transition-all duration-300",
            "icon-hover-rotate",
            mounted && theme === 'dark' ? "rotate-90 opacity-0" : "rotate-0 opacity-100"
          )} 
        />
        <Moon 
          className={cn(
            "absolute inset-0 h-5 w-5 transition-all duration-300",
            "icon-hover-rotate",
            mounted && theme === 'dark' ? "rotate-0 opacity-100" : "-rotate-90 opacity-0"
          )} 
        />
      </div>
    </Button>
  )
}
```

#### 3.1.3 Add Theme Toggle to Admin Navbar
**File:** `src/app/(dashboardAdmin)/DashboardLayoutClient.tsx`

- Locate the navbar/header section
- Add `<ThemeToggle />` component in the top-right area
- Ensure proper spacing and alignment

#### 3.1.4 Add Theme Toggle to Student Navbar
**File:** `src/app/(dashboard)/DashboardLayoutClient.tsx`

- Same implementation as admin navbar
- Maintain consistent placement

---

### Phase 2: Enhanced Form Components 🎨

#### 3.2.1 Create Form Field Component
**File:** `src/components/ui/form-field.tsx` (new)

```tsx
import { cn } from "@/lib/utils"

interface FormFieldProps {
  label: string
  error?: string
  hint?: string
  required?: boolean
  children: React.ReactNode
  className?: string
}

export function FormField({ 
  label, 
  error, 
  hint, 
  required, 
  children,
  className 
}: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
      {hint && !error && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  )
}
```

#### 3.2.2 Create Alert Component for Messages
**File:** `src/components/ui/alert.tsx` (enhance existing)

```tsx
import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type AlertVariant = 'default' | 'success' | 'error' | 'warning' | 'info'

interface AlertProps {
  variant?: AlertVariant
  title?: string
  children: React.ReactNode
  onDismiss?: () => void
}

export function Alert({ 
  variant = 'default', 
  title, 
  children,
  onDismiss 
}: AlertProps) {
  const icons = {
    default: null,
    success: <CheckCircle2 className="h-5 w-5 icon-bounce" />,
    error: <XCircle className="h-5 w-5 icon-shake" />,
    warning: <AlertCircle className="h-5 w-5 icon-pulse" />,
    info: <Info className="h-5 w-5 icon-pulse" />,
  }

  const variants = {
    default: 'border-border bg-background',
    success: 'border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400',
    error: 'border-destructive bg-destructive/10 text-destructive',
    warning: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
    info: 'border-blue-500/50 bg-blue-500/10 text-blue-600 dark:text-blue-400',
  }

  return (
    <div 
      className={cn(
        "relative flex w-full items-start gap-3 rounded-xl border p-4 text-sm",
        variants[variant]
      )}
      role="alert"
    >
      {icons[variant]}
      <div className="flex-1 space-y-1">
        {title && <p className="font-medium">{title}</p>}
        {children}
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="rounded-md p-1 hover:bg-background/50 transition-colors"
          aria-label="Dismiss alert"
        >
          <XCircle className="h-4 w-4 icon-hover-scale" />
        </button>
      )}
    </div>
  )
}
```

#### 3.2.3 Create Loading Skeleton Component
**File:** `src/components/ui/skeleton.tsx` (enhance existing)

```tsx
export function ProblemCardSkeleton() {
  return (
    <div className="rounded-2xl border p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <div className="h-5 w-3/4 rounded-md bg-muted animate-pulse" />
          <div className="h-4 w-1/2 rounded-md bg-muted animate-pulse" />
        </div>
        <div className="h-8 w-20 rounded-lg bg-muted animate-pulse" />
      </div>
      <div className="flex gap-2">
        <div className="h-6 w-16 rounded-full bg-muted animate-pulse" />
        <div className="h-6 w-16 rounded-full bg-muted animate-pulse" />
      </div>
    </div>
  )
}
```

---

### Phase 3: Page Layout Redesign 📐

#### 3.3.1 Improved Header Section

**Current:**
```tsx
<div className="rounded-2xl border bg-background p-6 shadow-sm">
  <h1 className="text-2xl font-bold tracking-tight">Create Assignment</h1>
  <p className="mt-2 text-sm text-muted-foreground">...</p>
</div>
```

**Improved:**
```tsx
import { FileText, Sparkles } from 'lucide-react'

<div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-background to-muted p-8 shadow-sm">
  <div className="relative z-10">
    <div className="flex items-center gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
        <FileText className="h-6 w-6 icon-bounce" />
      </div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create Assignment</h1>
        <p className="text-sm text-muted-foreground">
          Build a new assignment by selecting problems from the problem bank
        </p>
      </div>
      <div className="ml-auto hidden items-center gap-2 lg:flex">
        <Badge variant="outline" className="gap-1">
          <Sparkles className="h-3 w-3 icon-pulse" />
          Admin
        </Badge>
      </div>
    </div>
  </div>
  {/* Decorative background elements */}
  <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/5 blur-3xl" />
  <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-primary/5 blur-3xl" />
</div>
```

#### 3.3.2 Enhanced Stats Cards

**Current:** Simple bordered divs

**Improved:**
```tsx
import { CheckCircle2, Award, Library } from 'lucide-react'

<div className="grid gap-4 md:grid-cols-3">
  <StatCard
    icon={CheckCircle2}
    label="Selected Problems"
    value={selectedProblemIds.length}
    variant="primary"
  />
  <StatCard
    icon={Award}
    label="Total Marks"
    value={totalMarks}
    variant="success"
  />
  <StatCard
    icon={Library}
    label="Available Problems"
    value={problems.length}
    variant="default"
  />
</div>

// StatCard Component
interface StatCardProps {
  icon: LucideIcon
  label: string
  value: number | string
  variant?: 'default' | 'primary' | 'success'
}

function StatCard({ icon: Icon, label, value, variant = 'default' }: StatCardProps) {
  const variants = {
    default: 'bg-background text-foreground',
    primary: 'bg-primary/5 text-primary border-primary/20',
    success: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
  }

  return (
    <div className={cn(
      "relative overflow-hidden rounded-xl border p-4 transition-all duration-300 hover:shadow-md",
      variants[variant]
    )}>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50">
          <Icon className="h-5 w-5 icon-hover-scale" />
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold tabular-nums">{value}</p>
        </div>
      </div>
      {/* Subtle gradient overlay */}
      <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-gradient-to-br from-current to-transparent opacity-5" />
    </div>
  )
}
```

---

### Phase 4: Problem Selection Enhancement 🎯

#### 3.4.1 Enhanced Search Bar

**Current:** Simple text input

**Improved:**
```tsx
import { Search, X, Filter } from 'lucide-react'

<div className="flex flex-col gap-4 lg:flex-row lg:items-center">
  {/* Search Input */}
  <div className="relative flex-1">
    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground icon-pulse" />
    <input
      type="text"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      placeholder="Search by title, slug, or tags..."
      className="h-11 w-full rounded-xl border bg-background pl-10 pr-10 text-sm outline-none 
                 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 
                 transition-all"
    />
    {search && (
      <button
        onClick={() => setSearch('')}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-muted transition-colors"
        aria-label="Clear search"
      >
        <X className="h-4 w-4 icon-hover-scale" />
      </button>
    )}
  </div>

  {/* Filter Dropdown */}
  <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
    <SelectTrigger className="w-[180px] gap-2">
      <Filter className="h-4 w-4" />
      <SelectValue placeholder="All Difficulties" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All Difficulties</SelectItem>
      <SelectItem value="easy">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          Easy
        </div>
      </SelectItem>
      <SelectItem value="medium">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-yellow-500" />
          Medium
        </div>
      </SelectItem>
      <SelectItem value="hard">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          Hard
        </div>
      </SelectItem>
    </SelectContent>
  </Select>
</div>
```

#### 3.4.2 Enhanced Problem Cards

**Current:** Basic card with select button

**Improved:**
```tsx
import { Plus, X, Tag, Code2 } from 'lucide-react'

<div
  className={cn(
    "group relative overflow-hidden rounded-2xl border p-5 transition-all duration-300",
    isSelected 
      ? "border-primary bg-primary/5 shadow-md ring-1 ring-primary" 
      : "bg-background hover:shadow-md hover:border-muted-foreground/30"
  )}
>
  {/* Selection indicator */}
  {isSelected && (
    <div className="absolute -left-1 top-0 bottom-0 w-1 bg-primary animate-in slide-in-from-left" />
  )}
  
  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
    <div className="space-y-3 flex-1">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-lg font-semibold">{problem.title}</h3>
        <Badge variant={getDifficultyVariant(problem.difficulty)}>
          {problem.difficulty === 'Easy' && <CheckCircle2 className="mr-1 h-3 w-3" />}
          {problem.difficulty === 'Medium' && <AlertCircle className="mr-1 h-3 w-3" />}
          {problem.difficulty === 'Hard' && <Zap className="mr-1 h-3 w-3" />}
          {problem.difficulty}
        </Badge>
        <Badge variant="outline" className="gap-1">
          <Award className="h-3 w-3" />
          {problem.marks}
        </Badge>
      </div>

      {/* Slug */}
      <div className="flex items-center gap-2">
        <Code2 className="h-3.5 w-3.5 text-muted-foreground" />
        <p className="font-mono text-xs text-muted-foreground">
          <code className="rounded-md bg-muted/50 px-2 py-0.5">{problem.slug}</code>
        </p>
      </div>

      {/* Tags */}
      {problem.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {problem.tags.map((tag, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium transition-colors hover:bg-muted/80"
            >
              <Tag className="h-3 w-3" />
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>

    {/* Action Button */}
    <Button
      type="button"
      variant={isSelected ? "outline" : "default"}
      size="sm"
      onClick={() => handleProblemToggle(problem._id)}
      className={cn(
        "transition-all duration-300",
        isSelected 
          ? "border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
          : "icon-hover-scale"
      )}
    >
      {isSelected ? (
        <>
          <X className="mr-2 h-4 w-4 icon-shake" />
          Remove
        </>
      ) : (
        <>
          <Plus className="mr-2 h-4 w-4 icon-hover-scale" />
          Select
        </>
      )}
    </Button>
  </div>
</div>
```

#### 3.4.3 Selected Problems Panel (New)

```tsx
import { X, Trash2 } from 'lucide-react'

{selectedProblems.length > 0 && (
  <div className="rounded-xl border bg-muted/30 p-4">
    <div className="mb-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-primary icon-bounce" />
        <h4 className="text-sm font-semibold">
          Selected Problems ({selectedProblems.length})
        </h4>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setSelectedProblemIds([])}
        className="h-7 text-xs gap-1.5"
      >
        <Trash2 className="h-3.5 w-3.5" />
        Clear All
      </Button>
    </div>
    <div className="flex flex-wrap gap-2">
      {selectedProblems.map((problem) => (
        <div
          key={problem._id}
          className="group inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm transition-all hover:bg-primary/20"
        >
          <span className="font-medium">{problem.title}</span>
          <Badge variant="outline" size="sm" className="gap-1">
            <Award className="h-3 w-3" />
            {problem.marks}
          </Badge>
          <button
            onClick={() => handleProblemToggle(problem._id)}
            className="rounded-full p-0.5 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-primary/20"
            aria-label={`Remove ${problem.title}`}
          >
            <X className="h-3.5 w-3.5 icon-hover-scale" />
          </button>
        </div>
      ))}
    </div>
  </div>
)}
```

---

### Phase 5: Form Submission Improvements 🚀

#### 3.5.1 Confirmation Dialog

**File:** `src/components/confirmation-dialog.tsx` (new)

```tsx
'use client'

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

interface ConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  title = "Confirm Submission",
  description = "Are you sure you want to proceed? This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
}: ConfirmationDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelText}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

#### 3.5.2 Enhanced Submit Button

```tsx
import { Loader2, CheckCircle2, Send } from 'lucide-react'

<Button
  type="submit"
  disabled={submitting || selectedProblemIds.length === 0 || !title || !description}
  className="w-full md:w-auto min-w-[200px] gap-2"
  size="lg"
>
  {submitting ? (
    <>
      <Loader2 className="h-4 w-4 icon-spin" />
      <span>Creating Assignment...</span>
    </>
  ) : (
    <>
      <Send className="h-4 w-4 icon-hover-scale" />
      <span>Create Assignment</span>
    </>
  )}
</Button>

// Success state after submission
{submitSuccess && (
  <Alert variant="success" title="Assignment Created!">
    <div className="flex items-center gap-2">
      <CheckCircle2 className="h-4 w-4 icon-bounce" />
      <span>Your assignment has been created successfully.</span>
    </div>
  </Alert>
)}
```

---

### Phase 6: Accessibility Enhancements ♿

#### 3.6.1 ARIA Labels & Descriptions

```tsx
// Form fields
<div role="group" aria-labelledby="assignment-details-heading">
  <h2 id="assignment-details-heading" className="sr-only">
    Assignment Details
  </h2>
  {/* form fields */}
</div>

// Problem list
<div 
  role="list" 
  aria-label="Available problems"
  aria-live="polite"
>
  {problems.map(problem => (
    <div role="listitem" key={problem._id}>
      {/* problem card */}
    </div>
  ))}
</div>

// Selection feedback
<div 
  role="status" 
  aria-live="polite"
  className="sr-only"
>
  {selectedProblemIds.length} problems selected
</div>
```

#### 3.6.2 Keyboard Navigation

```tsx
// Add keyboard support for problem cards
<div
  tabIndex={0}
  role="button"
  aria-pressed={isSelected}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleProblemToggle(problem._id)
    }
  }}
>
  {/* card content */}
</div>
```

---

## 4. File Structure

```
src/
├── app/
│   ├── (dashboardAdmin)/
│   │   └── DashboardLayoutClient.tsx (add theme toggle)
│   └── (dashboard)/
│       └── DashboardLayoutClient.tsx (add theme toggle)
├── components/
│   ├── ui/
│   │   ├── form-field.tsx (new)
│   │   ├── alert.tsx (enhanced)
│   │   └── skeleton.tsx (enhanced)
│   ├── theme-toggle.tsx (new)
│   ├── confirmation-dialog.tsx (new)
│   └── stat-card.tsx (new)
├── hooks/
│   └── use-theme.ts (new)
└── app/(dashboardAdmin)/admin/assignments/create/
    └── page.tsx (redesigned)
```

---

## 5. Success Metrics

### 5.1 UX Metrics
- [ ] Reduced time to create assignment (target: -30%)
- [ ] Increased problem selection accuracy
- [ ] Reduced form submission errors
- [ ] Improved accessibility score (target: 100/100)

### 5.2 Visual Quality
- [ ] Consistent with brand guidelines
- [ ] Proper theme support (light/dark)
- [ ] Responsive on all screen sizes
- [ ] Smooth animations and transitions

### 5.3 Code Quality
- [ ] No TypeScript errors
- [ ] Proper component separation
- [ ] Reusable components created
- [ ] Proper error handling

---

## 6. Testing Checklist

### 6.1 Functional Testing
- [ ] Theme toggle works in both dashboards
- [ ] Theme persists across page reloads
- [ ] Form validation works correctly
- [ ] Problem selection/deselection works
- [ ] Search and filters work
- [ ] Assignment creation succeeds
- [ ] Error messages display correctly

### 6.2 Visual Testing
- [ ] Light theme looks correct
- [ ] Dark theme looks correct
- [ ] Responsive on mobile (320px)
- [ ] Responsive on tablet (768px)
- [ ] Responsive on desktop (1920px)
- [ ] All states visible (hover, focus, active, disabled)

### 6.3 Accessibility Testing
- [ ] Keyboard navigation works
- [ ] Screen reader announces correctly
- [ ] Focus indicators visible
- [ ] Color contrast meets WCAG AA
- [ ] ARIA labels present

---

## 7. Implementation Priority

### High Priority (Phase 1-2)
1. ✅ Theme toggle implementation
2. ✅ Form field component
3. ✅ Alert component
4. ✅ Basic layout improvements

### Medium Priority (Phase 3-4)
1. Enhanced problem cards
2. Stats cards with icons
3. Search improvements
4. Selected problems panel

### Low Priority (Phase 5-6)
1. Confirmation dialog
2. Problem reordering
3. Advanced filters
4. Full accessibility audit

---

## 8. Next Steps

1. **Review and approve** this plan
2. **Implement Phase 1** (Theme System)
3. **Test theme toggle** in both dashboards
4. **Proceed to Phase 2** (Form Components)
5. **Iterate based on feedback**

---

*Created: March 27, 2026*  
*Status: Ready for Implementation*
