'use client'

import axios from "axios"
import Link from "next/link"
import React, { useEffect, useMemo, useState } from "react"
import {
    BookOpen,
    CalendarDays,
    Clock3,
    FileText,
    Search,
    X,
    Plus,
    Award,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    StatsCardSkeleton,
    AssignmentCardSkeleton,
    PageHeaderSkeleton,
} from "@/components/ui/skeleton"
import { StatsCard } from "@/components/ui/stats-card"

type Assignment = {
    _id: string
    title: string
    description: string
    totalProblems: number
    totalMarks: number
    publishAt: string
    dueAt: string
    problemIds?: {
        _id: string
        title: string
    }[]
}

type AssignmentStatus = "Upcoming" | "Active" | "Expired"

export default function AdminAssignmentsPage() {
    const [assignments, setAssignments] = useState<Assignment[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [activeTab, setActiveTab] = useState<"All" | AssignmentStatus>("All")

    useEffect(() => {
        const fetchAssignments = async () => {
            try {
                const res = await axios.get("/api/admin/assignments")
                setAssignments(res.data.assignments || [])
            } catch (error) {
                console.error("Error fetching assignments:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchAssignments()
    }, [])

    const getComputedStatus = (assignment: Assignment): AssignmentStatus => {
        const now = new Date()
        const publishAt = new Date(assignment.publishAt)
        const dueAt = new Date(assignment.dueAt)

        if (now < publishAt) return "Upcoming"
        if (now > dueAt) return "Expired"
        return "Active"
    }

    const filteredAssignments = useMemo(() => {
        return assignments.filter((assignment) => {
            const status = getComputedStatus(assignment)

            const matchesSearch =
                assignment.title.toLowerCase().includes(search.toLowerCase()) ||
                assignment.description.toLowerCase().includes(search.toLowerCase())

            const matchesTab = activeTab === "All" ? true : status === activeTab

            return matchesSearch && matchesTab
        })
    }, [assignments, search, activeTab])

    const tabs: Array<"All" | AssignmentStatus> = [
        "All",
        "Upcoming",
        "Active",
        "Expired",
    ]

    const getStatusIcon = (status: AssignmentStatus) => {
        switch (status) {
            case "Active":
                return Clock3
            case "Upcoming":
                return CalendarDays
            case "Expired":
                return AlertCircle
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
                                <FileText className="h-6 w-6 icon-bounce" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight" id="page-heading">
                                    Assignments
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    View and manage all created assignments
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
            )}

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" role="region" aria-label="Assignment statistics">
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
                            icon={FileText}
                            title="Total Assignments"
                            value={assignments.length}
                        />
                        <StatsCard
                            icon={CalendarDays}
                            title="Upcoming"
                            value={assignments.filter((a) => getComputedStatus(a) === "Upcoming").length}
                        />
                        <StatsCard
                            icon={Clock3}
                            title="Active"
                            value={assignments.filter((a) => getComputedStatus(a) === "Active").length}
                        />
                        <StatsCard
                            icon={BookOpen}
                            title="Expired"
                            value={assignments.filter((a) => getComputedStatus(a) === "Expired").length}
                        />
                    </>
                )}
            </div>

            {/* Search and Actions Bar */}
            <div
                className="rounded-2xl border bg-background p-6 shadow-sm"
                role="search"
                aria-label="Assignment search and filters"
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
                                placeholder="Search assignments..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="h-11 w-full rounded-xl border bg-background pl-10 pr-10 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 transition-all"
                                aria-label="Search assignments"
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
                            href="/admin/assignments/create"
                            className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 hover:shadow-md"
                        >
                            <Plus className="mr-2 h-4 w-4 icon-hover-scale" />
                            Create Assignment
                        </Link>
                    </div>
                </div>
            </div>

            {/* Assignments List */}
            {loading ? (
                <div className="grid gap-4" role="status" aria-label="Loading assignments">
                    <AssignmentCardSkeleton />
                    <AssignmentCardSkeleton />
                    <AssignmentCardSkeleton />
                </div>
            ) : (
                <div
                    className="grid gap-4"
                    role="list"
                    aria-label="Assignments list"
                    aria-live="polite"
                >
                    {filteredAssignments.length > 0 ? (
                        filteredAssignments.map((assignment) => {
                            const status = getComputedStatus(assignment)
                            const StatusIcon = getStatusIcon(status)

                            return (
                                <div
                                    key={assignment._id}
                                    role="listitem"
                                    className="group relative overflow-hidden rounded-2xl border bg-background p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/50"
                                >
                                    {/* Status indicator bar */}
                                    <div
                                        className={cn(
                                            "absolute -left-1 top-0 bottom-0 w-1",
                                            status === "Active" && "bg-green-500",
                                            status === "Upcoming" && "bg-blue-500",
                                            status === "Expired" && "bg-red-500"
                                        )}
                                        aria-hidden="true"
                                    />

                                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                        <div className="space-y-3 flex-1">
                                            <div className="flex flex-wrap items-center gap-3">
                                                <h2 className="text-lg font-semibold">{assignment.title}</h2>
                                                <Badge
                                                    variant={
                                                        status === "Active"
                                                            ? "secondary"
                                                            : status === "Upcoming"
                                                                ? "default"
                                                                : "destructive"
                                                    }
                                                    className="gap-1"
                                                >
                                                    <StatusIcon className="h-3 w-3" />
                                                    {status}
                                                </Badge>
                                                <Badge variant="outline" className="gap-1">
                                                    <Award className="h-3 w-3" />
                                                    {assignment.totalMarks} Marks
                                                </Badge>
                                            </div>

                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                                {assignment.description}
                                            </p>

                                            <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2 xl:grid-cols-4">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="h-4 w-4" />
                                                    <span className="font-medium text-foreground">Problems:</span>{" "}
                                                    {assignment.totalProblems}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <CalendarDays className="h-4 w-4" />
                                                    <span className="font-medium text-foreground">Publish:</span>{" "}
                                                    {new Date(assignment.publishAt).toLocaleString()}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Clock3 className="h-4 w-4" />
                                                    <span className="font-medium text-foreground">Due:</span>{" "}
                                                    {new Date(assignment.dueAt).toLocaleString()}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle2 className="h-4 w-4" />
                                                    <span className="font-medium text-foreground">Selected:</span>{" "}
                                                    {assignment.problemIds?.length || assignment.totalProblems}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex min-w-[180px] flex-col items-start gap-3 xl:items-end">
                                            <div className="rounded-xl bg-muted px-4 py-2 text-sm text-muted-foreground">
                                                Ready to manage
                                            </div>

                                            <Link
                                                href={`/admin/assignments/${assignment._id}`}
                                                className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 hover:shadow-md gap-2"
                                            >
                                                View Details
                                                <ArrowRight className="h-4 w-4 icon-hover-scale" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    ) : (
                        <div
                            className="rounded-2xl border border-dashed bg-background p-10 text-center shadow-sm"
                            role="status"
                            aria-label="No assignments found"
                        >
                            <Search className="mx-auto mb-3 h-12 w-12 opacity-50" />
                            <h3 className="text-lg font-semibold">No assignments found</h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Create a new assignment or change the search/filter.
                            </p>
                            <Link
                                href="/admin/assignments/create"
                                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                            >
                                <Plus className="h-4 w-4" />
                                Create Assignment
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
