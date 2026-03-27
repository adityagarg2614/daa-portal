'use client'

import React, { useEffect, useMemo, useState } from "react"
import axios from "axios"
import { BookOpen, Clock3, CheckCircle2, CalendarDays } from "lucide-react"
import { SectionHeader } from "@/components/ui/section-header"
import { StatsCard } from "@/components/ui/stats-card"
import { SearchBar } from "@/components/ui/search-bar"
import { FilterTabs } from "@/components/ui/filter-tabs"
import { EmptyState } from "@/components/ui/empty-state"
import { AssignmentCard } from "@/components/ui/assignment-card"

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
    problems?: unknown[]
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

    const canViewAssignment = (status: AssignmentStatus): boolean => {
        return status === "Active" || status === "Completed"
    }

    const getStatusIcon = (status: AssignmentStatus) => {
        switch (status) {
            case "Active":
                return Clock3
            case "Upcoming":
                return CalendarDays
            case "Completed":
                return CheckCircle2
            case "Expired":
                return CheckCircle2
            default:
                return BookOpen
        }
    }

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 pt-2">
            {/* Enhanced Header */}
            <SectionHeader
                title="Assignments"
                description="View all your active, upcoming, completed, and expired assignments in one place"
                icon={BookOpen}
            />

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" role="region" aria-label="Assignment statistics">
                <StatsCard
                    icon={BookOpen}
                    title="Total Assignments"
                    value={assignments.length}
                />
                <StatsCard
                    icon={Clock3}
                    title="Active"
                    value={assignments.filter((a) => a.status === "Active").length}
                />
                <StatsCard
                    icon={CheckCircle2}
                    title="Completed"
                    value={assignments.filter((a) => a.status === "Completed").length}
                />
                <StatsCard
                    icon={CalendarDays}
                    title="Upcoming"
                    value={assignments.filter((a) => a.status === "Upcoming").length}
                />
            </div>

            {/* Search and Filters */}
            <div
                className="rounded-2xl border bg-background p-6 shadow-sm"
                role="search"
                aria-label="Assignment search and filters"
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
                        placeholder="Search assignments..."
                        ariaLabel="Search assignments"
                    />
                </div>
            </div>

            {/* Assignments List */}
            {loading ? (
                <div className="rounded-2xl border bg-background p-10 text-center shadow-sm" role="status" aria-label="Loading assignments">
                    <p className="text-sm text-muted-foreground">Loading assignments...</p>
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
                            const StatusIcon = getStatusIcon(assignment.status)
                            const canView = canViewAssignment(assignment.status)

                            return (
                                <AssignmentCard
                                    key={assignment._id}
                                    assignment={assignment}
                                    statusIcon={StatusIcon}
                                    actionLabel="View Assignment"
                                    actionDisabled={!canView}
                                    onAction={canView ? () => window.location.href = `/assignment/${assignment._id}` : undefined}
                                />
                            )
                        })
                    ) : (
                        <EmptyState
                            title="No assignments found"
                            description="Try changing the search or filter to find assignments."
                        />
                    )}
                </div>
            )}
        </div>
    )
}
