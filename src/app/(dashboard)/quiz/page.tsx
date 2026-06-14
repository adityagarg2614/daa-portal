'use client'

import React, { useEffect, useMemo, useState } from "react"
import axios from "axios"
import {
    BookOpenCheck,
    CalendarDays,
    CheckCircle2,
    Clock3,
    Shield,
    Sparkles,
    Target,
    TimerReset,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { FilterTabs } from "@/components/ui/filter-tabs"
import { Input } from "@/components/ui/input"
import { QuizCard } from "@/components/ui/quiz-card"
import {
    AssignmentCardSkeleton,
    AssignmentsDashboardSkeleton,
    StatsCardSkeleton,
} from "@/components/ui/skeleton"

type QuizStatus = "Active" | "Upcoming" | "Completed" | "Expired"

type Quiz = {
    _id: string
    title: string
    description: string
    batch?: "A" | "B" | null
    totalQuestions: number
    totalMarks: number
    publishAt: string
    dueAt: string
    status: QuizStatus
    isSebRequired?: boolean
}

export default function QuizPage() {
    const [search, setSearch] = useState("")
    const [activeTab, setActiveTab] = useState<"All" | QuizStatus>("All")
    const [quizzes, setQuizzes] = useState<Quiz[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchQuizzes = async () => {
            try {
                const res = await axios.get("/api/student/quizzes")
                setQuizzes(res.data.quizzes || [])
            } catch (error) {
                console.error("Error fetching quizzes:", error)
            } finally {
                setLoading(false)
            }
        }

        void fetchQuizzes()
    }, [])

    const filteredQuizzes = useMemo(() => {
        return quizzes.filter((quiz) => {
            const query = search.toLowerCase()
            const matchesSearch =
                quiz.title.toLowerCase().includes(query) ||
                quiz.description.toLowerCase().includes(query)

            const matchesTab = activeTab === "All" ? true : quiz.status === activeTab
            return matchesSearch && matchesTab
        })
    }, [quizzes, search, activeTab])

    const tabs: Array<"All" | QuizStatus> = [
        "All",
        "Active",
        "Upcoming",
        "Completed",
        "Expired",
    ]

    const insights = useMemo(() => {
        const activeCount = quizzes.filter((quiz) => quiz.status === "Active").length
        const upcomingCount = quizzes.filter((quiz) => quiz.status === "Upcoming").length
        const completedCount = quizzes.filter((quiz) => quiz.status === "Completed").length
        const expiredCount = quizzes.filter((quiz) => quiz.status === "Expired").length
        const secureCount = quizzes.filter((quiz) => quiz.isSebRequired).length
        const totalMarks = quizzes.reduce((sum, quiz) => sum + quiz.totalMarks, 0)

        const tone =
            activeCount > 0
                ? "You have live quizzes ready to attempt."
                : upcomingCount > 0
                  ? "More quizzes are scheduled to open soon."
                  : "Your quiz workspace is calm right now."

        return {
            activeCount,
            upcomingCount,
            completedCount,
            expiredCount,
            secureCount,
            totalMarks,
            tone,
        }
    }, [quizzes])

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
            <section className="relative overflow-hidden rounded-[32px] border border-border/60 bg-linear-to-br from-card via-card to-emerald-500/10 shadow-[0_28px_80px_-40px_rgba(0,0,0,0.65)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.16),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.12),transparent_30%)]" />
                <div className="relative grid gap-8 px-5 py-6 sm:px-7 sm:py-7 xl:grid-cols-[1.35fr_0.95fr] xl:px-8">
                    <div className="space-y-6">
                        <div className="flex flex-wrap items-center gap-3">
                            <Badge className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-emerald-500 shadow-none">
                                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                                Quiz Hub
                            </Badge>
                            
                        </div>

                        <div className="space-y-3">
                            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                                Quizzes
                            </h1>
                            <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                                Track live quizzes, secure launches, and completed attempts from one clean student workspace.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                                    Workspace Signal
                                </p>
                                <div className="mt-2 flex flex-wrap items-end gap-3">
                                    <span className="text-5xl font-black leading-none tracking-[-0.06em] text-emerald-500">
                                        {insights.activeCount}
                                    </span>
                                    <div className="mb-1 rounded-2xl border border-border/60 bg-background/70 px-3 py-2 text-sm text-muted-foreground backdrop-blur">
                                        {insights.tone}
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-3">
                                <HeroChip label="Active" value={String(insights.activeCount)} tone="emerald" />
                                <HeroChip label="Completed" value={String(insights.completedCount)} tone="sky" />
                                
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                        <SummaryPanel
                            icon={Target}
                            label="Marks Available"
                            value={String(insights.totalMarks)}
                            helper="Total marks represented by all visible quizzes"
                            tone="emerald"
                        />
                        <SummaryPanel
                            icon={Shield}
                            label="SEB Only"
                            value={String(insights.secureCount)}
                            helper="Quizzes that can only be launched from Safe Exam Browser"
                            tone="rose"
                        />
                        <SummaryPanel
                            icon={TimerReset}
                            label="Expired"
                            value={String(insights.expiredCount)}
                            helper="Quiz windows that are already closed"
                            tone="amber"
                        />
                    </div>
                </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
                <SnapshotCard
                    icon={Clock3}
                    label="Live Quizzes"
                    value={String(insights.activeCount)}
                    helper="Ready to attempt right now"
                    tone="emerald"
                />
                <SnapshotCard
                    icon={CheckCircle2}
                    label="Completed"
                    value={String(insights.completedCount)}
                    helper="Already submitted and locked"
                    tone="sky"
                />
                <SnapshotCard
                    icon={CalendarDays}
                    label="Coming Soon"
                    value={String(insights.upcomingCount)}
                    helper="Scheduled for later release"
                    tone="violet"
                />
            </section>

            <section className="rounded-[28px] border border-border/60 bg-card/80 p-5 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)] backdrop-blur-sm sm:p-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="space-y-1.5">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                            Explore Quizzes
                        </p>
                        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                            Search and filter your quiz timeline
                        </h2>
                    </div>

                    <div className="relative w-full xl:w-80">
                        <BookOpenCheck className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search quizzes..."
                            className="h-11 rounded-2xl border-border/60 bg-background/80 pl-10 shadow-sm"
                            aria-label="Search quizzes"
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
                            {filteredQuizzes.length} shown
                        </Badge>
                        <Badge variant="outline" className="rounded-full px-3 py-1">
                            {insights.activeCount} active
                        </Badge>
                        <Badge variant="outline" className="rounded-full px-3 py-1">
                            {insights.secureCount} secure
                        </Badge>
                    </div>
                </div>
            </section>

            <section className="space-y-4">
                {filteredQuizzes.length > 0 ? (
                    <div className="grid gap-4" role="list" aria-label="Quiz list">
                        {filteredQuizzes.map((quiz) => {
                            const canOpen = quiz.status === "Active"
                            const actionHref = quiz.isSebRequired ? `/quiz/start/${quiz._id}` : `/quiz/${quiz._id}`

                            return (
                                <QuizCard
                                    key={quiz._id}
                                    quiz={quiz}
                                    actionLabel={
                                        quiz.status === "Completed"
                                            ? "Already Submitted"
                                            : quiz.isSebRequired
                                              ? "Launch Secure Quiz"
                                              : "Open Quiz"
                                    }
                                    actionDisabled={!canOpen}
                                    onAction={
                                        canOpen
                                            ? () => {
                                                  window.location.href = actionHref
                                              }
                                            : undefined
                                    }
                                />
                            )
                        })}
                    </div>
                ) : (
                    <EmptyState
                        title="No quizzes found"
                        description="Try a different search or filter to find the quiz you need."
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
    tone: "emerald" | "sky" | "rose"
}) {
    return (
        <div className="rounded-[22px] border border-border/60 bg-background/70 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                {label}
            </p>
            <p
                className={`mt-2 text-2xl font-semibold tracking-tight ${
                    tone === "emerald"
                        ? "text-emerald-500"
                        : tone === "rose"
                          ? "text-rose-500"
                          : "text-sky-500"
                }`}
            >
                {value}
            </p>
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
    tone: "emerald" | "rose" | "amber"
}) {
    return (
        <div className="rounded-[24px] border border-border/60 bg-background/70 p-4">
            <div className="flex items-center gap-3">
                <div
                    className={`rounded-2xl p-3 ${
                        tone === "emerald"
                            ? "bg-emerald-500/10 text-emerald-500"
                            : tone === "rose"
                              ? "bg-rose-500/10 text-rose-500"
                              : "bg-amber-500/10 text-amber-500"
                    }`}
                >
                    <Icon className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                        {label}
                    </p>
                    <p className="text-lg font-semibold tracking-tight">{value}</p>
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
    icon: React.ComponentType<{ className?: string }>
    label: string
    value: string
    helper: string
    tone: "emerald" | "sky" | "violet"
}) {
    return (
        <div className="rounded-[26px] border border-border/60 bg-card/80 p-5 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)]">
            <div className="flex items-center gap-3">
                <div
                    className={`rounded-2xl p-3 ${
                        tone === "emerald"
                            ? "bg-emerald-500/10 text-emerald-500"
                            : tone === "violet"
                              ? "bg-violet-500/10 text-violet-500"
                              : "bg-sky-500/10 text-sky-500"
                    }`}
                >
                    <Icon className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                        {label}
                    </p>
                    <p className="text-2xl font-semibold tracking-tight">{value}</p>
                </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{helper}</p>
        </div>
    )
}
