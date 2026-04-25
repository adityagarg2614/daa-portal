'use client'

import React, { useEffect, useMemo, useState } from "react"
import axios from "axios"
import {
    BarChart3,
    FileSpreadsheet,
    Medal,
    Search,
    Sparkles,
    Target,
    Trophy,
    TrendingUp,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { FilterTabs } from "@/components/ui/filter-tabs"
import { ResultCard } from "@/components/ui/result-card"
import {
    ResultsDashboardSkeleton,
    ResultCardSkeleton,
    StatsCardSkeleton,
} from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type ResultStatus = "Excellent" | "Good" | "Average" | "Needs Improvement"

type Result = {
    id: string
    assignmentTitle: string
    subject: string
    totalProblems: number
    submittedProblems: number
    obtainedMarks: number
    totalMarks: number
    percentage: number
    evaluatedAt: string
    status: ResultStatus
}

export default function ResultsPage() {
    const [search, setSearch] = useState("")
    const [activeTab, setActiveTab] = useState<"All" | ResultStatus>("All")
    const [results, setResults] = useState<Result[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchResults = async () => {
            try {
                const res = await axios.get("/api/student/results")
                if (res.data.success) {
                    setResults(res.data.results)
                }
            } catch (error) {
                console.error("Error fetching results:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchResults()
    }, [])

    const tabs: Array<"All" | ResultStatus> = [
        "All",
        "Excellent",
        "Good",
        "Average",
        "Needs Improvement",
    ]

    const filteredResults = useMemo(() => {
        return results.filter((result) => {
            const matchesSearch =
                result.assignmentTitle.toLowerCase().includes(search.toLowerCase()) ||
                result.subject.toLowerCase().includes(search.toLowerCase())

            const matchesTab = activeTab === "All" ? true : result.status === activeTab

            return matchesSearch && matchesTab
        })
    }, [results, search, activeTab])

    const insights = useMemo(() => {
        const averagePercentage = results.length
            ? Math.round(
                results.reduce((sum, result) => sum + result.percentage, 0) / results.length
            )
            : 0

        const totalMarksEarned = results.reduce(
            (sum, result) => sum + result.obtainedMarks,
            0
        )
        const totalPossibleMarks = results.reduce(
            (sum, result) => sum + result.totalMarks,
            0
        )
        const topScore = results.length
            ? Math.max(...results.map((result) => result.percentage))
            : 0
        const excellentCount = results.filter(
            (result) => result.status === "Excellent"
        ).length
        const improvingCount = results.filter(
            (result) => result.status === "Needs Improvement"
        ).length

        const overallTone =
            averagePercentage >= 85
                ? "Outstanding academic momentum"
                : averagePercentage >= 65
                    ? "Strong, stable performance"
                    : "More consistency will unlock better scores"

        return {
            averagePercentage,
            totalMarksEarned,
            totalPossibleMarks,
            topScore,
            excellentCount,
            improvingCount,
            overallTone,
        }
    }, [results])

    if (loading) {
        return (
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-8 pt-2 sm:px-6 xl:px-8">
                <ResultsDashboardSkeleton />
                <div className="grid gap-4 lg:grid-cols-3">
                    <StatsCardSkeleton />
                    <StatsCardSkeleton />
                    <StatsCardSkeleton />
                </div>
                <StatsCardSkeleton />
                <ResultCardSkeleton />
                <ResultCardSkeleton />
            </div>
        )
    }

    return (
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-8 pt-2 sm:px-6 xl:px-8">
            <section className="relative overflow-hidden rounded-[32px] border border-border/60 bg-linear-to-br from-card via-card to-violet-500/8 shadow-[0_28px_80px_-40px_rgba(0,0,0,0.65)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.14),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.1),transparent_30%)]" />
                <div className="relative grid gap-8 px-5 py-6 sm:px-7 sm:py-7 xl:grid-cols-[1.35fr_0.95fr] xl:px-8">
                    <div className="space-y-6">
                        <div className="flex flex-wrap items-center gap-3">
                            <Badge className="rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-violet-500 shadow-none">
                                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                                Results Intelligence
                            </Badge>
                            <Badge variant="outline" className="rounded-full px-3 py-1">
                                <Target className="mr-1.5 h-3.5 w-3.5" />
                                Evaluated assignments only
                            </Badge>
                        </div>

                        <div className="space-y-3">
                            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                                Assignments Results
                            </h1>
                            <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                                Review your assignment scores, completion quality, and overall
                                trend in one polished dashboard built to make strengths and weak
                                spots obvious immediately.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                                    Average Score
                                </p>
                                <div className="mt-2 flex flex-wrap items-end gap-3">
                                    <span
                                        className={cn(
                                            "text-6xl font-black leading-none tracking-[-0.06em]",
                                            insights.averagePercentage >= 85 && "text-emerald-500",
                                            insights.averagePercentage >= 65 &&
                                            insights.averagePercentage < 85 &&
                                            "text-sky-500",
                                            insights.averagePercentage < 65 && "text-amber-500"
                                        )}
                                    >
                                        {insights.averagePercentage}%
                                    </span>
                                    <div className="mb-1 rounded-2xl border border-border/60 bg-background/70 px-3 py-2 text-sm text-muted-foreground backdrop-blur">
                                        {insights.overallTone}
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-3">
                                <HeroChip
                                    label="Assignments"
                                    value={String(results.length)}
                                    tone="slate"
                                />
                                <HeroChip
                                    label="Excellent"
                                    value={String(insights.excellentCount)}
                                    tone="emerald"
                                />
                                <HeroChip
                                    label="Top Score"
                                    value={`${insights.topScore}%`}
                                    tone="violet"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                        <SummaryPanel
                            icon={FileSpreadsheet}
                            label="Total Marks Earned"
                            value={String(insights.totalMarksEarned)}
                            helper={`Out of ${insights.totalPossibleMarks}`}
                            tone="sky"
                        />
                        <SummaryPanel
                            icon={Trophy}
                            label="Excellent Results"
                            value={String(insights.excellentCount)}
                            helper="High performing submissions"
                            tone="emerald"
                        />
                        <SummaryPanel
                            icon={TrendingUp}
                            label="Needs Attention"
                            value={String(insights.improvingCount)}
                            helper="Results needing more iteration"
                            tone="amber"
                        />
                    </div>
                </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
                <SnapshotCard
                    icon={FileSpreadsheet}
                    label="Result Entries"
                    value={String(results.length)}
                    helper="Assignments with at least one submission"
                    tone="sky"
                />
                <SnapshotCard
                    icon={BarChart3}
                    label="Average Score"
                    value={`${insights.averagePercentage}%`}
                    helper="Across all recorded results"
                    tone="violet"
                />
                <SnapshotCard
                    icon={Medal}
                    label="Top Performance"
                    value={`${insights.topScore}%`}
                    helper="Your strongest assignment score"
                    tone="emerald"
                />
            </section>

            <section className="rounded-[28px] border border-border/60 bg-card/80 p-5 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)] backdrop-blur-sm sm:p-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="space-y-1.5">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                            Explore Results
                        </p>
                        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                            Search and filter your performance history
                        </h2>
                    </div>

                    <div className="relative w-full xl:w-80">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search assignment or subject"
                            className="h-11 rounded-2xl border-border/60 bg-background/80 pl-10 shadow-sm"
                            aria-label="Search results"
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
                            {filteredResults.length} shown
                        </Badge>
                        <Badge variant="outline" className="rounded-full px-3 py-1">
                            {results.length} total
                        </Badge>
                    </div>
                </div>
            </section>

            <section className="space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                            Assignment Scores
                        </p>
                        <h2 className="text-2xl font-semibold tracking-tight">
                            Your result cards
                        </h2>
                    </div>
                </div>

                {filteredResults.length > 0 ? (
                    <div className="grid gap-4" role="list" aria-label="Results list" aria-live="polite">
                        {filteredResults.map((result) => (
                            <ResultCard
                                key={result.id}
                                result={result}
                                actionLabel="Detailed result view"
                            />
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        title="No results found"
                        description="Try a different search or filter. Your evaluated assignment results will appear here."
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
    tone: "emerald" | "violet" | "slate"
}) {
    const tones = {
        emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
        violet: "border-violet-500/20 bg-violet-500/10 text-violet-500",
        slate: "border-border/60 bg-background/70 text-foreground",
    }

    return (
        <div className="rounded-2xl border border-border/60 bg-background/60 p-3 backdrop-blur-sm">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                {label}
            </p>
            <div className="mt-2 flex items-center justify-between">
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
    tone: "sky" | "violet" | "emerald"
}) {
    const tones = {
        sky: "border-sky-500/20 bg-sky-500/10 text-sky-500",
        violet: "border-violet-500/20 bg-violet-500/10 text-violet-500",
        emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
    }

    return (
        <Card className="rounded-[28px] border border-border/60 bg-card/80 py-0 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)] backdrop-blur-sm">
            <CardContent className="p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                            {label}
                        </p>
                        <p className="mt-3 text-4xl font-black tracking-tighter text-foreground">
                            {value}
                        </p>
                        <p className="mt-2 text-sm text-muted-foreground">{helper}</p>
                    </div>
                    <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl border", tones[tone])}>
                        <Icon className="h-5 w-5" />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
