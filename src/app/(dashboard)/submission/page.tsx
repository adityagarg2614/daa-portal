'use client'

import React, { useEffect, useMemo, useState } from "react"
import axios from "axios"
import {
    FileCode2,
    CheckCircle2,
    Clock3,
    FileText,
} from "lucide-react"
import { SectionHeader } from "@/components/ui/section-header"
import { StatsCard } from "@/components/ui/stats-card"
import { SearchBar } from "@/components/ui/search-bar"
import { FilterTabs } from "@/components/ui/filter-tabs"
import { EmptyState } from "@/components/ui/empty-state"
import { SubmissionCard } from "@/components/ui/submission-card"
import {
    StatsCardSkeleton,
    SubmissionCardSkeleton,
    PageHeaderSkeleton,
} from "@/components/ui/skeleton"

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

            const matchesSearch =
                assignmentTitle.toLowerCase().includes(search.toLowerCase()) ||
                problemTitle.toLowerCase().includes(search.toLowerCase())

            const matchesTab = activeTab === "All" ? true : item.status === activeTab

            return matchesSearch && matchesTab
        })
    }, [search, activeTab, submissions])

    const getStatusIcon = (status: SubmissionStatus) => {
        switch (status) {
            case "Attempted":
                return Clock3
            case "Submitted":
                return FileCode2
            case "Evaluated":
                return CheckCircle2
            default:
                return FileText
        }
    }

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 pt-2">
            {/* Enhanced Header */}
            {loading ? (
                <PageHeaderSkeleton />
            ) : (
                <SectionHeader
                    title="My Submissions"
                    description="Track all your submitted and evaluated problem solutions here"
                    icon={FileCode2}
                />
            )}

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3" role="region" aria-label="Submission statistics">
                {loading ? (
                    <>
                        <StatsCardSkeleton />
                        <StatsCardSkeleton />
                        <StatsCardSkeleton />
                    </>
                ) : (
                    <>
                        <StatsCard
                            icon={FileText}
                            title="Total Records"
                            value={submissions.length}
                        />
                        <StatsCard
                            icon={Clock3}
                            title="Submitted"
                            value={submissions.filter((s) => s.status === "Submitted").length}
                        />
                        <StatsCard
                            icon={CheckCircle2}
                            title="Evaluated"
                            value={submissions.filter((s) => s.status === "Evaluated").length}
                        />
                    </>
                )}
            </div>

            {/* Search and Filters */}
            <div
                className="rounded-2xl border bg-background p-6 shadow-sm"
                role="search"
                aria-label="Submission search and filters"
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
                        placeholder="Search submissions..."
                        ariaLabel="Search submissions"
                    />
                </div>
            </div>

            {/* Submissions List */}
            {loading ? (
                <div className="grid gap-4" role="status" aria-label="Loading submissions">
                    <SubmissionCardSkeleton />
                    <SubmissionCardSkeleton />
                    <SubmissionCardSkeleton />
                </div>
            ) : (
                <div
                    className="grid gap-4"
                    role="list"
                    aria-label="Submissions list"
                    aria-live="polite"
                >
                    {filteredSubmissions.length > 0 ? (
                        filteredSubmissions.map((submission) => {
                            const StatusIcon = getStatusIcon(submission.status)

                            return (
                                <SubmissionCard
                                    key={submission._id}
                                    submission={submission}
                                    statusIcon={StatusIcon}
                                    actionLabel="View Details"
                                />
                            )
                        })
                    ) : (
                        <EmptyState
                            title="No submissions found"
                            description="Your submission records will appear here once you submit a problem."
                        />
                    )}
                </div>
            )}
        </div>
    )
}
