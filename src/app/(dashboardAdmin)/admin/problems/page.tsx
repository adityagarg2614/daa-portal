'use client'

import axios from "axios"
import Link from "next/link"
import React, { useEffect, useMemo, useState } from "react"
import {
    AlertCircle,
    ArrowRight,
    Award,
    BookOpen,
    CheckCircle2,
    Code2,
    Library,
    Plus,
    Search,
    Sparkles,
    Tag,
    Target,
    Zap,
    type LucideIcon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { FilterTabs } from "@/components/ui/filter-tabs"
import { Input } from "@/components/ui/input"
import {
    AssignmentCardSkeleton,
    StatsCardSkeleton,
} from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

type Problem = {
    _id: string
    title: string
    slug: string
    description: string
    difficulty: "Easy" | "Medium" | "Hard"
    marks: number
    tags: string[]
    constraints: string[]
    createdAt?: string
}

type DifficultyTab = "All" | "Easy" | "Medium" | "Hard"

export default function ProblemsPage() {
    const [problems, setProblems] = useState<Problem[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [activeTab, setActiveTab] = useState<DifficultyTab>("All")

    useEffect(() => {
        const fetchProblems = async () => {
            try {
                const res = await axios.get("/api/admin/problems")
                setProblems(res.data.problems || [])
            } catch (error) {
                console.error("Error fetching problems:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchProblems()
    }, [])

    const filteredProblems = useMemo(() => {
        const query = search.toLowerCase()

        return problems.filter((problem) => {
            const matchesSearch =
                problem.title.toLowerCase().includes(query) ||
                problem.slug.toLowerCase().includes(query) ||
                problem.description.toLowerCase().includes(query) ||
                problem.tags?.some((tag) => tag.toLowerCase().includes(query))

            const matchesTab = activeTab === "All" ? true : problem.difficulty === activeTab

            return matchesSearch && matchesTab
        })
    }, [problems, search, activeTab])

    const insights = useMemo(() => {
        const easy = problems.filter((problem) => problem.difficulty === "Easy").length
        const medium = problems.filter((problem) => problem.difficulty === "Medium").length
        const hard = problems.filter((problem) => problem.difficulty === "Hard").length
        const totalMarks = problems.reduce((sum, problem) => sum + problem.marks, 0)
        const totalTags = new Set(problems.flatMap((problem) => problem.tags || [])).size

        return {
            easy,
            medium,
            hard,
            totalMarks,
            totalTags,
        }
    }, [problems])

    const tabs: DifficultyTab[] = ["All", "Easy", "Medium", "Hard"]

    if (loading) {
        return (
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-8 pt-2 sm:px-6 xl:px-8">
                <ProblemsHeroSkeleton />
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
                            <div className="h-10 w-24 animate-pulse rounded-full bg-muted" />
                            <div className="h-10 w-28 animate-pulse rounded-full bg-muted" />
                            <div className="h-10 w-20 animate-pulse rounded-full bg-muted" />
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
            <section className="relative overflow-hidden rounded-[32px] border border-border/60 bg-linear-to-br from-card via-card to-fuchsia-500/8 shadow-[0_28px_80px_-40px_rgba(0,0,0,0.65)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(244,114,182,0.14),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.12),transparent_30%)]" />
                <div className="relative grid gap-8 px-5 py-6 sm:px-7 sm:py-7 xl:grid-cols-[1.35fr_0.95fr] xl:px-8">
                    <div className="space-y-6">
                        <div className="flex flex-wrap items-center gap-3">
                            <Badge className="rounded-full border border-fuchsia-500/20 bg-fuchsia-500/10 px-3 py-1 text-fuchsia-500 shadow-none">
                                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                                Problem Bank
                            </Badge>
                            <Badge variant="outline" className="rounded-full px-3 py-1">
                                <Library className="mr-1.5 h-3.5 w-3.5" />
                                Admin problem management workspace
                            </Badge>
                        </div>

                        <div className="space-y-3">
                            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                                Problem Library
                            </h1>
                            <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                                Review and manage the complete problem bank, ensuring balanced difficulty coverage and maintaining a high-quality question repository.
                            </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                            <HeroChip label="Total" value={String(problems.length)} tone="slate" />
                            <HeroChip label="Easy" value={String(insights.easy)} tone="emerald" />
                            <HeroChip label="Hard" value={String(insights.hard)} tone="rose" />
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                        <SummaryPanel
                            icon={Target}
                            label="Total Marks"
                            value={String(insights.totalMarks)}
                            helper="Combined marks across the full problem library"
                            tone="sky"
                        />
                        <SummaryPanel
                            icon={Tag}
                            label="Unique Tags"
                            value={String(insights.totalTags)}
                            helper="Concept labels currently represented in the bank"
                            tone="violet"
                        />
                        <SummaryPanel
                            icon={Award}
                            label="Medium Sets"
                            value={String(insights.medium)}
                            helper="Problems in the middle of your difficulty spread"
                            tone="amber"
                        />
                    </div>
                </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
                <SnapshotCard
                    icon={BookOpen}
                    label="Problems"
                    value={String(problems.length)}
                    helper="Total reusable coding questions"
                    tone="sky"
                />
                <SnapshotCard
                    icon={CheckCircle2}
                    label="Easy Coverage"
                    value={String(insights.easy)}
                    helper="Good entry points for students"
                    tone="emerald"
                />
                <SnapshotCard
                    icon={Zap}
                    label="Hard Coverage"
                    value={String(insights.hard)}
                    helper="Stretch problems for stronger practice"
                    tone="rose"
                />
            </section>

            <section className="rounded-[28px] border border-border/60 bg-card/80 p-5 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)] backdrop-blur-sm sm:p-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="space-y-1.5">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                            Explore Problems
                        </p>
                        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                            Search the Problem from Problem Bank
                        </h2>
                    </div>

                    <div className="relative w-full xl:w-80">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search problems..."
                            className="h-11 rounded-2xl border-border/60 bg-background/80 pl-10 shadow-sm"
                        />
                    </div>
                </div>

                <div className="mt-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <FilterTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

                    <Link
                        href="/admin/problems/create"
                        className="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 hover:shadow-md"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Create Problem
                    </Link>
                </div>
            </section>

            <div className="grid gap-4" role="list" aria-label="Problems list" aria-live="polite">
                {filteredProblems.length > 0 ? (
                    filteredProblems.map((problem) => {
                        const difficulty = getDifficultyConfig(problem.difficulty)
                        const DifficultyIcon = difficulty.icon

                        return (
                            <article
                                key={problem._id}
                                className="group relative overflow-hidden rounded-[28px] border border-border/60 bg-card/80 p-5 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_24px_56px_-32px_rgba(0,0,0,0.55)] sm:p-6"
                                role="listitem"
                            >
                                <div
                                    className={cn("absolute inset-x-0 top-0 h-px opacity-80", difficulty.line)}
                                    aria-hidden="true"
                                />

                                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                                    <div className="flex-1 space-y-4">
                                        <div className="flex flex-wrap items-start justify-between gap-4">
                                            <div className="space-y-3">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <Badge
                                                        variant="outline"
                                                        className={cn("rounded-full px-3 py-1", difficulty.badge)}
                                                    >
                                                        <DifficultyIcon className="mr-1.5 h-3.5 w-3.5" />
                                                        {problem.difficulty}
                                                    </Badge>
                                                    <Badge variant="outline" className="rounded-full px-3 py-1">
                                                        <Award className="mr-1.5 h-3.5 w-3.5" />
                                                        {problem.marks} marks
                                                    </Badge>
                                                    <Badge variant="outline" className="rounded-full px-3 py-1">
                                                        {problem.constraints?.length || 0} constraints
                                                    </Badge>
                                                </div>

                                                <div>
                                                    <h3 className="text-xl font-semibold tracking-tight text-foreground">
                                                        {problem.title}
                                                    </h3>
                                                </div>
                                            </div>

                                            <div className="rounded-[22px] border border-border/60 bg-background/65 px-4 py-3 text-sm text-muted-foreground">
                                                Ready for assignments
                                            </div>
                                        </div>

                                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                                            <InfoTile icon={Code2} label="Slug" value={problem.slug} mono />
                                            <InfoTile icon={BookOpen} label="Tags" value={`${problem.tags?.length || 0} linked`} />
                                            <InfoTile icon={DifficultyIcon} label="Difficulty" value={problem.difficulty} />
                                            <InfoTile icon={Award} label="Marks" value={`${problem.marks} total`} />
                                        </div>

                                        {problem.tags?.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {problem.tags.map((tag, index) => (
                                                    <Badge key={index} variant="outline" className="rounded-full px-3 py-1">
                                                        <Tag className="mr-1.5 h-3.5 w-3.5" />
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex min-w-[220px] flex-col items-start gap-3 xl:items-end">
                                        <Link
                                            href={`/admin/problems/${problem._id}`}
                                            className="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
                                        >
                                            Open Problem
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </div>
                                </div>
                            </article>
                        )
                    })
                ) : (
                    <EmptyState
                        title="No problems found"
                        description="Create a new problem or widen the search and difficulty filters."
                        action={
                            <Link
                                href="/admin/problems/create"
                                className="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Create Problem
                            </Link>
                        }
                        className="rounded-[28px] border-border/60 bg-card/80 p-10 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)]"
                    />
                )}
            </div>
        </div>
    )
}

function getDifficultyConfig(difficulty: Problem["difficulty"]) {
    switch (difficulty) {
        case "Easy":
            return {
                badge: "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
                line: "bg-linear-to-r from-emerald-500/70 via-emerald-500/25 to-transparent",
                icon: CheckCircle2,
            }
        case "Medium":
            return {
                badge: "border-amber-500/20 bg-amber-500/10 text-amber-500",
                line: "bg-linear-to-r from-amber-500/70 via-amber-500/25 to-transparent",
                icon: AlertCircle,
            }
        case "Hard":
            return {
                badge: "border-rose-500/20 bg-rose-500/10 text-rose-500",
                line: "bg-linear-to-r from-rose-500/70 via-rose-500/25 to-transparent",
                icon: Zap,
            }
    }
}

function ProblemsHeroSkeleton() {
    return (
        <section className="rounded-[32px] border border-border/60 bg-card/80 p-6 shadow-[0_28px_80px_-40px_rgba(0,0,0,0.65)] sm:p-8">
            <div className="grid gap-8 xl:grid-cols-[1.35fr_0.95fr]">
                <div className="space-y-5">
                    <div className="h-8 w-40 animate-pulse rounded-full bg-muted" />
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
    const toneClass = {
        slate: "border-border/60 bg-background/70 text-foreground",
        emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
        rose: "border-rose-500/20 bg-rose-500/10 text-rose-500",
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
    tone: "sky" | "violet" | "amber"
}) {
    const toneClass = {
        sky: "border-sky-500/20 bg-sky-500/10 text-sky-500",
        violet: "border-violet-500/20 bg-violet-500/10 text-violet-500",
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
    tone: "sky" | "emerald" | "rose"
}) {
    const toneClass = {
        sky: "text-sky-500",
        emerald: "text-emerald-500",
        rose: "text-rose-500",
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

function InfoTile({
    icon: Icon,
    label,
    value,
    mono = false,
}: {
    icon: LucideIcon
    label: string
    value: string
    mono?: boolean
}) {
    return (
        <div className="rounded-[22px] border border-border/60 bg-background/65 p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
                <Icon className="h-4 w-4" />
                <p className="text-xs font-semibold uppercase tracking-[0.18em]">{label}</p>
            </div>
            <p className={cn("mt-3 text-sm font-medium leading-6 text-foreground", mono && "font-mono")}>
                {value}
            </p>
        </div>
    )
}
