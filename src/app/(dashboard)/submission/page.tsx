'use client'

import React, { useEffect, useMemo, useState } from "react"
import axios from "axios"
import {
    FileCode2,
    CheckCircle2,
    Clock3,
    Search,
    FileText,
} from "lucide-react"

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

    const getStatusClasses = (status: SubmissionStatus) => {
        switch (status) {
            case "Attempted":
                return "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400"
            case "Submitted":
                return "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
            case "Evaluated":
                return "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
            default:
                return "bg-muted text-muted-foreground"
        }
    }

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 pt-2">
            <div className="rounded-2xl border bg-background p-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">My Submissions</h1>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Track all your submitted and evaluated problem solutions here.
                        </p>
                    </div>

                    <div className="relative w-full lg:w-80">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search submissions..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-11 w-full rounded-xl border bg-background pl-10 pr-4 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
                        />
                    </div>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border bg-background p-5 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Total Records</p>
                            <h2 className="mt-2 text-2xl font-bold">{submissions.length}</h2>
                        </div>
                        <div className="rounded-xl bg-muted p-2">
                            <FileText className="h-5 w-5" />
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border bg-background p-5 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Submitted</p>
                            <h2 className="mt-2 text-2xl font-bold">
                                {submissions.filter((s) => s.status === "Submitted").length}
                            </h2>
                        </div>
                        <div className="rounded-xl bg-muted p-2">
                            <Clock3 className="h-5 w-5" />
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border bg-background p-5 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Evaluated</p>
                            <h2 className="mt-2 text-2xl font-bold">
                                {submissions.filter((s) => s.status === "Evaluated").length}
                            </h2>
                        </div>
                        <div className="rounded-xl bg-muted p-2">
                            <CheckCircle2 className="h-5 w-5" />
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
                    <p className="text-sm text-muted-foreground">Loading submissions...</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredSubmissions.length > 0 ? (
                        filteredSubmissions.map((submission) => (
                            <div
                                key={submission._id}
                                className="rounded-2xl border bg-background p-5 shadow-sm transition hover:shadow-md"
                            >
                                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                    <div className="space-y-3">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <h2 className="text-lg font-semibold">
                                                {submission.assignmentId?.title}
                                            </h2>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(
                                                    submission.status
                                                )}`}
                                            >
                                                {submission.status}
                                            </span>
                                        </div>

                                        <p className="text-sm text-muted-foreground">
                                            Problem: {submission.problemId?.title}
                                        </p>

                                        <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2 xl:grid-cols-3">
                                            <div>
                                                <span className="font-medium text-foreground">Language:</span>{" "}
                                                {submission.language}
                                            </div>
                                            <div>
                                                <span className="font-medium text-foreground">Submitted At:</span>{" "}
                                                {submission.submittedAt
                                                    ? new Date(submission.submittedAt).toLocaleString()
                                                    : "N/A"}
                                            </div>
                                            <div>
                                                <span className="font-medium text-foreground">Due Date:</span>{" "}
                                                {submission.assignmentId?.dueAt
                                                    ? new Date(submission.assignmentId.dueAt).toLocaleString()
                                                    : "N/A"}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex min-w-[180px] flex-col items-start gap-3 xl:items-end">
                                        <div className="rounded-xl bg-muted px-4 py-2 text-sm font-semibold">
                                            Score: {submission.score ?? 0}
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
                            <h3 className="text-lg font-semibold">No submissions found</h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Your submission records will appear here once you submit a problem.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}