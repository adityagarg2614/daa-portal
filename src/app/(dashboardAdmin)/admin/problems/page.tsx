'use client'

import axios from "axios"
import Link from "next/link"
import React, { useEffect, useMemo, useState } from "react"
import {
    BookOpen,
    Search,
    ShieldCheck,
    Star,
    X,
    Plus,
    Award,
    Code2,
    Tag,
    Zap,
    AlertCircle,
    CheckCircle2,
    ArrowRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

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

export default function ProblemsPage() {
    const [problems, setProblems] = useState<Problem[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [activeTab, setActiveTab] = useState<"All" | "Easy" | "Medium" | "Hard">("All")

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
        return problems.filter((problem) => {
            const matchesSearch =
                problem.title.toLowerCase().includes(search.toLowerCase()) ||
                problem.slug.toLowerCase().includes(search.toLowerCase()) ||
                problem.tags?.some((tag) =>
                    tag.toLowerCase().includes(search.toLowerCase())
                )

            const matchesTab = activeTab === "All" ? true : problem.difficulty === activeTab

            return matchesSearch && matchesTab
        })
    }, [problems, search, activeTab])

    const tabs: Array<"All" | "Easy" | "Medium" | "Hard"> = [
        "All",
        "Easy",
        "Medium",
        "Hard",
    ]

    const getDifficultyIcon = (difficulty: string) => {
        switch (difficulty) {
            case "Easy":
                return CheckCircle2
            case "Medium":
                return AlertCircle
            case "Hard":
                return Zap
            default:
                return AlertCircle
        }
    }

    const getDifficultyVariant = (
        difficulty: string
    ): "default" | "secondary" | "destructive" => {
        switch (difficulty) {
            case "Easy":
                return "secondary"
            case "Medium":
                return "default"
            case "Hard":
                return "destructive"
            default:
                return "default"
        }
    }

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 pt-2">
            {/* Enhanced Header */}
            <div
                className="relative overflow-hidden rounded-2xl border bg-linear-to-br from-background to-muted p-8 shadow-sm"
                role="banner"
            >
                <div className="relative z-10">
                    <div className="flex items-center gap-3">
                        <div
                            className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg"
                            aria-hidden="true"
                        >
                            <BookOpen className="h-6 w-6 icon-bounce" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight" id="page-heading">
                                Problem Bank
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                View and manage all reusable problems for assignments
                            </p>
                        </div>
                    </div>
                </div>
                {/* Decorative background elements */}
                <div
                    className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/5 blur-3xl"
                    aria-hidden="true"
                />
                <div
                    className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-primary/5 blur-3xl"
                    aria-hidden="true"
                />
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" role="region" aria-label="Problem statistics">
                <div className="rounded-2xl border bg-background p-5 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Total Problems</p>
                            <h2 className="mt-2 text-2xl font-bold">{problems.length}</h2>
                        </div>
                        <div className="rounded-xl bg-muted p-2">
                            <BookOpen className="h-5 w-5" />
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border bg-background p-5 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Easy</p>
                            <h2 className="mt-2 text-2xl font-bold">
                                {problems.filter((p) => p.difficulty === "Easy").length}
                            </h2>
                        </div>
                        <div className="rounded-xl bg-muted p-2">
                            <ShieldCheck className="h-5 w-5" />
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border bg-background p-5 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Medium</p>
                            <h2 className="mt-2 text-2xl font-bold">
                                {problems.filter((p) => p.difficulty === "Medium").length}
                            </h2>
                        </div>
                        <div className="rounded-xl bg-muted p-2">
                            <Star className="h-5 w-5" />
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border bg-background p-5 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Hard</p>
                            <h2 className="mt-2 text-2xl font-bold">
                                {problems.filter((p) => p.difficulty === "Hard").length}
                            </h2>
                        </div>
                        <div className="rounded-xl bg-muted p-2">
                            <Zap className="h-5 w-5" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and Actions Bar */}
            <div
                className="rounded-2xl border bg-background p-6 shadow-sm"
                role="search"
                aria-label="Problem search and filters"
            >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                        {tabs.map((tab) => {
                            const isActive = activeTab === tab
                            return (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={cn(
                                        "rounded-full px-4 py-2 text-sm font-medium transition-all",
                                        isActive
                                            ? "bg-primary text-primary-foreground shadow-md"
                                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                                    )}
                                    aria-pressed={isActive}
                                >
                                    {tab}
                                </button>
                            )
                        })}
                    </div>

                    <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row">
                        <div className="relative w-full lg:w-80">
                            <Search
                                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground icon-pulse"
                                aria-hidden="true"
                            />
                            <input
                                type="text"
                                placeholder="Search problems..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="h-11 w-full rounded-xl border bg-background pl-10 pr-10 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 transition-all"
                                aria-label="Search problems"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-muted transition-colors"
                                    aria-label="Clear search"
                                >
                                    <X className="h-4 w-4 icon-hover-scale" />
                                </button>
                            )}
                        </div>

                        <Link
                            href="/admin/problems/create"
                            className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 hover:shadow-md"
                        >
                            <Plus className="mr-2 h-4 w-4 icon-hover-scale" />
                            Create Problem
                        </Link>
                    </div>
                </div>
            </div>

            {/* Problems List */}
            {loading ? (
                <div className="rounded-2xl border bg-background p-10 text-center shadow-sm" role="status" aria-label="Loading problems">
                    <p className="text-sm text-muted-foreground">Loading problems...</p>
                </div>
            ) : (
                <div
                    className="grid gap-4"
                    role="list"
                    aria-label="Problems list"
                    aria-live="polite"
                >
                    {filteredProblems.length > 0 ? (
                        filteredProblems.map((problem) => {
                            const DifficultyIcon = getDifficultyIcon(problem.difficulty)

                            return (
                                <div
                                    key={problem._id}
                                    role="listitem"
                                    className="group relative overflow-hidden rounded-2xl border bg-background p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/50"
                                >
                                    {/* Difficulty indicator bar */}
                                    <div
                                        className={cn(
                                            "absolute -left-1 top-0 bottom-0 w-1",
                                            problem.difficulty === "Easy" && "bg-green-500",
                                            problem.difficulty === "Medium" && "bg-yellow-500",
                                            problem.difficulty === "Hard" && "bg-red-500"
                                        )}
                                        aria-hidden="true"
                                    />

                                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                        <div className="space-y-3 flex-1">
                                            <div className="flex flex-wrap items-center gap-3">
                                                <h2 className="text-lg font-semibold">{problem.title}</h2>
                                                <Badge
                                                    variant={getDifficultyVariant(problem.difficulty)}
                                                    className="gap-1"
                                                >
                                                    <DifficultyIcon className="h-3 w-3" />
                                                    {problem.difficulty}
                                                </Badge>
                                                <Badge variant="outline" className="gap-1">
                                                    <Award className="h-3 w-3" />
                                                    {problem.marks} Marks
                                                </Badge>
                                            </div>

                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                                {problem.description}
                                            </p>

                                            <div className="flex items-center gap-2">
                                                <Code2 className="h-3.5 w-3.5 text-muted-foreground" />
                                                <p className="font-mono text-xs text-muted-foreground">
                                                    <code className="rounded-md bg-muted/50 px-2 py-0.5">
                                                        {problem.slug}
                                                    </code>
                                                </p>
                                            </div>

                                            {problem.tags?.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {problem.tags.map((tag, idx) => (
                                                        <span
                                                            key={idx}
                                                            className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium transition-colors hover:bg-muted/80"
                                                        >
                                                            <Tag className="h-3 w-3" />
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex min-w-[180px] flex-col items-start gap-3 xl:items-end">
                                            <div className="rounded-xl bg-muted px-4 py-2 text-sm text-muted-foreground">
                                                {problem.constraints?.length || 0} constraints
                                            </div>

                                            <Button className="gap-2">
                                                View Details
                                                <ArrowRight className="h-4 w-4 icon-hover-scale" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    ) : (
                        <div
                            className="rounded-2xl border border-dashed bg-background p-10 text-center shadow-sm"
                            role="status"
                            aria-label="No problems found"
                        >
                            <Search className="mx-auto mb-3 h-12 w-12 opacity-50" />
                            <h3 className="text-lg font-semibold">No problems found</h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Create a new problem or change the search/filter.
                            </p>
                            <Link
                                href="/admin/problems/create"
                                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                            >
                                <Plus className="h-4 w-4" />
                                Create Problem
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
