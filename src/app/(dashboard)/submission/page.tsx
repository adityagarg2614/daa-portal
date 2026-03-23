'use client'

import React, { useMemo, useState } from "react"
import {
    FileCode2,
    CheckCircle2,
    Clock3,
    Search,
    FileText,
} from "lucide-react"

type SubmissionStatus = "Not Attempted" | "Attempted" | "Submitted" | "Evaluated"

type Submission = {
    id: number
    assignmentTitle: string
    subject: string
    problems: number
    status: SubmissionStatus
    score?: string
    submittedAt?: string
    dueAt: string
}

export default function SubmissionPage() {
    const [search, setSearch] = useState("")
    const [activeTab, setActiveTab] = useState<"All" | SubmissionStatus>("All")

    const submissions: Submission[] = [
        {
            id: 1,
            assignmentTitle: "DAA Lab Assignment 1",
            subject: "Design and Analysis of Algorithms",
            problems: 5,
            status: "Evaluated",
            score: "18/20",
            submittedAt: "18 Mar 2026, 10:30 AM",
            dueAt: "18 Mar 2026, 11:59 PM",
        },
        {
            id: 2,
            assignmentTitle: "Searching and Sorting",
            subject: "Design and Analysis of Algorithms",
            problems: 4,
            status: "Submitted",
            submittedAt: "20 Mar 2026, 09:45 AM",
            dueAt: "20 Mar 2026, 11:59 PM",
        },
        {
            id: 3,
            assignmentTitle: "Greedy Algorithms Practice",
            subject: "Design and Analysis of Algorithms",
            problems: 5,
            status: "Attempted",
            dueAt: "25 Mar 2026, 11:59 PM",
        },
        {
            id: 4,
            assignmentTitle: "Dynamic Programming Basics",
            subject: "Design and Analysis of Algorithms",
            problems: 6,
            status: "Not Attempted",
            dueAt: "28 Mar 2026, 11:59 PM",
        },
    ]

    const tabs: Array<"All" | SubmissionStatus> = [
        "All",
        "Not Attempted",
        "Attempted",
        "Submitted",
        "Evaluated",
    ]

    const filteredSubmissions = useMemo(() => {
        return submissions.filter((item) => {
            const matchesSearch =
                item.assignmentTitle.toLowerCase().includes(search.toLowerCase()) ||
                item.subject.toLowerCase().includes(search.toLowerCase())

            const matchesTab = activeTab === "All" ? true : item.status === activeTab

            return matchesSearch && matchesTab
        })
    }, [search, activeTab, submissions])

    const getStatusClasses = (status: SubmissionStatus) => {
        switch (status) {
            case "Not Attempted":
                return "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"
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
                            Track all your attempted, submitted, and evaluated assignments here.
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

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
                            <p className="text-sm text-muted-foreground">Attempted</p>
                            <h2 className="mt-2 text-2xl font-bold">
                                {submissions.filter((s) => s.status === "Attempted").length}
                            </h2>
                        </div>
                        <div className="rounded-xl bg-muted p-2">
                            <FileCode2 className="h-5 w-5" />
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

            <div className="grid gap-4">
                {filteredSubmissions.length > 0 ? (
                    filteredSubmissions.map((submission) => (
                        <div
                            key={submission.id}
                            className="rounded-2xl border bg-background p-5 shadow-sm transition hover:shadow-md"
                        >
                            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                <div className="space-y-3">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <h2 className="text-lg font-semibold">{submission.assignmentTitle}</h2>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(
                                                submission.status
                                            )}`}
                                        >
                                            {submission.status}
                                        </span>
                                    </div>

                                    <p className="text-sm text-muted-foreground">{submission.subject}</p>

                                    <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2 xl:grid-cols-3">
                                        <div>
                                            <span className="font-medium text-foreground">Problems:</span>{" "}
                                            {submission.problems}
                                        </div>
                                        <div>
                                            <span className="font-medium text-foreground">Due Date:</span>{" "}
                                            {submission.dueAt}
                                        </div>
                                        <div>
                                            <span className="font-medium text-foreground">Submitted At:</span>{" "}
                                            {submission.submittedAt || "Not submitted yet"}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex min-w-[180px] flex-col items-start gap-3 xl:items-end">
                                    {submission.score ? (
                                        <div className="rounded-xl bg-muted px-4 py-2 text-sm font-semibold">
                                            Score: {submission.score}
                                        </div>
                                    ) : (
                                        <div className="rounded-xl bg-muted px-4 py-2 text-sm text-muted-foreground">
                                            No score available
                                        </div>
                                    )}

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
                            Your submission records will appear here once you start attempting assignments.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}