'use client'

import React, { useMemo, useState } from "react"
import {
    Trophy,
    Search,
    CheckCircle2,
    BarChart3,
    FileSpreadsheet,
    TrendingUp,
} from "lucide-react"

type ResultStatus = "Excellent" | "Good" | "Average" | "Needs Improvement"

type Result = {
    id: number
    assignmentTitle: string
    subject: string
    totalProblems: number
    obtainedMarks: number
    totalMarks: number
    percentage: number
    evaluatedAt: string
    status: ResultStatus
}

export default function ResultsPage() {
    const [search, setSearch] = useState("")
    const [activeTab, setActiveTab] = useState<"All" | ResultStatus>("All")

    const results: Result[] = [
        {
            id: 1,
            assignmentTitle: "DAA Lab Assignment 1",
            subject: "Design and Analysis of Algorithms",
            totalProblems: 5,
            obtainedMarks: 18,
            totalMarks: 20,
            percentage: 90,
            evaluatedAt: "18 Mar 2026, 01:20 PM",
            status: "Excellent",
        },
        {
            id: 2,
            assignmentTitle: "Searching and Sorting",
            subject: "Design and Analysis of Algorithms",
            totalProblems: 4,
            obtainedMarks: 14,
            totalMarks: 20,
            percentage: 70,
            evaluatedAt: "20 Mar 2026, 02:10 PM",
            status: "Good",
        },
        {
            id: 3,
            assignmentTitle: "Recursion and Backtracking",
            subject: "Design and Analysis of Algorithms",
            totalProblems: 6,
            obtainedMarks: 11,
            totalMarks: 20,
            percentage: 55,
            evaluatedAt: "22 Mar 2026, 04:15 PM",
            status: "Average",
        },
        {
            id: 4,
            assignmentTitle: "Greedy Algorithms Practice",
            subject: "Design and Analysis of Algorithms",
            totalProblems: 5,
            obtainedMarks: 7,
            totalMarks: 20,
            percentage: 35,
            evaluatedAt: "23 Mar 2026, 10:00 AM",
            status: "Needs Improvement",
        },
    ]

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

    const getStatusClasses = (status: ResultStatus) => {
        switch (status) {
            case "Excellent":
                return "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
            case "Good":
                return "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
            case "Average":
                return "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400"
            case "Needs Improvement":
                return "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"
            default:
                return "bg-muted text-muted-foreground"
        }
    }

    const averagePercentage = Math.round(
        results.reduce((acc, curr) => acc + curr.percentage, 0) / results.length
    )

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 pt-2">
            <div className="rounded-2xl border bg-background p-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Results</h1>
                        <p className="mt-2 text-sm text-muted-foreground">
                            View your evaluated assignment scores and overall performance.
                        </p>
                    </div>

                    <div className="relative w-full lg:w-80">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search results..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-11 w-full rounded-xl border bg-background pl-10 pr-4 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
                        />
                    </div>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border bg-background p-5 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Total Results</p>
                            <h2 className="mt-2 text-2xl font-bold">{results.length}</h2>
                        </div>
                        <div className="rounded-xl bg-muted p-2">
                            <FileSpreadsheet className="h-5 w-5" />
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border bg-background p-5 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Average Score</p>
                            <h2 className="mt-2 text-2xl font-bold">{averagePercentage}%</h2>
                        </div>
                        <div className="rounded-xl bg-muted p-2">
                            <BarChart3 className="h-5 w-5" />
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border bg-background p-5 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Excellent Results</p>
                            <h2 className="mt-2 text-2xl font-bold">
                                {results.filter((r) => r.status === "Excellent").length}
                            </h2>
                        </div>
                        <div className="rounded-xl bg-muted p-2">
                            <Trophy className="h-5 w-5" />
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border bg-background p-5 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Improvement Needed</p>
                            <h2 className="mt-2 text-2xl font-bold">
                                {results.filter((r) => r.status === "Needs Improvement").length}
                            </h2>
                        </div>
                        <div className="rounded-xl bg-muted p-2">
                            <TrendingUp className="h-5 w-5" />
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

            <div className="grid gap-4">
                {filteredResults.length > 0 ? (
                    filteredResults.map((result) => (
                        <div
                            key={result.id}
                            className="rounded-2xl border bg-background p-5 shadow-sm transition hover:shadow-md"
                        >
                            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                <div className="space-y-3">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <h2 className="text-lg font-semibold">{result.assignmentTitle}</h2>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(
                                                result.status
                                            )}`}
                                        >
                                            {result.status}
                                        </span>
                                    </div>

                                    <p className="text-sm text-muted-foreground">{result.subject}</p>

                                    <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2 xl:grid-cols-4">
                                        <div>
                                            <span className="font-medium text-foreground">Problems:</span>{" "}
                                            {result.totalProblems}
                                        </div>
                                        <div>
                                            <span className="font-medium text-foreground">Marks:</span>{" "}
                                            {result.obtainedMarks}/{result.totalMarks}
                                        </div>
                                        <div>
                                            <span className="font-medium text-foreground">Percentage:</span>{" "}
                                            {result.percentage}%
                                        </div>
                                        <div>
                                            <span className="font-medium text-foreground">Evaluated:</span>{" "}
                                            {result.evaluatedAt}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex min-w-[180px] flex-col items-start gap-3 xl:items-end">
                                    <div className="rounded-xl bg-muted px-4 py-2 text-sm font-semibold">
                                        Score: {result.obtainedMarks}/{result.totalMarks}
                                    </div>

                                    <button className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90">
                                        View Detailed Result
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="rounded-2xl border border-dashed bg-background p-10 text-center shadow-sm">
                        <h3 className="text-lg font-semibold">No results found</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Your evaluated assignment results will appear here.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}