import { StatsCardSkeleton } from "./skeleton"

/**
 * DashboardStatsSkeleton - Loading skeleton for dashboard stats grid
 * Shows 4 stat card skeletons in a responsive grid
 */
export function DashboardStatsSkeleton() {
    return (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" role="status" aria-label="Loading statistics">
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
        </div>
    )
}

/**
 * QuickActionsSkeleton - Loading skeleton for quick actions grid
 * Shows 4 action card skeletons
 */
export function QuickActionsSkeleton() {
    return (
        <div className="rounded-2xl border bg-background p-6 shadow-sm" role="status" aria-label="Loading quick actions">
            <div className="mb-4 h-6 w-32 animate-pulse rounded bg-muted" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-xl border bg-background p-5 space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="h-10 w-10 rounded-lg bg-muted animate-pulse" />
                            <div className="flex-1 space-y-2">
                                <div className="h-5 w-32 bg-muted animate-pulse rounded" />
                                <div className="h-4 w-48 bg-muted animate-pulse rounded" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

/**
 * GuideSectionSkeleton - Loading skeleton for guide/onboarding sections
 */
export function GuideSectionSkeleton() {
    return (
        <div className="rounded-2xl border bg-background p-6 shadow-sm" role="status" aria-label="Loading guide">
            <div className="mb-4 h-6 w-40 animate-pulse rounded bg-muted" />
            <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-start gap-3">
                        <div className="h-6 w-6 rounded-full bg-muted animate-pulse shrink-0" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 w-48 bg-muted animate-pulse rounded" />
                            <div className="h-4 w-full bg-muted animate-pulse rounded" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
