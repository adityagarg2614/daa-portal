'use client'

import React, { useEffect, useMemo, useState } from "react"
import axios from "axios"
import { BookOpen, Clock3, CheckCircle2, CalendarDays, Search } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
type AssignmentStatus = "Active" | "Upcoming" | "Completed" | "Expired"

type Assignment = {
    _id: string
    title: string
    description: string
    totalProblems: number
    totalMarks: number
    publishAt: string
    dueAt: string
    status: AssignmentStatus
    problems?: any[]
}

export default function AssignmentPage() {
    const [search, setSearch] = useState("")
    const [activeTab, setActiveTab] = useState<"All" | AssignmentStatus>("All")
    const [assignments, setAssignments] = useState<Assignment[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchAssignments = async () => {
            try {
                const res = await axios.get("/api/student/assignments")
                setAssignments(res.data.assignments || [])
            } catch (error) {
                console.error("Error fetching assignments:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchAssignments()
    }, [])

    const filteredAssignments = useMemo(() => {
        return assignments.filter((assignment) => {
            const matchesSearch =
                assignment.title.toLowerCase().includes(search.toLowerCase()) ||
                assignment.description.toLowerCase().includes(search.toLowerCase())

            const matchesTab = activeTab === "All" ? true : assignment.status === activeTab

            return matchesSearch && matchesTab
        })
    }, [assignments, search, activeTab])

    const tabs: Array<"All" | AssignmentStatus> = [
        "All",
        "Active",
        "Upcoming",
        "Completed",
        "Expired",
    ]

    const getStatusClasses = (status: AssignmentStatus) => {
        switch (status) {
            case "Active":
                return "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
            case "Upcoming":
                return "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
            case "Completed":
                return "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400"
            case "Expired":
                return "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"
            default:
                return "bg-muted text-muted-foreground"
        }
    }

    const canViewAssignment = (status: AssignmentStatus): boolean => {
        return status === "Active" || status === "Completed"
    }

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 pt-2">
            <div className="rounded-2xl border bg-background p-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Assignments</h1>
                        <p className="mt-2 text-sm text-muted-foreground">
                            View all your active, upcoming, completed, and expired assignments in one place.
                        </p>
                    </div>

                    <div className="relative w-full lg:w-80">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search assignments..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-11 w-full rounded-xl border bg-background pl-10 pr-4 text-sm outline-none ring-0 placeholder:text-muted-foreground focus:border-primary"
                        />
                    </div>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border bg-background p-5 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Total Assignments</p>
                            <h2 className="mt-2 text-2xl font-bold">{assignments.length}</h2>
                        </div>
                        <div className="rounded-xl bg-muted p-2">
                            <BookOpen className="h-5 w-5" />
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border bg-background p-5 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Active</p>
                            <h2 className="mt-2 text-2xl font-bold">
                                {assignments.filter((a) => a.status === "Active").length}
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
                            <p className="text-sm text-muted-foreground">Expired</p>
                            <h2 className="mt-2 text-2xl font-bold">
                                {assignments.filter((a) => a.status === "Expired").length}
                            </h2>
                        </div>
                        <div className="rounded-xl bg-muted p-2">
                            <CheckCircle2 className="h-5 w-5" />
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border bg-background p-5 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Upcoming</p>
                            <h2 className="mt-2 text-2xl font-bold">
                                {assignments.filter((a) => a.status === "Upcoming").length}
                            </h2>
                        </div>
                        <div className="rounded-xl bg-muted p-2">
                            <CalendarDays className="h-5 w-5" />
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
                    <p className="text-sm text-muted-foreground">Loading assignments...</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredAssignments.length > 0 ? (
                        filteredAssignments.map((assignment) => (
                            <div
                                key={assignment._id}
                                className="rounded-2xl border bg-background p-5 shadow-sm transition hover:shadow-md"
                            >
                                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                    <div className="space-y-3">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <h2 className="text-lg font-semibold">{assignment.title}</h2>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(
                                                    assignment.status
                                                )}`}
                                            >
                                                {assignment.status}
                                            </span>
                                        </div>

                                        <p className="text-sm text-muted-foreground">{assignment.description}</p>

                                        <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2 xl:grid-cols-4">
                                            <div>
                                                <span className="font-medium text-foreground">Problems:</span>{" "}
                                                {assignment.totalProblems}
                                            </div>
                                            <div>
                                                <span className="font-medium text-foreground">Total Marks:</span>{" "}
                                                {assignment.totalMarks}
                                            </div>
                                            <div>
                                                <span className="font-medium text-foreground">Published:</span>{" "}
                                                {new Date(assignment.publishAt).toLocaleString()}
                                            </div>
                                            <div>
                                                <span className="font-medium text-foreground">Due:</span>{" "}
                                                {new Date(assignment.dueAt).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex min-w-[180px] flex-col items-start gap-3 xl:items-end">
                                        <div className="rounded-xl bg-muted px-4 py-2 text-sm text-muted-foreground">
                                            {canViewAssignment(assignment.status) ? "Ready to attempt" : "Not available yet"}
                                        </div>

                                        {canViewAssignment(assignment.status) ? (
                                            <Link
                                                href={`/assignment/${assignment._id}`}
                                                className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                                            >
                                                View Assignment
                                            </Link>
                                        ) : (
                                            <button
                                                disabled
                                                className="rounded-xl bg-muted px-4 py-2 text-sm font-medium text-muted-foreground cursor-not-allowed opacity-50"
                                                title={assignment.status === "Upcoming" ? "Available after publish date" : "Assignment has expired"}
                                            >
                                                View Assignment
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="rounded-2xl border border-dashed bg-background p-10 text-center shadow-sm">
                            <h3 className="text-lg font-semibold">No assignments found</h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Try changing the search or filter to find assignments.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}