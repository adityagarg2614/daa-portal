'use client'

import React, { useEffect, useState, useCallback, useMemo } from "react"
import { useRefetchOnFocus } from "@/hooks/use-refetch-on-focus"
import {
    Activity,
    ArrowRight,
    BriefcaseBusiness,
    CalendarClock,
    Clock,
    Code2,
    FileText,
    Library,
    LucideIcon,
    Medal,
    ShieldCheck,
    Sparkles,
    Users,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface DashboardStats {
    totalProblems: number
    totalAssignments: number
    totalSubmissions: number
    activeAssignments: number
}

export default function AdminDashboardHomePage() {
    const [stats, setStats] = useState<DashboardStats>({
        totalProblems: 0,
        totalAssignments: 0,
        totalSubmissions: 0,
        activeAssignments: 0,
    })
    const [loading, setLoading] = useState(true)

    const fetchDashboardData = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/dashboard");
            const data = await res.json();
            if (data.success) {
                setStats(data.stats)
            }
        } catch (error) {
            console.error("Failed to fetch dashboard data:", error)
        } finally {
            setLoading(false)
        }
    }, [])

    // Initial fetch on mount
    useEffect(() => {
        const timer = window.setTimeout(() => {
            void fetchDashboardData()
        }, 0)

        return () => window.clearTimeout(timer)
    }, [fetchDashboardData])

    // Refetch when navigating back via browser back button or window focus
    useRefetchOnFocus(fetchDashboardData)

    const quickActions = [
        {
            title: "Create Assignment",
            description: "Build a new assignment with the right set of problems",
            icon: FileText,
            href: "/admin/assignments/create",
            tone: "sky",
        },
        {
            title: "Create Problem",
            description: "Add a new reusable problem to the shared bank",
            icon: Code2,
            href: "/admin/problems/create",
            tone: "emerald",
        },
        {
            title: "View Assignments",
            description: "Review live, upcoming, and expired assignments",
            icon: Library,
            href: "/admin/assignments",
            tone: "amber",
        },
        {
            title: "Manage Students",
            description: "Track learner activity, performance, and student details",
            icon: Users,
            href: "/admin/students",
            tone: "violet",
        },
    ] as const

    const insights = useMemo(() => {
        const avgProblemsPerAssignment =
            stats.totalAssignments > 0
                ? Math.round((stats.totalProblems / stats.totalAssignments) * 10) / 10
                : 0

        const submissionPressure =
            stats.totalSubmissions > 0
                ? Math.round(stats.totalSubmissions / Math.max(stats.totalAssignments, 1))
                : 0

        const statusTone =
            stats.activeAssignments > 0
                ? "Your admin workspace has live assignments students can work on right now."
                : "No assignments are currently active, so this is a good moment to plan the next release."

        return {
            avgProblemsPerAssignment,
            submissionPressure,
            statusTone,
        }
    }, [stats])

    return (
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-8 pt-2 sm:px-6 xl:px-8">
            {loading ? (
                <AdminHomeSkeleton />
            ) : (
                <>
                    <section className="relative overflow-hidden rounded-[32px] border border-border/60 bg-linear-to-br from-card via-card to-sky-500/8 shadow-[0_28px_80px_-40px_rgba(0,0,0,0.65)]">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.14),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.12),transparent_30%)]" />
                        <div className="relative grid gap-8 px-5 py-6 sm:px-7 sm:py-7 xl:grid-cols-[1.35fr_0.95fr] xl:px-8">
                            <div className="space-y-6">
                                <div className="flex flex-wrap items-center gap-3">
                                    <Badge className="rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-sky-500 shadow-none">
                                        <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                                        Admin Dashboard
                                    </Badge>
                                    <Badge variant="outline" className="rounded-full px-3 py-1">
                                        <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                                        Course operations and publishing control
                                    </Badge>
                                </div>

                                <div className="space-y-3">
                                    <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                                        Admin Dashboard
                                    </h1>
                                    <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                                        Manage assignment flow, expand the problem bank, monitor classroom activity,
                                        and move into the right admin workspace with less friction.
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                                            Operations Signal
                                        </p>
                                        <div className="mt-2 flex flex-wrap items-end gap-3">
                                            <span className="text-5xl font-black leading-none tracking-[-0.06em] text-sky-500">
                                                {stats.activeAssignments}
                                            </span>
                                            <div className="mb-1 rounded-2xl border border-border/60 bg-background/70 px-3 py-2 text-sm text-muted-foreground backdrop-blur">
                                                {insights.statusTone}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid gap-3 sm:grid-cols-3">
                                        <HeroChip label="Assignments" value={String(stats.totalAssignments)} tone="sky" />
                                        <HeroChip label="Problem Bank" value={String(stats.totalProblems)} tone="emerald" />
                                        <HeroChip label="Submissions" value={String(stats.totalSubmissions)} tone="amber" />
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                                <SummaryPanel
                                    icon={Clock}
                                    label="Active Assignments"
                                    value={String(stats.activeAssignments)}
                                    helper="Assignments currently open to students"
                                    tone="sky"
                                />
                                <SummaryPanel
                                    icon={Activity}
                                    label="Submission Pressure"
                                    value={String(insights.submissionPressure)}
                                    helper="Average submissions per assignment in the current dataset"
                                    tone="emerald"
                                />
                                <SummaryPanel
                                    icon={Medal}
                                    label="Problem Density"
                                    value={String(insights.avgProblemsPerAssignment)}
                                    helper="Average problems packed into each assignment"
                                    tone="amber"
                                />
                            </div>
                        </div>
                    </section>

                    <section className="grid gap-4 lg:grid-cols-3">
                        <SnapshotCard
                            icon={FileText}
                            label="Assignments"
                            value={String(stats.totalAssignments)}
                            helper="Published and draft-ready workspaces"
                            tone="sky"
                        />
                        <SnapshotCard
                            icon={Library}
                            label="Problems"
                            value={String(stats.totalProblems)}
                            helper="Reusable coding questions in the bank"
                            tone="emerald"
                        />
                        <SnapshotCard
                            icon={Clock}
                            label="Active Assignments"
                            value={String(stats.activeAssignments)}
                            helper="Assignments currently open to students"
                            tone="amber"
                        />
                    </section>

                    <section>
                        <div className="rounded-[28px] border border-border/60 bg-card/80 p-5 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)] backdrop-blur-sm sm:p-6">
                            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                <div className="space-y-1.5">
                                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                                        Control Center
                                    </p>
                                    <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                                        Move into the exact admin workspace you need
                                    </h2>
                                    <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                                        Keep the daily flow simple: create, publish, review, and support students from
                                        one consistent control surface.
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3 text-sm text-muted-foreground">
                                    Fast access for publishing, problem ops, and class monitoring
                                </div>
                            </div>

                            <div className="mt-5 grid gap-4 md:grid-cols-2">
                                {quickActions.map((action) => {
                                    const Icon = action.icon
                                    return (
                                        <a
                                            key={action.title}
                                            href={action.href}
                                            className="group relative overflow-hidden rounded-[24px] border border-border/60 bg-background/70 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_18px_42px_-28px_rgba(0,0,0,0.5)]"
                                        >
                                            <div className={cn(
                                                "absolute inset-x-0 top-0 h-px opacity-80",
                                                action.tone === "sky" && "bg-linear-to-r from-sky-500/70 via-sky-500/20 to-transparent",
                                                action.tone === "emerald" && "bg-linear-to-r from-emerald-500/70 via-emerald-500/20 to-transparent",
                                                action.tone === "amber" && "bg-linear-to-r from-amber-500/70 via-amber-500/20 to-transparent",
                                                action.tone === "violet" && "bg-linear-to-r from-violet-500/70 via-violet-500/20 to-transparent"
                                            )} />
                                            <div className="flex items-start gap-3">
                                                <div className={cn(
                                                    "flex h-11 w-11 items-center justify-center rounded-2xl border bg-background",
                                                    action.tone === "sky" && "border-sky-500/20 text-sky-500",
                                                    action.tone === "emerald" && "border-emerald-500/20 text-emerald-500",
                                                    action.tone === "amber" && "border-amber-500/20 text-amber-500",
                                                    action.tone === "violet" && "border-violet-500/20 text-violet-500"
                                                )}>
                                                    <Icon className="h-5 w-5" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-foreground">{action.title}</h3>
                                                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                                        {action.description}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="mt-4 inline-flex items-center text-sm font-medium text-foreground">
                                                Open workspace
                                                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                            </div>
                                        </a>
                                    )
                                })}
                            </div>
                        </div>
                    </section>

                    <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
                        <div className="rounded-[28px] border border-border/60 bg-card/80 p-5 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)] sm:p-6">
                            <div className="space-y-2">
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                                    Admin Workflow
                                </p>
                                <h2 className="text-2xl font-semibold tracking-tight">
                                    Recommended publishing rhythm
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    Keep the admin cycle light: prepare problems, assemble assignments, then monitor submissions once work goes live.
                                </p>
                            </div>

                            <div className="mt-5 space-y-4">
                                <WorkflowCard
                                    step="1"
                                    title="Build the problem bank"
                                    description="Write or refine problems with examples, hidden tests, and starter code before bundling them into assignments."
                                    icon={Code2}
                                />
                                <WorkflowCard
                                    step="2"
                                    title="Compose and publish assignments"
                                    description="Create balanced sets, set the release and due times, and make sure the workload feels appropriate."
                                    icon={CalendarClock}
                                />
                                <WorkflowCard
                                    step="3"
                                    title="Track activity and results"
                                    description="Use attendance, submissions, and student pages to identify who is active and where support may be needed."
                                    icon={BriefcaseBusiness}
                                />
                            </div>
                        </div>

                        <div className="rounded-[28px] border border-border/60 bg-card/80 p-5 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)] sm:p-6">
                            <div className="space-y-2">
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                                    Admin Notes
                                </p>
                                <h2 className="text-2xl font-semibold tracking-tight">
                                    Daily operating cues
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    Use these cues to keep the experience smoother for students and lighter for the admin team.
                                </p>
                            </div>

                            <div className="mt-5 space-y-4">
                                <InsightStrip
                                    icon={ShieldCheck}
                                    title="Release quality"
                                    description="Refresh problem statements and hidden tests before pushing the next assignment live."
                                />
                                <InsightStrip
                                    icon={CalendarClock}
                                    title="Timing discipline"
                                    description="Stagger release and due windows carefully so active assignments do not overlap in a confusing way."
                                />
                                <InsightStrip
                                    icon={Users}
                                    title="Student support"
                                    description="Check student, results, and submission pages together when you need to spot learners who may be stuck."
                                />
                            </div>
                        </div>
                    </section>
                </>
            )}
        </div>
    )
}

