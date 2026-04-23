'use client'

import React, { useEffect, useMemo, useState } from "react"
import axios from "axios"
import {
    BookOpen,
    CalendarDays,
    CheckCircle2,
    Clock3,
    Sparkles,
    Target,
    TimerReset,
    TrendingUp,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { FilterTabs } from "@/components/ui/filter-tabs"
import { Input } from "@/components/ui/input"
import { AssignmentCard } from "@/components/ui/assignment-card"
import {
    AssignmentCardSkeleton,
    AssignmentsDashboardSkeleton,
    StatsCardSkeleton,
} from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

type AssignmentStatus = "Active" | "Upcoming" | "Completed" | "Expired"

type Assignment = {
    _id: string
    title: string
    description: string
    totalProblems: number
    totalMarks: number
    publishAt: string
    dueAt: string
    status: AssignmentStatus
    problems?: unknown[]
}

export default function AssignmentPage() {
    const [search, setSearch] = useState("")
    const [activeTab, setActiveTab] = useState<"All" | AssignmentStatus>("All")
    const [assignments, setAssignments] = useState<Assignment[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchAssignments = async () => {
            try {
                const res = await axios.get("/api/student/assignments")
                setAssignments(res.data.assignments || [])
            } catch (error) {
                console.error("Error fetching assignments:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchAssignments()
    }, [])

    const filteredAssignments = useMemo(() => {
        return assignments.filter((assignment) => {
            const query = search.toLowerCase()
            const matchesSearch =
                assignment.title.toLowerCase().includes(query) ||
                assignment.description.toLowerCase().includes(query)

            const matchesTab = activeTab === "All" ? true : assignment.status === activeTab

            return matchesSearch && matchesTab
        })
    }, [assignments, search, activeTab])

    const tabs: Array<"All" | AssignmentStatus> = [
        "All",
        "Active",
        "Upcoming",
        "Completed",
        "Expired",
    ]

    const insights = useMemo(() => {
        const activeCount = assignments.filter((assignment) => assignment.status === "Active").length
        const upcomingCount = assignments.filter((assignment) => assignment.status === "Upcoming").length
        const completedCount = assignments.filter((assignment) => assignment.status === "Completed").length
        const expiredCount = assignments.filter((assignment) => assignment.status === "Expired").length
        const totalMarks = assignments.reduce((sum, assignment) => sum + assignment.totalMarks, 0)
        const totalProblems = assignments.reduce((sum, assignment) => sum + assignment.totalProblems, 0)

        const tone =
            activeCount > 0
                ? "You have live work ready to attempt."
                : upcomingCount > 0
                  ? "New assignments are scheduled to open soon."
                  : "Your assignment workspace is currently quiet."

        return {
            activeCount,
            upcomingCount,
            completedCount,
            expiredCount,
            totalMarks,
            totalProblems,
            tone,
        }
    }, [assignments])

    const canViewAssignment = (status: AssignmentStatus): boolean => {
        return status === "Active" || status === "Completed"
    }

    if (loading) {
        return (
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-8 pt-2 sm:px-6 xl:px-8">
                <AssignmentsDashboardSkeleton />
                <div className="grid gap-4 lg:grid-cols-3">
                    <StatsCardSkeleton />
                    <StatsCardSkeleton />
                    <StatsCardSkeleton />
                </div>
                <div className="grid gap-4">
                    <AssignmentCardSkeleton />
                    <AssignmentCardSkeleton />
                    <AssignmentCardSkeleton />
                </div>
            </div>
        )
    }

    return (
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-8 pt-2 sm:px-6 xl:px-8">
            <section className="relative overflow-hidden rounded-[32px] border border-border/60 bg-linear-to-br from-card via-card to-cyan-500/8 shadow-[0_28px_80px_-40px_rgba(0,0,0,0.65)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,0.12),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(6,182,212,0.12),transparent_30%)]" />
                <div className="relative grid gap-8 px-5 py-6 sm:px-7 sm:py-7 xl:grid-cols-[1.35fr_0.95fr] xl:px-8">
                    <div className="space-y-6">
                        <div className="flex flex-wrap items-center gap-3">
                            <Badge className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-cyan-500 shadow-none">
                                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                                Assignment Hub
                            </Badge>
                            <Badge variant="outline" className="rounded-full px-3 py-1">
                                <BookOpen className="mr-1.5 h-3.5 w-3.5" />
                                Active, upcoming, and completed work
                            </Badge>
                        </div>

                        <div className="space-y-3">
                            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                                A sharper view of everything you need to solve next
                            </h1>
                            <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                                Track open assignments, revisit completed work, and see your current
                                workload in one cleaner student workspace.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                                    Workspace Signal
                                </p>
                                <div className="mt-2 flex flex-wrap items-end gap-3">
                                    <span className="text-5xl font-black leading-none tracking-[-0.06em] text-cyan-500">
                                        {insights.activeCount}
                                    </span>
                                    <div className="mb-1 rounded-2xl border border-border/60 bg-background/70 px-3 py-2 text-sm text-muted-foreground backdrop-blur">
                                        {insights.tone}
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-3">
                                <HeroChip
                                    label="Active"
                                    value={String(insights.activeCount)}
                                    tone="emerald"
                                />
                                <HeroChip
                                    label="Completed"
                                    value={String(insights.completedCount)}
                                    tone="sky"
                                />
                                <HeroChip
                                    label="Upcoming"
                                    value={String(insights.upcomingCount)}
                                    tone="slate"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                        <SummaryPanel
                            icon={Target}
                            label="Problem Load"
                            value={String(insights.totalProblems)}
                            helper="Problems across your assignment workspace"
                            tone="sky"
                        />
                        <SummaryPanel
                            icon={TrendingUp}
                            label="Marks Available"
                            value={String(insights.totalMarks)}
                            helper="Total marks represented by all assignments"
                            tone="emerald"
                        />
                        <SummaryPanel
                            icon={TimerReset}
                            label="Expired"
                            value={String(insights.expiredCount)}
                            helper="Assignments no longer open for fresh work"
                            tone="amber"
                        />
                    </div>
                </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
                <SnapshotCard
                    icon={Clock3}
                    label="Live Assignments"
                    value={String(insights.activeCount)}
                    helper="Ready to attempt right now"
                    tone="emerald"
                />
                <SnapshotCard
                    icon={CheckCircle2}
                    label="Completed"
                    value={String(insights.completedCount)}
                    helper="Assignments you can revisit"
                    tone="sky"
                />
                <SnapshotCard
                    icon={CalendarDays}
                    label="Coming Soon"
                    value={String(insights.upcomingCount)}
                    helper="Scheduled to unlock later"
                    tone="violet"
                />
            </section>

            <section className="rounded-[28px] border border-border/60 bg-card/80 p-5 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)] backdrop-blur-sm sm:p-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="space-y-1.5">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                            Explore Assignments
                        </p>
                        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                            Search and filter your assignment timeline
                        </h2>
                    </div>

                    <div className="relative w-full xl:w-80">
                        <BookOpen className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search assignments..."
                            className="h-11 rounded-2xl border-border/60 bg-background/80 pl-10 shadow-sm"
                            aria-label="Search assignments"
                        />
                    </div>
                </div>

                <div className="mt-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <FilterTabs
                        tabs={tabs}
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        className="gap-2"
                    />

                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline" className="rounded-full px-3 py-1">
                            {filteredAssignments.length} shown
                        </Badge>
                        <Badge variant="outline" className="rounded-full px-3 py-1">
                            {insights.activeCount} active
                        </Badge>
                        <Badge variant="outline" className="rounded-full px-3 py-1">
                            {insights.completedCount} completed
                        </Badge>
                    </div>
                </div>
            </section>

            <section className="space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                            Assignment Feed
                        </p>
                        <h2 className="text-2xl font-semibold tracking-tight">
                            Your assignment cards
                        </h2>
                    </div>
                </div>

                {filteredAssignments.length > 0 ? (
                    <div className="grid gap-4" role="list" aria-label="Assignments list" aria-live="polite">
                        {filteredAssignments.map((assignment) => {
                            const canView = canViewAssignment(assignment.status)

                            return (
                                <AssignmentCard
                                    key={assignment._id}
                                    assignment={assignment}
                                    actionLabel={assignment.status === "Completed" ? "Review Assignment" : "Open Assignment"}
                                    actionDisabled={!canView}
                                    onAction={
                                        canView
                                            ? () => {
                                                  window.location.href = `/assignment/${assignment._id}`
                                              }
                                            : undefined
                                    }
                                />
                            )
                        })}
                    </div>
                ) : (
                    <EmptyState
                        title="No assignments found"
                        description="Try changing the search or filter to find the assignments you want."
                        className="rounded-[28px] border-border/60 bg-card/70 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)]"
                    />
                )}
            </section>
        </div>
    )
}

function HeroChip({
    label,
    value,
    tone,
}: {
    label: string
    value: string
    tone: "emerald" | "sky" | "slate"
}) {
    const tones = {
        emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
        sky: "border-sky-500/20 bg-sky-500/10 text-sky-500",
        slate: "border-border/60 bg-background/70 text-foreground",
    }

    return (
        <div className="rounded-2xl border border-border/60 bg-background/60 p-3 backdrop-blur-sm">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                {label}
            </p>
            <div className="mt-2 flex items-center justify-between gap-3">
                <span className="text-lg font-semibold tracking-tight">{value}</span>
                <span className={cn("rounded-full border px-2.5 py-1 text-xs font-medium", tones[tone])}>
                    Live
                </span>
            </div>
        </div>
    )
}

function SummaryPanel({
    icon: Icon,
    label,
    value,
    helper,
    tone,
}: {
    icon: React.ComponentType<{ className?: string }>
    label: string
    value: string
    helper: string
    tone: "sky" | "emerald" | "amber"
}) {
    const tones = {
        sky: "border-sky-500/20 bg-sky-500/10 text-sky-500",
        emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
        amber: "border-amber-500/20 bg-amber-500/10 text-amber-500",
    }

    return (
        <div className="rounded-[24px] border border-border/60 bg-background/70 p-4 backdrop-blur-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">{label}</p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{helper}</p>
                </div>
                <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl border", tones[tone])}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </div>
    )
}

function SnapshotCard({
    icon: Icon,
    label,
    value,
    helper,
    tone,
}: {
    icon: React.ComponentType<{ className?: string }>
    label: string
    value: string
    helper: string
    tone: "emerald" | "sky" | "violet"
}) {
    const tones = {
        emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
        sky: "border-sky-500/20 bg-sky-500/10 text-sky-500",
        violet: "border-violet-500/20 bg-violet-500/10 text-violet-500",
    }

    return (
        <div className="rounded-[28px] border border-border/60 bg-card/80 p-5 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)] backdrop-blur-sm sm:p-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">{label}</p>
                    <p className="mt-2 text-4xl font-black tracking-[-0.05em] text-foreground">
                        {value}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">{helper}</p>
                </div>
                <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl border", tones[tone])}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </div>
    )
}
