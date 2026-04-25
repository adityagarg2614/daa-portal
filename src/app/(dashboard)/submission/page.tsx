'use client'

import React, { useEffect, useMemo, useState } from "react"
import axios from "axios"
import {
    CheckCircle2,
    Clock3,
    FileCode2,
    Search,
    Sparkles,
    Target,
    TimerReset,
    Trophy,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { FilterTabs } from "@/components/ui/filter-tabs"
import { Input } from "@/components/ui/input"
import { SubmissionCard } from "@/components/ui/submission-card"
import {
    StatsCardSkeleton,
    SubmissionCardSkeleton,
    SubmissionsDashboardSkeleton,
} from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

type SubmissionStatus = "Attempted" | "Submitted" | "Evaluated"

type Submission = {
    _id: string
    assignmentId: {
        _id: string
        title: string
        dueAt?: string
    }
    problemId: {
        _id: string
        title: string
    }
    code: string
    language: string
    status: SubmissionStatus
    score?: number
    submittedAt?: string
}

export default function SubmissionPage() {
    const [search, setSearch] = useState("")
    const [activeTab, setActiveTab] = useState<"All" | SubmissionStatus>("All")
    const [submissions, setSubmissions] = useState<Submission[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchSubmissions = async () => {
            try {
                const userRes = await axios.get("/api/users/me")
                const dbUserId = userRes.data.user._id

                const submissionsRes = await axios.get(
                    `/api/student/submissions?userId=${dbUserId}`
                )

                setSubmissions(submissionsRes.data.submissions || [])
            } catch (error) {
                console.error("Error fetching submissions:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchSubmissions()
    }, [])

    const tabs: Array<"All" | SubmissionStatus> = [
        "All",
        "Attempted",
        "Submitted",
        "Evaluated",
    ]

    const filteredSubmissions = useMemo(() => {
        return submissions.filter((item) => {
            const assignmentTitle = item.assignmentId?.title || ""
            const problemTitle = item.problemId?.title || ""
            const query = search.toLowerCase()

            const matchesSearch =
                assignmentTitle.toLowerCase().includes(query) ||
                problemTitle.toLowerCase().includes(query) ||
                item.language.toLowerCase().includes(query)

            const matchesTab = activeTab === "All" ? true : item.status === activeTab

            return matchesSearch && matchesTab
        })
    }, [search, activeTab, submissions])

    const insights = useMemo(() => {
        const attemptedCount = submissions.filter((submission) => submission.status === "Attempted").length
        const submittedCount = submissions.filter((submission) => submission.status === "Submitted").length
        const evaluatedCount = submissions.filter((submission) => submission.status === "Evaluated").length
        const averageScore = evaluatedCount
            ? Math.round(
                submissions
                    .filter((submission) => submission.status === "Evaluated")
                    .reduce((sum, submission) => sum + (submission.score ?? 0), 0) / evaluatedCount
            )
            : 0
        const languages = new Set(submissions.map((submission) => submission.language)).size

        const tone =
            evaluatedCount > 0
                ? "Your reviewed work is building a clear performance trail."
                : submittedCount > 0
                    ? "You have active work waiting to be evaluated."
                    : "Your submission history will grow as you solve more problems."

        return {
            attemptedCount,
            submittedCount,
            evaluatedCount,
            averageScore,
            languages,
            tone,
        }
    }, [submissions])

    if (loading) {
        return (
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-8 pt-2 sm:px-6 xl:px-8">
                <SubmissionsDashboardSkeleton />
                <div className="grid gap-4 lg:grid-cols-3">
                    <StatsCardSkeleton />
                    <StatsCardSkeleton />
                    <StatsCardSkeleton />
                </div>
                <div className="grid gap-4">
                    <SubmissionCardSkeleton />
                    <SubmissionCardSkeleton />
                    <SubmissionCardSkeleton />
                </div>
            </div>
        )
    }

    return (
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-8 pt-2 sm:px-6 xl:px-8">
            <section className="relative overflow-hidden rounded-[32px] border border-border/60 bg-linear-to-br from-card via-card to-teal-500/8 shadow-[0_28px_80px_-40px_rgba(0,0,0,0.65)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(20,184,166,0.14),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.12),transparent_30%)]" />
                <div className="relative grid gap-8 px-5 py-6 sm:px-7 sm:py-7 xl:grid-cols-[1.35fr_0.95fr] xl:px-8">
                    <div className="space-y-6">
                        <div className="flex flex-wrap items-center gap-3">
                            <Badge className="rounded-full border border-teal-500/20 bg-teal-500/10 px-3 py-1 text-teal-500 shadow-none">
                                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                                Submission Tracker
                            </Badge>
                            <Badge variant="outline" className="rounded-full px-3 py-1">
                                <FileCode2 className="mr-1.5 h-3.5 w-3.5" />
                                Attempted, submitted, and evaluated records
                            </Badge>
                        </div>

                        <div className="space-y-3">
                            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                                My Submissions
                            </h1>
                            <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                                Review what you have attempted, what is waiting for evaluation,
                                and how your scored submissions are shaping up.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                                    Evaluation Signal
                                </p>
                                <div className="mt-2 flex flex-wrap items-end gap-3">
                                    <span
                                        className={cn(
                                            "text-5xl font-black leading-none tracking-[-0.06em]",
                                            insights.evaluatedCount > 0 ? "text-teal-500" : "text-slate-400"
                                        )}
                                    >
                                        {insights.evaluatedCount}
                                    </span>
                                    <div className="mb-1 rounded-2xl border border-border/60 bg-background/70 px-3 py-2 text-sm text-muted-foreground backdrop-blur">
                                        {insights.tone}
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-3">
                                <HeroChip
                                    label="Submitted"
                                    value={String(insights.submittedCount)}
                                    tone="sky"
                                />
                                <HeroChip
                                    label="Evaluated"
                                    value={String(insights.evaluatedCount)}
                                    tone="emerald"
                                />
                                <HeroChip
                                    label="Attempted"
                                    value={String(insights.attemptedCount)}
                                    tone="slate"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                        <SummaryPanel
                            icon={Trophy}
                            label="Average Score"
                            value={String(insights.averageScore)}
                            helper="Across evaluated submissions only"
                            tone="emerald"
                        />
                        <SummaryPanel
                            icon={Target}
                            label="Languages Used"
                            value={String(insights.languages)}
                            helper="Different languages across your records"
                            tone="sky"
                        />
                        <SummaryPanel
                            icon={TimerReset}
                            label="Need Review"
                            value={String(insights.submittedCount)}
                            helper="Submitted work still waiting on evaluation"
                            tone="amber"
                        />
                    </div>
                </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
                <SnapshotCard
                    icon={Clock3}
                    label="Attempted"
                    value={String(insights.attemptedCount)}
                    helper="Draft work and in-progress solutions"
                    tone="amber"
                />
                <SnapshotCard
                    icon={FileCode2}
                    label="Submitted"
                    value={String(insights.submittedCount)}
                    helper="Solutions already sent for review"
                    tone="sky"
                />
                <SnapshotCard
                    icon={CheckCircle2}
                    label="Evaluated"
                    value={String(insights.evaluatedCount)}
                    helper="Records with reviewed scores"
                    tone="emerald"
                />
            </section>

            <section className="rounded-[28px] border border-border/60 bg-card/80 p-5 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)] backdrop-blur-sm sm:p-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="space-y-1.5">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                            Explore Submissions
                        </p>
                        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                            Search and filter your submission history
                        </h2>
                    </div>

                    <div className="relative w-full xl:w-80">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search assignment, problem, or language..."
                            className="h-11 rounded-2xl border-border/60 bg-background/80 pl-10 shadow-sm"
                            aria-label="Search submissions"
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
                            {filteredSubmissions.length} shown
                        </Badge>
                        <Badge variant="outline" className="rounded-full px-3 py-1">
                            {insights.submittedCount} submitted
                        </Badge>
                        <Badge variant="outline" className="rounded-full px-3 py-1">
                            {insights.evaluatedCount} evaluated
                        </Badge>
                    </div>
                </div>
            </section>

            <section className="space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                            Submission Feed
                        </p>
                        <h2 className="text-2xl font-semibold tracking-tight">
                            Your submission cards
                        </h2>
                    </div>
                </div>

                {filteredSubmissions.length > 0 ? (
                    <div className="grid gap-4" role="list" aria-label="Submissions list" aria-live="polite">
                        {filteredSubmissions.map((submission) => (
                            <SubmissionCard
                                key={submission._id}
                                submission={submission}
                                actionLabel="View Details"
                            />
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        title="No submissions found"
                        description="Your submission records will appear here once you submit a problem."
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
    tone: "amber" | "sky" | "emerald"
}) {
    const tones = {
        amber: "border-amber-500/20 bg-amber-500/10 text-amber-500",
        sky: "border-sky-500/20 bg-sky-500/10 text-sky-500",
        emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
    }

    return (
        <div className="rounded-[28px] border border-border/60 bg-card/80 p-5 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)] backdrop-blur-sm sm:p-6">
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
