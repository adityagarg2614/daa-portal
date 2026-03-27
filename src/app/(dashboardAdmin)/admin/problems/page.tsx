'use client'

import axios from "axios"
import Link from "next/link"
import React, { useEffect, useMemo, useState } from "react"
import { BookOpen, Search, ShieldCheck, Star } from "lucide-react"

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

    const getDifficultyClasses = (difficulty: string) => {
        switch (difficulty) {
            case "Easy":
                return "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
            case "Medium":
                return "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400"
            case "Hard":
                return "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"
            default:
                return "bg-muted text-muted-foreground"
        }
    }

    const tabs: Array<"All" | "Easy" | "Medium" | "Hard"> = [
        "All",
        "Easy",
        "Medium",
        "Hard",
    ]

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 pt-2">
            <div className="rounded-2xl border bg-background p-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Problem Bank</h1>
                        <p className="mt-2 text-sm text-muted-foreground">
                            View and manage all reusable problems for assignments.
                        </p>
                    </div>

                    <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row">
                        <div className="relative w-full lg:w-80">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search problems..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="h-11 w-full rounded-xl border bg-background pl-10 pr-4 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
                            />
                        </div>

                        <Link
                            href="/admin/problems/create"
                            className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                        >
                            Create Problem
                        </Link>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
                            <BookOpen className="h-5 w-5" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`rounded-full px-4 py-2 text-sm font-medium transition ${activeTab === tab
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="rounded-2xl border bg-background p-10 text-center shadow-sm">
                    <p className="text-sm text-muted-foreground">Loading problems...</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredProblems.length > 0 ? (
                        filteredProblems.map((problem) => (
                            <div
                                key={problem._id}
                                className="rounded-2xl border bg-background p-5 shadow-sm transition hover:shadow-md"
                            >
                                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                    <div className="space-y-3">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <h2 className="text-lg font-semibold">{problem.title}</h2>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-medium ${getDifficultyClasses(
                                                    problem.difficulty
                                                )}`}
                                            >
                                                {problem.difficulty}
                                            </span>
                                            <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
                                                {problem.marks} Marks
                                            </span>
                                        </div>

                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                            {problem.description}
                                        </p>

                                        <div className="text-sm text-muted-foreground">
                                            <span className="font-medium text-foreground">Slug:</span> {problem.slug}
                                        </div>

                                        {problem.tags?.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {problem.tags.map((tag, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground"
                                                    >
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

                                        <button className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90">
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="rounded-2xl border border-dashed bg-background p-10 text-center shadow-sm">
                            <h3 className="text-lg font-semibold">No problems found</h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Create a new problem or change the search/filter.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}