function AdminHomeSkeleton() {
    return (
        <div className="space-y-6">
            <section className="rounded-[32px] border border-border/60 bg-card/80 p-6 shadow-[0_28px_80px_-40px_rgba(0,0,0,0.65)] sm:p-8">
                <div className="grid gap-8 xl:grid-cols-[1.35fr_0.95fr]">
                    <div className="space-y-5">
                        <div className="flex flex-wrap gap-3">
                            <div className="h-8 w-40 animate-pulse rounded-full bg-muted" />
                            <div className="h-8 w-64 animate-pulse rounded-full bg-muted" />
                        </div>
                        <div className="space-y-3">
                            <div className="h-12 w-full max-w-xl animate-pulse rounded bg-muted" />
                            <div className="h-5 w-full max-w-2xl animate-pulse rounded bg-muted" />
                            <div className="h-5 w-4/5 max-w-xl animate-pulse rounded bg-muted" />
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3">
                            <div className="h-24 animate-pulse rounded-[24px] bg-muted" />
                            <div className="h-24 animate-pulse rounded-[24px] bg-muted" />
                            <div className="h-24 animate-pulse rounded-[24px] bg-muted" />
                        </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                        <div className="h-32 animate-pulse rounded-[24px] bg-muted" />
                        <div className="h-32 animate-pulse rounded-[24px] bg-muted" />
                        <div className="h-32 animate-pulse rounded-[24px] bg-muted" />
                    </div>
                </div>
            </section>

            <div className="grid gap-4 lg:grid-cols-3">
                <div className="h-40 animate-pulse rounded-[24px] border border-border/60 bg-muted" />
                <div className="h-40 animate-pulse rounded-[24px] border border-border/60 bg-muted" />
                <div className="h-40 animate-pulse rounded-[24px] border border-border/60 bg-muted" />
            </div>

            <section className="rounded-[28px] border border-border/60 bg-card/80 p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="space-y-2">
                        <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                        <div className="h-8 w-72 animate-pulse rounded bg-muted" />
                    </div>
                    <div className="h-11 w-full animate-pulse rounded-2xl bg-muted xl:w-80" />
                </div>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div className="h-40 animate-pulse rounded-[24px] bg-muted" />
                    <div className="h-40 animate-pulse rounded-[24px] bg-muted" />
                </div>
            </section>

            <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
                <section className="rounded-[28px] border border-border/60 bg-card/80 p-5 shadow-sm sm:p-6">
                    <div className="space-y-2">
                        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                        <div className="h-8 w-56 animate-pulse rounded bg-muted" />
                        <div className="h-5 w-4/5 animate-pulse rounded bg-muted" />
                    </div>
                    <div className="mt-5 space-y-4">
                        <div className="h-24 animate-pulse rounded-[24px] bg-muted" />
                        <div className="h-24 animate-pulse rounded-[24px] bg-muted" />
                        <div className="h-24 animate-pulse rounded-[24px] bg-muted" />
                    </div>
                </section>
                <section className="rounded-[28px] border border-border/60 bg-card/80 p-5 shadow-sm sm:p-6">
                    <div className="space-y-2">
                        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                        <div className="h-8 w-44 animate-pulse rounded bg-muted" />
                        <div className="h-5 w-full animate-pulse rounded bg-muted" />
                    </div>
                    <div className="mt-5 space-y-4">
                        <div className="h-20 animate-pulse rounded-[24px] bg-muted" />
                        <div className="h-20 animate-pulse rounded-[24px] bg-muted" />
                        <div className="h-20 animate-pulse rounded-[24px] bg-muted" />
                    </div>
                </section>
            </div>
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
    tone: "sky" | "emerald" | "amber"
}) {
    const toneClass = {
        sky: "border-sky-500/20 bg-sky-500/10 text-sky-500",
        emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
        amber: "border-amber-500/20 bg-amber-500/10 text-amber-500",
    }[tone]

    return (
        <div className={cn("rounded-[24px] border p-4 backdrop-blur-sm", toneClass)}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {label}
            </p>
            <p className="mt-3 text-3xl font-black tracking-tighter">{value}</p>
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
    icon: LucideIcon
    label: string
    value: string
    helper: string
    tone: "sky" | "emerald" | "amber"
}) {
    const toneClass = {
        sky: "border-sky-500/20 bg-sky-500/10 text-sky-500",
        emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
        amber: "border-amber-500/20 bg-amber-500/10 text-amber-500",
    }[tone]

    return (
        <div className="rounded-[24px] border border-border/60 bg-background/70 p-5 backdrop-blur-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        {label}
                    </p>
                    <p className="mt-3 text-3xl font-black tracking-tighter text-foreground">{value}</p>
                </div>
                <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl border", toneClass)}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{helper}</p>
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
    icon: LucideIcon
    label: string
    value: string
    helper: string
    tone: "sky" | "emerald" | "amber"
}) {
    const toneClass = {
        sky: "text-sky-500",
        emerald: "text-emerald-500",
        amber: "text-amber-500",
    }[tone]

    return (
        <div className="rounded-[24px] border border-border/60 bg-card/80 p-5 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)]">
            <div className="flex items-center justify-between gap-3">
                <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl border border-border/60 bg-background/70", toneClass)}>
                    <Icon className="h-5 w-5" />
                </div>
                <p className="text-3xl font-black tracking-tighter text-foreground">{value}</p>
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {label}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{helper}</p>
        </div>
    )
}

function WorkflowCard({
    step,
    title,
    description,
    icon: Icon,
}: {
    step: string
    title: string
    description: string
    icon: LucideIcon
}) {
    return (
        <div className="rounded-[24px] border border-border/60 bg-background/65 p-4">
            <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-background text-sm font-semibold text-foreground">
                    {step}
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-semibold text-foreground">{title}</h3>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
                </div>
            </div>
        </div>
    )
}

function InsightStrip({
    icon: Icon,
    title,
    description,
}: {
    icon: LucideIcon
    title: string
    description: string
}) {
    return (
        <div className="rounded-[24px] border border-border/60 bg-background/65 p-4">
            <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border/60 bg-background text-primary">
                    <Icon className="h-5 w-5" />
                </div>
                <div className="space-y-1.5">
                    <h3 className="font-semibold text-foreground">{title}</h3>
                    <p className="text-sm leading-6 text-muted-foreground">{description}</p>
                </div>
            </div>
        </div>
    )
}
