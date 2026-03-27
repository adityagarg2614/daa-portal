import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

/**
 * StatsCardSkeleton - Loading skeleton for statistics cards
 * Used in dashboards and list pages
 */
function StatsCardSkeleton() {
  return (
    <div className="rounded-2xl border bg-background p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-10 w-10 rounded-xl" />
      </div>
    </div>
  )
}

/**
 * AssignmentCardSkeleton - Loading skeleton for assignment cards
 * Used in assignment list pages (admin & student)
 */
function AssignmentCardSkeleton() {
  return (
    <div className="group relative overflow-hidden rounded-2xl border bg-background p-5 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-3 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2 xl:grid-cols-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
        <div className="flex min-w-[180px] flex-col items-start gap-3 xl:items-end">
          <Skeleton className="h-9 w-32 rounded-xl" />
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

/**
 * SubmissionCardSkeleton - Loading skeleton for submission cards
 * Used in submission list pages
 */
function SubmissionCardSkeleton() {
  return (
    <div className="group relative overflow-hidden rounded-2xl border bg-background p-5 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-3 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <Skeleton className="h-4 w-48" />
          <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2 xl:grid-cols-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
        <div className="flex min-w-[180px] flex-col items-start gap-3 xl:items-end">
          <Skeleton className="h-9 w-20 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

/**
 * ResultCardSkeleton - Loading skeleton for result/grade cards
 * Used in results page
 */
function ResultCardSkeleton() {
  return (
    <div className="group relative overflow-hidden rounded-2xl border bg-background p-5 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-3 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <Skeleton className="h-6 w-72" />
            <Skeleton className="h-6 w-32 rounded-full" />
          </div>
          <Skeleton className="h-4 w-64" />
          <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2 xl:grid-cols-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
        <div className="flex min-w-[180px] flex-col items-start gap-3 xl:items-end">
          <Skeleton className="h-9 w-24 rounded-xl" />
          <Skeleton className="h-9 w-40 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

/**
 * ProblemCardSkeleton - Loading skeleton for problem cards
 * Used in problem bank and assignment create pages
 */
function ProblemCardSkeleton() {
  return (
    <div className="rounded-2xl border p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-3 w-3 rounded" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-14 rounded-full" />
      </div>
    </div>
  )
}

/**
 * FormSkeleton - Loading skeleton for form pages
 * Used in create/edit pages
 */
function FormSkeleton() {
  return (
    <div className="space-y-6">
      {/* Assignment Details Section */}
      <div className="rounded-2xl border bg-background p-6 shadow-sm space-y-4">
        <Skeleton className="h-6 w-40" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
        <Skeleton className="h-32 w-full" />
      </div>

      {/* Problem Selection Section */}
      <div className="rounded-2xl border bg-background p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-60" />
          </div>
          <Skeleton className="h-11 w-80" />
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>

        {/* Problem Cards */}
        <div className="space-y-4">
          <ProblemCardSkeleton />
          <ProblemCardSkeleton />
          <ProblemCardSkeleton />
        </div>
      </div>
    </div>
  )
}

/**
 * InfoCardSkeleton - Loading skeleton for info cards
 * Used in home/dashboard pages for content sections
 */
function InfoCardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-2xl border bg-background p-6 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-5 rounded" />
        <Skeleton className="h-6 w-32" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    </div>
  )
}

/**
 * ListSkeleton - Loading skeleton for list items
 * Used in home/dashboard for list sections
 */
function ListSkeleton({ items = 3 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center justify-between rounded-xl border p-4">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      ))}
    </div>
  )
}

/**
 * PageHeaderSkeleton - Loading skeleton for page headers
 * Used as alternative to SectionHeader during loading
 */
function PageHeaderSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-2xl border bg-background p-8 shadow-sm">
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
    </div>
  )
}

/**
 * AssignmentDetailSkeleton - Loading skeleton for assignment detail page
 * Used in /assignment/[id] page
 */
function AssignmentDetailSkeleton() {
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

export {
  Skeleton,
  StatsCardSkeleton,
  AssignmentCardSkeleton,
  SubmissionCardSkeleton,
  ResultCardSkeleton,
  ProblemCardSkeleton,
  FormSkeleton,
  InfoCardSkeleton,
  ListSkeleton,
  PageHeaderSkeleton,
  AssignmentDetailSkeleton,
}
