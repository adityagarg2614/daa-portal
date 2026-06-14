'use client'

import axios from "axios"
import Link from "next/link"
import React, { useEffect, useMemo, useState } from "react"
import {
    BookOpenCheck,
    CalendarDays,
    Clock3,
    Plus,
    Search,
    Shield,
    Sparkles,
    Target,
    TimerReset,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { FilterTabs } from "@/components/ui/filter-tabs"
import { Input } from "@/components/ui/input"
import { AssignmentCardSkeleton, StatsCardSkeleton } from "@/components/ui/skeleton"
import { QuizCard } from "@/components/ui/quiz-card"

type QuizStatus = "Upcoming" | "Active" | "Expired"

type Quiz = {
    _id: string
    title: string
    description: string
    batch?: "A" | "B" | null
    totalQuestions: number
    totalMarks: number
    publishAt: string
    dueAt: string
    isSebRequired?: boolean
}

export default function AdminQuizzesPage() {
    const [quizzes, setQuizzes] = useState<Quiz[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [activeTab, setActiveTab] = useState<"All" | QuizStatus>("All")

    useEffect(() => {
        const fetchQuizzes = async () => {
            try {
                const res = await axios.get("/api/admin/quizzes")
                setQuizzes(res.data.quizzes || [])
            } catch (error) {
                console.error("Error fetching quizzes:", error)
            } finally {
                setLoading(false)
            }
        }

        void fetchQuizzes()
    }, [])

    const getComputedStatus = (quiz: Quiz): QuizStatus => {
        const now = new Date()
        const publishAt = new Date(quiz.publishAt)
        const dueAt = new Date(quiz.dueAt)

        if (now < publishAt) return "Upcoming"
        if (now > dueAt) return "Expired"
        return "Active"
    }

    const stats = useMemo(() => {
        const upcoming = quizzes.filter((quiz) => getComputedStatus(quiz) === "Upcoming").length
        const active = quizzes.filter((quiz) => getComputedStatus(quiz) === "Active").length
        const expired = quizzes.filter((quiz) => getComputedStatus(quiz) === "Expired").length
        const sebOnly = quizzes.filter((quiz) => quiz.isSebRequired).length
        const totalMarks = quizzes.reduce((sum, quiz) => sum + quiz.totalMarks, 0)

        return {
            upcoming,
            active,
            expired,
            sebOnly,
            totalMarks,
        }
    }, [quizzes])

    const filteredQuizzes = useMemo(() => {
        return quizzes.filter((quiz) => {
            const status = getComputedStatus(quiz)
            const query = search.toLowerCase()

            const matchesSearch =
                quiz.title.toLowerCase().includes(query) ||
                quiz.description.toLowerCase().includes(query)

            const matchesTab = activeTab === "All" ? true : status === activeTab
            return matchesSearch && matchesTab
        })
    }, [activeTab, quizzes, search])

    const tabs: Array<"All" | QuizStatus> = ["All", "Upcoming", "Active", "Expired"]

    if (loading) {
        return (
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-8 pt-2 sm:px-6 xl:px-8">
                <div className="h-56 animate-pulse rounded-[32px] bg-muted" />
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
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.18),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.12),transparent_30%)]" />
                <div className="relative grid gap-8 px-5 py-6 sm:px-7 sm:py-7 xl:grid-cols-[1.35fr_0.95fr] xl:px-8">
                    <div className="space-y-6">
                        <div className="flex flex-wrap items-center gap-3">
                            <Badge className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-emerald-500 shadow-none">
                                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                                Quiz Control Room
                            </Badge>
                            <Badge variant="outline" className="rounded-full px-3 py-1">
                                <BookOpenCheck className="mr-1.5 h-3.5 w-3.5" />
                                Timed quiz publishing and review
                            </Badge>
                        </div>

                        <div className="space-y-3">
                            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                                Manage Quizzes
                            </h1>
                            <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                                Watch release windows, track secure quizzes, and jump into editing from one
                                focused admin workspace.
                            </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                            <HeroChip label="Total" value={String(quizzes.length)} tone="slate" />
                            <HeroChip label="Active" value={String(stats.active)} tone="emerald" />
                            <HeroChip label="SEB Only" value={String(stats.sebOnly)} tone="rose" />
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                        <SummaryPanel
                            icon={Target}
                            label="Marks Planned"
                            value={String(stats.totalMarks)}
                            helper="Combined marks across every created quiz"
                            tone="emerald"
                        />
                        <SummaryPanel
                            icon={Shield}
                            label="Protected Quizzes"
                            value={String(stats.sebOnly)}
                            helper="Quizzes restricted to Safe Exam Browser"
                            tone="rose"
                        />
                        <SummaryPanel
                            icon={TimerReset}
                            label="Expired"
                            value={String(stats.expired)}
                            helper="Quiz windows that have already closed"
                            tone="amber"
                        />
                    </div>
                </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
                <SnapshotCard
                    icon={Clock3}
                    label="Live Now"
                    value={String(stats.active)}
                    helper="Currently available to students"
                    tone="emerald"
                />
                <SnapshotCard
                    icon={CalendarDays}
                    label="Coming Up"
                    value={String(stats.upcoming)}
                    helper="Scheduled to publish later"
                    tone="sky"
                />
                <SnapshotCard
                    icon={Shield}
                    label="SEB Locked"
                    value={String(stats.sebOnly)}
                    helper="Can only launch in Safe Exam Browser"
                    tone="rose"
                />
            </section>

            <section className="rounded-[28px] border border-border/60 bg-card/80 p-5 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)] backdrop-blur-sm sm:p-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="space-y-1.5">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                            Explore Quizzes
                        </p>
                        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                            Search and filter quiz timelines
                        </h2>
                    </div>

                    <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
                        <div className="relative w-full xl:w-80">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search title or description..."
                                className="h-11 rounded-2xl border-border/60 bg-background/80 pl-10 shadow-sm"
                                aria-label="Search quizzes"
                            />
                        </div>

                        <Link href="/admin/quizzes/create">
                            <Button className="h-11 rounded-2xl px-4">
                                <Plus className="mr-2 h-4 w-4" />
                                Create Quiz
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
                            {filteredQuizzes.length} shown
                        </Badge>
                        <Badge variant="outline" className="rounded-full px-3 py-1">
                            {stats.active} active
                        </Badge>
                        <Badge variant="outline" className="rounded-full px-3 py-1">
                            {stats.sebOnly} SEB only
                        </Badge>
                    </div>
                </div>
            </section>

            <section className="space-y-4">
                {filteredQuizzes.length > 0 ? (
                    <div className="grid gap-4" role="list" aria-label="Quizzes list">
                        {filteredQuizzes.map((quiz) => (
                            <QuizCard
                                key={quiz._id}
                                quiz={{
                                    ...quiz,
                                    status: getComputedStatus(quiz),
                                }}
                                actionLabel="Open Quiz Details"
                                onAction={() => {
                                    window.location.href = `/admin/quizzes/${quiz._id}`
                                }}
                            />
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        title="No quizzes found"
                        description="Try another search, adjust the filters, or create a fresh quiz."
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
    tone: "slate" | "emerald" | "rose"
}) {
    return (
        <div
            className={`rounded-[22px] border border-border/60 px-4 py-3 ${
                tone === "emerald"
                    ? "bg-emerald-500/10"
                    : tone === "rose"
                      ? "bg-rose-500/10"
                      : "bg-background/70"
            }`}
        >
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                {label}
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
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
    tone: "emerald" | "sky" | "rose"
}) {
    return (
        <div className="rounded-[26px] border border-border/60 bg-card/80 p-5 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)]">
            <div className="flex items-center gap-3">
                <div
                    className={`rounded-2xl p-3 ${
                        tone === "emerald"
                            ? "bg-emerald-500/10 text-emerald-500"
                            : tone === "rose"
                              ? "bg-rose-500/10 text-rose-500"
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
