import {
    Skeleton,
    StatsCardSkeleton,
    PageHeaderSkeleton,
} from "@/components/ui/skeleton";

export default function StudentsLoading() {
    return (
        <div className="space-y-6 pb-8">
            {/* Header Skeleton */}
            <PageHeaderSkeleton />

            {/* Stats Cards Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCardSkeleton />
                <StatsCardSkeleton />
                <StatsCardSkeleton />
                <StatsCardSkeleton />
            </div>

            {/* Filters Skeleton */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
                <Skeleton className="h-9 w-full sm:max-w-md" />
                <div className="flex flex-wrap items-center gap-2">
                    <Skeleton className="h-9 w-32" />
                    <Skeleton className="h-9 w-40" />
                    <Skeleton className="h-9 w-24" />
                </div>
            </div>

            {/* Table Skeleton */}
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                {/* Table Header */}
                <div className="bg-muted/50 p-4 border-b">
                    <div className="grid grid-cols-9 gap-4">
                        <Skeleton className="h-4 col-span-2" />
                        <Skeleton className="h-4 col-span-1 hidden md:block" />
                        <Skeleton className="h-4 col-span-1 hidden lg:block" />
                        <Skeleton className="h-4 col-span-1" />
                        <Skeleton className="h-4 col-span-1" />
                        <Skeleton className="h-4 col-span-1 hidden sm:block" />
                        <Skeleton className="h-4 col-span-1 hidden lg:block" />
                        <Skeleton className="h-4 col-span-1" />
                    </div>
                </div>
                {/* Table Rows */}
                <div className="divide-y">
                    {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className="p-4 grid grid-cols-9 gap-4 items-center">
                            <div className="col-span-2 flex items-center gap-3">
                                <Skeleton className="h-9 w-9 rounded-full" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-20 hidden md:block" />
                                </div>
                            </div>
                            <Skeleton className="h-4 w-24 hidden md:block" />
                            <Skeleton className="h-4 w-40 hidden lg:block" />
                            <Skeleton className="h-6 w-12 mx-auto" />
                            <div className="flex flex-col items-center gap-1">
                                <Skeleton className="h-4 w-12" />
                                <Skeleton className="h-5 w-20" />
                            </div>
                            <div className="hidden sm:block space-y-2">
                                <Skeleton className="h-4 w-12" />
                                <Skeleton className="h-2 w-24" />
                            </div>
                            <Skeleton className="h-4 w-24 hidden lg:block mx-auto" />
                            <Skeleton className="h-6 w-20 mx-auto" />
                            <Skeleton className="h-8 w-8 ml-auto" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Pagination Skeleton */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <Skeleton className="h-4 w-48" />
                <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-8 w-16" />
                </div>
                <div className="flex items-center gap-1">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-24" />
                </div>
            </div>
        </div>
    );
}
