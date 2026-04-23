'use client'

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { useRefetchOnFocus } from "@/hooks/use-refetch-on-focus"
import { useUser } from "@clerk/nextjs"
import {
    ArrowRight,
    Bell,
    BookOpen,
    CalendarCheck,
    ClipboardCheck,
    Clock,
    Sparkles,
    Trophy,
} from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { format } from "date-fns"

type DashboardData = {
    stats: {
        totalAssignments: number
        pendingAssignments: number
        completedAssignments: number
        averageScore: string | number
    }
    upcomingAssignments: Array<{
        title: string
        due: string
        status: string
        _id?: string
    }>
    recentResults: Array<{
        title: string
        submittedAt: string
        score: string | number
    }>
    attendance?: {
        percentage?: number
    }
}

type Announcement = {
    _id: string
    content: string
}

export default function HomePage() {
    const { user } = useUser()
    const [data, setData] = useState<DashboardData | null>(null)
    const [loading, setLoading] = useState(true)

    const fetchDashboardData = useCallback(async () => {
        try {
            const response = await fetch("/api/student/dashboard")
            const resData = await response.json()
            if (resData.success) {
                setData(resData.data)
            }
        } catch (error) {
            console.error("Error fetching dashboard data:", error)
            toast.error("Failed to load dashboard data")
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        const timer = window.setTimeout(() => {
            void fetchDashboardData()
        }, 0)

        return () => window.clearTimeout(timer)
    }, [fetchDashboardData])

    useRefetchOnFocus(fetchDashboardData)

    const stats = useMemo(() => {
        if (!data) return null

        return {
            totalAssignments: data.stats.totalAssignments,
            pendingAssignments: data.stats.pendingAssignments,
            completedAssignments: data.stats.completedAssignments,
            averageScore: data.stats.averageScore,
            attendance: data.attendance?.percentage || 0,
        }
    }, [data])

    const dashboardTone = useMemo(() => {
        if (!stats) return "Your student workspace is getting ready."
        if (stats.pendingAssignments > 0) {
            return "You have live work waiting, and this dashboard keeps the next steps clear."
        }
        if (stats.completedAssignments > 0) {
            return "Your recent work is shaping a steady academic rhythm."
        }
        return "Your dashboard is clear and ready for the next assignment cycle."
    }, [stats])

    const formatDueDate = (dateString: string) => {
        const date = new Date(dateString)
        return format(date, "MMM d, yyyy h:mm a")
    }

    const formatRelativeTime = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 3600 * 24))

        if (diffInDays === 0) return "Today"
        if (diffInDays === 1) return "Yesterday"
        return `${diffInDays} days ago`
    }

    const getAssignmentStatusStyles = (status: string) => {
        switch (status) {
            case "Active":
                return "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
            case "Upcoming":
                return "border-sky-500/20 bg-sky-500/10 text-sky-500"
            default:
                return "border-border/60 bg-background/70 text-foreground"
        }
    }

    if (loading) {
        return (
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-8 pt-2 sm:px-6 xl:px-8">
                <HomeDashboardSkeleton />
            </div>
        )
    }

    return (
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-8 pt-2 sm:px-6 xl:px-8">
            <section className="relative overflow-hidden rounded-[32px] border border-border/60 bg-linear-to-br from-card via-card to-cyan-500/8 shadow-[0_28px_80px_-40px_rgba(0,0,0,0.65)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,0.14),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(6,182,212,0.12),transparent_30%)]" />
                <div className="relative grid gap-8 px-5 py-6 sm:px-7 sm:py-7 xl:grid-cols-[1.35fr_0.95fr] xl:px-8">
                    <div className="space-y-6">
                        <div className="flex flex-wrap items-center gap-3">
                            <Badge className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-cyan-500 shadow-none">
                                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                                Student Dashboard
                            </Badge>
                            <Badge variant="outline" className="rounded-full px-3 py-1">
                                <BookOpen className="mr-1.5 h-3.5 w-3.5" />
                                Assignments, attendance, and results in one place
                            </Badge>
                        </div>

                        <div className="space-y-3">
                            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                                Welcome back, {user?.firstName || "Student"}
                            </h1>
                            <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                                {dashboardTone}
                            </p>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                                    Current Focus
                                </p>
                                <div className="mt-2 flex flex-wrap items-end gap-3">
                                    <span className="text-5xl font-black leading-none tracking-[-0.06em] text-cyan-500">
                                        {stats?.pendingAssignments || 0}
                                    </span>
                                    <div className="mb-1 rounded-2xl border border-border/60 bg-background/70 px-3 py-2 text-sm text-muted-foreground backdrop-blur">
                                        pending assignments ready to tackle
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-3">
                                <HeroChip
                                    label="Assignments"
                                    value={String(stats?.totalAssignments || 0)}
                                    tone="slate"
                                />
                                <HeroChip
                                    label="Completed"
                                    value={String(stats?.completedAssignments || 0)}
                                    tone="emerald"
                                />
                                <HeroChip
                                    label="Attendance"
                                    value={`${stats?.attendance || 0}%`}
                                    tone="sky"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                        <SummaryPanel
                            icon={Clock}
                            label="Pending Work"
                            value={String(stats?.pendingAssignments || 0)}
                            helper="Assignments still waiting on your submission"
                            tone="amber"
                        />
                        <SummaryPanel
                            icon={Trophy}
                            label="Average Score"
                            value={String(stats?.averageScore || 0)}
                            helper="Your current performance trend"
                            tone="emerald"
                        />
                        <SummaryPanel
                            icon={CalendarCheck}
                            label="Attendance"
                            value={`${stats?.attendance || 0}%`}
                            helper={
                                (stats?.attendance || 0) >= 75
                                    ? "Attendance is comfortably on track"
                                    : "Attendance needs some attention"
                            }
                            tone={(stats?.attendance || 0) >= 75 ? "sky" : "amber"}
                        />
                    </div>
                </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-4">
                <SnapshotCard
                    icon={BookOpen}
                    label="Total Assignments"
                    value={String(stats?.totalAssignments || 0)}
                    helper="Visible in your portal"
                    tone="sky"
                />
                <SnapshotCard
                    icon={Clock}
                    label="Pending"
                    value={String(stats?.pendingAssignments || 0)}
                    helper="Still waiting on action"
                    tone="amber"
                />
                <SnapshotCard
                    icon={ClipboardCheck}
                    label="Completed"
                    value={String(stats?.completedAssignments || 0)}
                    helper="Already finished by you"
                    tone="emerald"
                />
                <SnapshotCard
                    icon={Trophy}
                    label="Average Score"
                    value={String(stats?.averageScore || 0)}
                    helper="Across your reviewed work"
                    tone="violet"
                />
            </section>

            <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                <DashboardCard
                    eyebrow="Upcoming Assignments"
                    title="What needs your attention next"
                    actionHref="/assignment"
                    actionLabel="View all"
                >
                    <div className="space-y-3">
                        {data?.upcomingAssignments?.length ? (
                            data.upcomingAssignments.map((assignment, index) => (
                                <Link
                                    key={`${assignment.title}-${index}`}
                                    href="/assignment"
                                    className="group block rounded-[24px] border border-border/60 bg-background/60 p-4 transition-all hover:border-primary/30 hover:shadow-sm"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <h3 className="font-semibold text-foreground">
                                                {assignment.title}
                                            </h3>
                                            <p className="mt-2 text-sm text-muted-foreground">
                                                Due: {formatDueDate(assignment.due)}
                                            </p>
                                        </div>
                                        <Badge
                                            variant="outline"
                                            className={cn("rounded-full px-3 py-1", getAssignmentStatusStyles(assignment.status))}
                                        >
                                            {assignment.status}
                                        </Badge>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <EmptyState
                                title="No upcoming assignments"
                                description="New assignment releases will show up here as soon as they are published."
                                className="rounded-[24px] border-border/60 bg-background/55 shadow-none"
                            />
                        )}
                    </div>
                </DashboardCard>

                <DashboardCard
                    eyebrow="Attendance"
                    title="Your attendance snapshot"
                    actionHref="/attendance"
                    actionLabel="Open attendance"
                >
                    <Link href="/attendance" className="block rounded-[24px] border border-border/60 bg-background/60 p-5 transition-all hover:border-primary/30 hover:shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Current attendance</p>
                                <p
                                    className={cn(
                                        "mt-2 text-4xl font-black tracking-[-0.05em]",
                                        (stats?.attendance || 0) >= 75 ? "text-emerald-500" : "text-amber-500"
                                    )}
                                >
                                    {stats?.attendance || 0}%
                                </p>
                            </div>
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border/60 bg-background text-muted-foreground">
                                <ArrowRight className="h-5 w-5" />
                            </div>
                        </div>
                        <p className="mt-4 text-sm leading-6 text-muted-foreground">
                            {(stats?.attendance || 0) >= 75
                                ? "Your attendance is looking healthy and on track."
                                : "You are below the 75% threshold, so upcoming sessions matter."}
                        </p>
                    </Link>
                </DashboardCard>
            </section>

            <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
                <DashboardCard
                    eyebrow="Recent Results"
                    title="Latest scored work"
                    actionHref="/results"
                    actionLabel="View all"
                >
                    <div className="space-y-3">
                        {data?.recentResults?.length ? (
                            data.recentResults.map((submission, index) => (
                                <Link
                                    key={`${submission.title}-${index}`}
                                    href="/results"
                                    className="group flex items-center justify-between gap-4 rounded-[24px] border border-border/60 bg-background/60 p-4 transition-all hover:border-primary/30 hover:shadow-sm"
                                >
                                    <div>
                                        <h3 className="font-semibold text-foreground">{submission.title}</h3>
                                        <p className="mt-2 text-sm text-muted-foreground">
                                            Submitted {formatRelativeTime(submission.submittedAt)}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-500">
                                        {submission.score}
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <EmptyState
                                title="No scored submissions yet"
                                description="Your evaluated results will appear here once work gets reviewed."
                                className="rounded-[24px] border-border/60 bg-background/55 shadow-none"
                            />
                        )}
                    </div>
                </DashboardCard>

                <DashboardCard
                    eyebrow="Announcements"
                    title="Latest updates"
                    actionHref="/announcements"
                    actionLabel="View all"
                >
                    <AnnouncementsList />
                </DashboardCard>
            </section>

            <section className="rounded-[28px] border border-border/60 bg-card/80 p-5 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)] sm:p-6">
                <div className="mb-5 flex items-center justify-between gap-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                            Quick Actions
                        </p>
                        <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                            Jump into the sections you use most
                        </h2>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <QuickLinkCard
                        href="/assignment"
                        icon={BookOpen}
                        title="Assignments"
                        description="Open your active and upcoming work."
                    />
                    <QuickLinkCard
                        href="/submission"
                        icon={ClipboardCheck}
                        title="Submissions"
                        description="Review everything you have submitted."
                    />
                    <QuickLinkCard
                        href="/results"
                        icon={Trophy}
                        title="Results"
                        description="Check scores and recent performance."
                    />
                </div>
            </section>
        </div>
    )
}

function AnnouncementsList() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([])
    const [loading, setLoading] = useState(true)

    const fetchAnnouncements = useCallback(async () => {
        try {
            const response = await fetch("/api/student/announcements?limit=3")
            const data = await response.json()

            if (data.success) {
                setAnnouncements(data.data)
            }
        } catch (error) {
            console.error("Error fetching announcements:", error)
            toast.error("Failed to fetch announcements")
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        const timer = window.setTimeout(() => {
            void fetchAnnouncements()
        }, 0)

        return () => window.clearTimeout(timer)
    }, [fetchAnnouncements])

    useRefetchOnFocus(fetchAnnouncements)

    if (loading) {
        return (
            <div className="space-y-3">
                {[...Array(3)].map((_, index) => (
                    <div key={index} className="rounded-[24px] border border-border/60 bg-background/55 p-4">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="mt-3 h-4 w-4/5" />
                    </div>
                ))}
            </div>
        )
    }

    if (announcements.length === 0) {
        return (
            <EmptyState
                title="No announcements yet"
                description="Recent updates from your institute will show here."
                icon={<Bell className="mx-auto mb-3 h-10 w-10 text-muted-foreground opacity-70" />}
                className="rounded-[24px] border-border/60 bg-background/55 shadow-none"
            />
        )
    }

    return (
        <div className="space-y-3">
            {announcements.map((item) => (
                <div
                    key={item._id}
                    className="rounded-[24px] border border-border/60 bg-background/60 p-4 transition-all hover:border-primary/30 hover:shadow-sm"
                >
                    <p className="text-sm leading-6 text-foreground">{item.content}</p>
                </div>
            ))}
        </div>
    )
}

function DashboardCard({
    eyebrow,
    title,
    children,
    actionHref,
    actionLabel,
}: {
    eyebrow: string
    title: string
    children: React.ReactNode
    actionHref?: string
    actionLabel?: string
}) {
    return (
        <div className="rounded-[28px] border border-border/60 bg-card/80 p-5 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)] sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                        {eyebrow}
                    </p>
                    <h2 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h2>
                </div>
                {actionHref && actionLabel ? (
                    <Link
                        href={actionHref}
                        className="inline-flex items-center gap-2 text-sm font-medium text-primary transition hover:opacity-90"
                    >
                        {actionLabel}
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                ) : null}
            </div>
            {children}
        </div>
    )
}

function QuickLinkCard({
    href,
    icon: Icon,
    title,
    description,
}: {
    href: string
    icon: React.ComponentType<{ className?: string }>
    title: string
    description: string
}) {
    return (
        <Link
            href={href}
            className="group flex items-start gap-3 rounded-[24px] border border-border/60 bg-background/65 p-4 transition-all hover:border-primary/30 hover:shadow-sm"
        >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border/60 bg-background text-primary">
                <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
                <h3 className="font-semibold text-foreground">{title}</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
            </div>
            <ArrowRight className="mt-1 h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
        </Link>
    )
}

function HeroChip({
    label,
    value,
    tone,
}: {
    label: string
    value: string
    tone: "sky" | "emerald" | "slate"
}) {
    const tones = {
        sky: "border-sky-500/20 bg-sky-500/10 text-sky-500",
        emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
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
    tone: "sky" | "amber" | "emerald" | "violet"
}) {
    const tones = {
        sky: "border-sky-500/20 bg-sky-500/10 text-sky-500",
        amber: "border-amber-500/20 bg-amber-500/10 text-amber-500",
        emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
        violet: "border-violet-500/20 bg-violet-500/10 text-violet-500",
    }

    return (
        <div className="rounded-[28px] border border-border/60 bg-card/80 p-5 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)]">
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

function HomeDashboardSkeleton() {
    return (
        <div className="space-y-6">
            <div className="relative overflow-hidden rounded-[32px] border bg-background p-6 shadow-sm sm:p-7">
                <div className="grid gap-8 xl:grid-cols-[1.35fr_0.95fr]">
                    <div className="space-y-6">
                        <div className="flex flex-wrap gap-3">
                            <Skeleton className="h-8 w-36 rounded-full" />
                            <Skeleton className="h-8 w-64 rounded-full" />
                        </div>
                        <div className="space-y-3">
                            <Skeleton className="h-10 w-2/3" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-4/5" />
                        </div>
                        <div className="space-y-3">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-16 w-20" />
                            <div className="grid gap-3 sm:grid-cols-3">
                                <Skeleton className="h-20 rounded-2xl" />
                                <Skeleton className="h-20 rounded-2xl" />
                                <Skeleton className="h-20 rounded-2xl" />
                            </div>
                        </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                        <Skeleton className="h-28 rounded-[24px]" />
                        <Skeleton className="h-28 rounded-[24px]" />
                        <Skeleton className="h-28 rounded-[24px]" />
                    </div>
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-4">
                <Skeleton className="h-32 rounded-[28px]" />
                <Skeleton className="h-32 rounded-[28px]" />
                <Skeleton className="h-32 rounded-[28px]" />
                <Skeleton className="h-32 rounded-[28px]" />
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                <Skeleton className="h-[320px] rounded-[28px]" />
                <Skeleton className="h-[320px] rounded-[28px]" />
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
                <Skeleton className="h-[280px] rounded-[28px]" />
                <Skeleton className="h-[280px] rounded-[28px]" />
            </div>

            <Skeleton className="h-[220px] rounded-[28px]" />
        </div>
    )
}
