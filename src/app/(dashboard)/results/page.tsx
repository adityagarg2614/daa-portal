'use client'

import React, { useMemo, useState, useEffect } from "react"
import axios from "axios"
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
import {
    StatsCardSkeleton,
    ResultCardSkeleton,
    PageHeaderSkeleton,
} from "@/components/ui/skeleton"

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

    const averagePercentage = results.length > 0
        ? Math.round(
            results.reduce((acc, curr) => acc + curr.percentage, 0) / results.length
        )
        : 0

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 pt-2">
            {/* Enhanced Header */}
            {loading ? (
                <PageHeaderSkeleton />
            ) : (
                <SectionHeader
                    title="Results"
                    description="View your evaluated assignment scores and overall performance"
                    icon={Trophy}
                />
            )}

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" role="region" aria-label="Result statistics">
                {loading ? (
                    <>
                        <StatsCardSkeleton />
                        <StatsCardSkeleton />
                        <StatsCardSkeleton />
                        <StatsCardSkeleton />
                    </>
                ) : (
                    <>
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
                    </>
                )}
            </div>

            {/* Search and Filters */}
            <div
                className="rounded-2xl border bg-card p-6 shadow-sm"
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
            {loading ? (
                <div className="grid gap-4" role="status" aria-label="Loading results">
                    <ResultCardSkeleton />
                    <ResultCardSkeleton />
                    <ResultCardSkeleton />
                    <ResultCardSkeleton />
                </div>
            ) : filteredResults.length > 0 ? (
                <div className="grid gap-4" role="list" aria-label="Results list" aria-live="polite">
                    {filteredResults.map((result) => (
                        <ResultCard
                            key={result.id}
                            result={result}
                            actionLabel="View Detailed Result"
                        />
                    ))}
                </div>
            ) : (
                <EmptyState
                    title="No results found"
                    description="Your evaluated assignment results will appear here."
                />
            )}
        </div>
    )
}
