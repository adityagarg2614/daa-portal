'use client'

import React, { useMemo, useState } from "react"
import {
    Trophy,
    BarChart3,
    FileSpreadsheet,
    TrendingUp,
} from "lucide-react"
import { SectionHeader } from "@/components/ui/section-header"
import { StatsCard } from "@/components/ui/stats-card"
import { SearchBar } from "@/components/ui/search-bar"
import { FilterTabs } from "@/components/ui/filter-tabs"
import { EmptyState } from "@/components/ui/empty-state"
import { ResultCard } from "@/components/ui/result-card"

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

    const averagePercentage = Math.round(
        results.reduce((acc, curr) => acc + curr.percentage, 0) / results.length
    )

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 pt-2">
            {/* Enhanced Header */}
            <SectionHeader
                title="Results"
                description="View your evaluated assignment scores and overall performance"
                icon={Trophy}
            />

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" role="region" aria-label="Result statistics">
                <StatsCard
                    icon={FileSpreadsheet}
                    title="Total Results"
                    value={results.length}
                />
                <StatsCard
                    icon={BarChart3}
                    title="Average Score"
                    value={`${averagePercentage}%`}
                />
                <StatsCard
                    icon={Trophy}
                    title="Excellent Results"
                    value={results.filter((r) => r.status === "Excellent").length}
                />
                <StatsCard
                    icon={TrendingUp}
                    title="Improvement Needed"
                    value={results.filter((r) => r.status === "Needs Improvement").length}
                />
            </div>

            {/* Search and Filters */}
            <div
                className="rounded-2xl border bg-background p-6 shadow-sm"
                role="search"
                aria-label="Result search and filters"
            >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <FilterTabs
                        tabs={tabs}
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                    />
                    <SearchBar
                        value={search}
                        onChange={setSearch}
                        placeholder="Search results..."
                        ariaLabel="Search results"
                    />
                </div>
            </div>

            {/* Results List */}
            <div
                className="grid gap-4"
                role="list"
                aria-label="Results list"
                aria-live="polite"
            >
                {filteredResults.length > 0 ? (
                    filteredResults.map((result) => (
                        <ResultCard
                            key={result.id}
                            result={result}
                            actionLabel="View Detailed Result"
                        />
                    ))
                ) : (
                    <EmptyState
                        title="No results found"
                        description="Your evaluated assignment results will appear here."
                    />
                )}
            </div>
        </div>
    )
}
