'use client'

import axios from "axios"
import Link from "next/link"
import React, { useEffect, useMemo, useState } from "react"
import {
    AlertCircle,
    ArrowRight,
    Award,
    BookOpen,
    CalendarDays,
    CheckCircle2,
    Clock3,
    FileText,
    Plus,
    Search,
    Sparkles,
    Target,
    TimerReset,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { FilterTabs } from "@/components/ui/filter-tabs"
import { Input } from "@/components/ui/input"
import {
    AssignmentCardSkeleton,
    StatsCardSkeleton,
} from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

type Assignment = {
    _id: string
    title: string
    description: string
    totalProblems: number
    totalMarks: number
    publishAt: string
    dueAt: string
    problemIds?: {
        _id: string
        title: string
    }[]
}

type AssignmentStatus = "Upcoming" | "Active" | "Expired"

export default function AdminAssignmentsPage() {
    const [assignments, setAssignments] = useState<Assignment[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [activeTab, setActiveTab] = useState<"All" | AssignmentStatus>("All")

    useEffect(() => {
        const fetchAssignments = async () => {
            try {
                const res = await axios.get("/api/admin/assignments")
                setAssignments(res.data.assignments || [])
            } catch (error) {
                console.error("Error fetching assignments:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchAssignments()
    }, [])

    const getComputedStatus = (assignment: Assignment): AssignmentStatus => {
        const now = new Date()
        const publishAt = new Date(assignment.publishAt)
        const dueAt = new Date(assignment.dueAt)

        if (now < publishAt) return "Upcoming"
        if (now > dueAt) return "Expired"
        return "Active"
    }

    const statusCounts = useMemo(() => {
        const upcoming = assignments.filter((assignment) => getComputedStatus(assignment) === "Upcoming").length
        const active = assignments.filter((assignment) => getComputedStatus(assignment) === "Active").length
        const expired = assignments.filter((assignment) => getComputedStatus(assignment) === "Expired").length
        const totalMarks = assignments.reduce((sum, assignment) => sum + assignment.totalMarks, 0)
        const totalProblems = assignments.reduce((sum, assignment) => sum + assignment.totalProblems, 0)

        return {
            upcoming,
            active,
            expired,
            totalMarks,
            totalProblems,
        }
    }, [assignments])

    const filteredAssignments = useMemo(() => {
        return assignments.filter((assignment) => {
            const status = getComputedStatus(assignment)
            const query = search.toLowerCase()

            const matchesSearch =
                assignment.title.toLowerCase().includes(query) ||
                assignment.description.toLowerCase().includes(query) ||
                assignment.problemIds?.some((problem) =>
                    problem.title.toLowerCase().includes(query)
                )

            const matchesTab = activeTab === "All" ? true : status === activeTab

            return matchesSearch && matchesTab
        })
    }, [assignments, search, activeTab])

    const tabs: Array<"All" | AssignmentStatus> = [
        "All",
        "Upcoming",
        "Active",
        "Expired",
    ]

    if (loading) {
        return (
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-8 pt-2 sm:px-6 xl:px-8">
                <AssignmentsHeroSkeleton />
                <div className="grid gap-4 lg:grid-cols-3">
                    <StatsCardSkeleton />
                    <StatsCardSkeleton />
                    <StatsCardSkeleton />
                </div>
                <div className="rounded-[28px] border border-border/60 bg-card/80 p-5 shadow-sm sm:p-6">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                        <div className="space-y-2">
                            <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                            <div className="h-8 w-72 animate-pulse rounded bg-muted" />
                        </div>
                        <div className="h-11 w-full animate-pulse rounded-2xl bg-muted xl:w-80" />
                    </div>
                    <div className="mt-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                        <div className="flex flex-wrap gap-2">
                            <div className="h-10 w-20 animate-pulse rounded-full bg-muted" />
                            <div className="h-10 w-28 animate-pulse rounded-full bg-muted" />
                            <div className="h-10 w-24 animate-pulse rounded-full bg-muted" />
                            <div className="h-10 w-24 animate-pulse rounded-full bg-muted" />
                        </div>
                        <div className="h-10 w-40 animate-pulse rounded-full bg-muted" />
                    </div>
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
            <section className="relative overflow-hidden rounded-[32px] border border-border/60 bg-linear-to-br from-card via-card to-sky-500/8 shadow-[0_28px_80px_-40px_rgba(0,0,0,0.65)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.14),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.12),transparent_30%)]" />
                <div className="relative grid gap-8 px-5 py-6 sm:px-7 sm:py-7 xl:grid-cols-[1.35fr_0.95fr] xl:px-8">
                    <div className="space-y-6">
                        <div className="flex flex-wrap items-center gap-3">
                            <Badge className="rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-sky-500 shadow-none">
                                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                                Assignment Control Room
                            </Badge>
                            <Badge variant="outline" className="rounded-full px-3 py-1">
                                <BookOpen className="mr-1.5 h-3.5 w-3.5" />
                                Created assignments overview
                            </Badge>
                        </div>

                        <div className="space-y-3">
                            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                                Manage assignment publishing with a clearer overview
                            </h1>
                            <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                                Review timelines, monitor active work, and open the right assignment
                                instantly from a cleaner admin workspace.
                            </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                            <HeroChip
                                label="Total"
                                value={String(assignments.length)}
                                tone="slate"
                            />
                            <HeroChip
                                label="Active"
                                value={String(statusCounts.active)}
                                tone="emerald"
                            />
                            <HeroChip
                                label="Upcoming"
                                value={String(statusCounts.upcoming)}
                                tone="sky"
                            />
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                        <SummaryPanel
                            icon={Target}
                            label="Problem Coverage"
                            value={String(statusCounts.totalProblems)}
                            helper="Problems distributed across all assignments"
                            tone="sky"
                        />
                        <SummaryPanel
                            icon={Award}
                            label="Marks Planned"
                            value={String(statusCounts.totalMarks)}
                            helper="Combined marks across all created assignments"
                            tone="emerald"
                        />
                        <SummaryPanel
                            icon={TimerReset}
                            label="Expired Sets"
                            value={String(statusCounts.expired)}
                            helper="Assignments that have already closed"
                            tone="amber"
                        />
                    </div>
                </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
                <SnapshotCard
                    icon={FileText}
                    label="Assignments"
                    value={String(assignments.length)}
                    helper="Total items in the workspace"
                    tone="sky"
                />
                <SnapshotCard
                    icon={Clock3}
                    label="Live Now"
                    value={String(statusCounts.active)}
                    helper="Assignments currently visible to students"
                    tone="emerald"
                />
                <SnapshotCard
                    icon={CalendarDays}
                    label="Coming Up"
                    value={String(statusCounts.upcoming)}
                    helper="Assignments scheduled for later release"
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
                            Search, filter, and jump into any created assignment
                        </h2>
                    </div>

                    <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
                        <div className="relative w-full xl:w-80">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search title, description, or problem..."
                                className="h-11 rounded-2xl border-border/60 bg-background/80 pl-10 shadow-sm"
                                aria-label="Search assignments"
                            />
                        </div>

                        <Link href="/admin/assignments/create">
                            <Button className="h-11 rounded-2xl px-4">
                                <Plus className="mr-2 h-4 w-4" />
                                Create Assignment
                            </Button>
                        </Link>
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
                            {statusCounts.active} active
                        </Badge>
                        <Badge variant="outline" className="rounded-full px-3 py-1">
                            {statusCounts.expired} expired
                        </Badge>
                    </div>
                </div>
            </section>

            <section className="space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                            Assignment Library
                        </p>
                        <h2 className="text-2xl font-semibold tracking-tight">
                            Your created assignments
                        </h2>
                    </div>
                </div>

                {filteredAssignments.length > 0 ? (
                    <div className="grid gap-4" role="list" aria-label="Assignments list" aria-live="polite">
                        {filteredAssignments.map((assignment) => {
                            const status = getComputedStatus(assignment)
                            const statusConfig = getStatusConfig(status)

                            return (
                                <article
                                    key={assignment._id}
                                    role="listitem"
                                    className="group relative overflow-hidden rounded-[28px] border border-border/60 bg-card/80 p-5 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_24px_56px_-32px_rgba(0,0,0,0.55)] sm:p-6"
                                >
                                    <div
                                        className={cn(
                                            "absolute inset-x-0 top-0 h-px opacity-80",
                                            statusConfig.line
                                        )}
                                        aria-hidden="true"
                                    />

                                    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                                        <div className="flex-1 space-y-4">
                                            <div className="flex flex-wrap items-start justify-between gap-4">
                                                <div className="space-y-3">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <Badge
                                                            variant="outline"
                                                            className={cn("rounded-full px-3 py-1", statusConfig.badge)}
                                                        >
                                                            <statusConfig.icon className="mr-1.5 h-3.5 w-3.5" />
                                                            {status}
                                                        </Badge>
                                                        <Badge variant="outline" className="rounded-full px-3 py-1">
                                                            <Award className="mr-1.5 h-3.5 w-3.5" />
                                                            {assignment.totalMarks} marks
                                                        </Badge>
                                                        <Badge variant="outline" className="rounded-full px-3 py-1">
                                                            <BookOpen className="mr-1.5 h-3.5 w-3.5" />
                                                            {assignment.totalProblems} problems
                                                        </Badge>
                                                    </div>

                                                    <div>
                                                        <h3 className="text-xl font-semibold tracking-tight text-foreground">
                                                            {assignment.title}
                                                        </h3>
                                                        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                                                            {assignment.description}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="rounded-[22px] border border-border/60 bg-background/65 px-4 py-3 text-sm text-muted-foreground">
                                                    {status === "Active"
                                                        ? "Open and running"
                                                        : status === "Upcoming"
                                                            ? "Scheduled to open"
                                                            : "Closed for students"}
                                                </div>
                                            </div>

                                            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                                                <InfoTile
                                                    icon={CalendarDays}
                                                    label="Publish"
                                                    value={formatDateTime(assignment.publishAt)}
                                                />
                                                <InfoTile
                                                    icon={Clock3}
                                                    label="Due"
                                                    value={formatDateTime(assignment.dueAt)}
                                                />
                                                <InfoTile
                                                    icon={CheckCircle2}
                                                    label="Selected Problems"
                                                    value={String(assignment.problemIds?.length || assignment.totalProblems)}
                                                />
                                                <InfoTile
                                                    icon={FileText}
                                                    label="Workload"
                                                    value={`${assignment.totalMarks} marks total`}
                                                />
                                            </div>

                                            {assignment.problemIds && assignment.problemIds.length > 0 && (
                                                <div className="flex flex-wrap gap-2">
                                                    {assignment.problemIds.slice(0, 4).map((problem) => (
                                                        <Badge
                                                            key={problem._id}
                                                            variant="secondary"
                                                            className="rounded-full px-3 py-1"
                                                        >
                                                            {problem.title}
                                                        </Badge>
                                                    ))}
                                                    {assignment.problemIds.length > 4 && (
                                                        <Badge variant="secondary" className="rounded-full px-3 py-1">
                                                            +{assignment.problemIds.length - 4} more
                                                        </Badge>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex min-w-[210px] flex-col items-start gap-3 xl:items-end">
                                            <Link href={`/admin/assignments/${assignment._id}`}>
                                                <Button className="h-11 rounded-2xl px-4">
                                                    View Details
                                                    <ArrowRight className="ml-2 h-4 w-4" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </article>
                            )
                        })}
                    </div>
                ) : (
                    <EmptyState
                        title="No assignments found"
                        description="Try a different search or filter, or create a new assignment to start building the library."
                        className="rounded-[28px] border-border/60 bg-card/70 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)]"
                        action={
                            <Link href="/admin/assignments/create">
                                <Button className="rounded-2xl">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Assignment
                                </Button>
                            </Link>
                        }
                    />
                )}
            </section>
        </div>
    )
}

function formatDateTime(value: string) {
    return new Date(value).toLocaleString()
}

function getStatusConfig(status: AssignmentStatus) {
    switch (status) {
        case "Active":
            return {
                badge: "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
                line: "bg-linear-to-r from-emerald-500/70 via-emerald-500/20 to-transparent",
                icon: Clock3,
            }
        case "Upcoming":
            return {
                badge: "border-sky-500/20 bg-sky-500/10 text-sky-500",
                line: "bg-linear-to-r from-sky-500/70 via-sky-500/20 to-transparent",
                icon: CalendarDays,
            }
        case "Expired":
            return {
                badge: "border-amber-500/20 bg-amber-500/10 text-amber-500",
                line: "bg-linear-to-r from-amber-500/70 via-amber-500/20 to-transparent",
                icon: AlertCircle,
            }
    }
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
    tone: "sky" | "emerald" | "violet"
}) {
    const tones = {
        sky: "border-sky-500/20 bg-sky-500/10 text-sky-500",
        emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
        violet: "border-violet-500/20 bg-violet-500/10 text-violet-500",
    }

    return (
        <div className="rounded-[28px] border border-border/60 bg-card/80 p-5 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)]">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">{label}</p>
                    <p className="mt-2 text-4xl font-black tracking-tighter text-foreground">
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

function InfoTile({
    icon: Icon,
    label,
    value,
}: {
    icon: React.ComponentType<{ className?: string }>
    label: string
    value: string
}) {
    return (
        <div className="rounded-[22px] border border-border/60 bg-background/65 p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
                <Icon className="h-4 w-4" />
                <p className="text-xs font-semibold uppercase tracking-[0.18em]">{label}</p>
            </div>
            <p className="mt-3 text-sm font-medium leading-6 text-foreground">{value}</p>
        </div>
    )
}

function AssignmentsHeroSkeleton() {
    return (
        <div className="relative overflow-hidden rounded-[32px] border border-border/60 bg-background p-6 shadow-sm sm:p-7">
            <div className="grid gap-8 xl:grid-cols-[1.35fr_0.95fr]">
                <div className="space-y-6">
                    <div className="flex flex-wrap gap-3">
                        <div className="h-8 w-44 animate-pulse rounded-full bg-muted" />
                        <div className="h-8 w-52 animate-pulse rounded-full bg-muted" />
                    </div>
                    <div className="space-y-3">
                        <div className="h-10 w-4/5 animate-pulse rounded bg-muted" />
                        <div className="h-4 w-full animate-pulse rounded bg-muted" />
                        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                        <div className="h-20 animate-pulse rounded-2xl bg-muted" />
                        <div className="h-20 animate-pulse rounded-2xl bg-muted" />
                        <div className="h-20 animate-pulse rounded-2xl bg-muted" />
                    </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                    <div className="h-28 animate-pulse rounded-[24px] bg-muted" />
                    <div className="h-28 animate-pulse rounded-[24px] bg-muted" />
                    <div className="h-28 animate-pulse rounded-[24px] bg-muted" />
                </div>
            </div>
        </div>
    )
}
