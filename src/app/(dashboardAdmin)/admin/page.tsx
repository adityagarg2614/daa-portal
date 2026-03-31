'use client'

import React, { useEffect, useState, useCallback } from "react"
import { useRefetchOnFocus } from "@/hooks/use-refetch-on-focus"
import {
    FileText,
    Library,
    ArrowRight,
    BookOpen,
    Code2,
    Sparkles,
    Clock,
    CheckCircle2,
} from "lucide-react"
import { SectionHeader } from "@/components/ui/section-header"
import { DashboardStatCard } from "@/components/ui/dashboard-stat-card"
import { GuideSection } from "@/components/ui/guide-section"
import {
    DashboardStatsSkeleton,
    QuickActionsSkeleton,
    GuideSectionSkeleton,
} from "@/components/ui/dashboard-skeletons"

interface DashboardStats {
    totalProblems: number
    totalAssignments: number
    totalSubmissions: number
    activeAssignments: number
}

export default function AdminDashboardHomePage() {
    const [stats, setStats] = useState<DashboardStats>({
        totalProblems: 0,
        totalAssignments: 0,
        totalSubmissions: 0,
        activeAssignments: 0,
    })
    const [loading, setLoading] = useState(true)

    const fetchDashboardData = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/dashboard");
            const data = await res.json();
            if (data.success) {
                setStats(data.stats)
            }
        } catch (error) {
            console.error("Failed to fetch dashboard data:", error)
        } finally {
            setLoading(false)
        }
    }, [])

    // Initial fetch on mount
    useEffect(() => {
        fetchDashboardData()
    }, [fetchDashboardData])

    // Refetch when navigating back via browser back button or window focus
    useRefetchOnFocus(fetchDashboardData)

    const quickActions = [
        {
            title: "Create Assignment",
            description: "Build a new assignment with problems",
            icon: FileText,
            href: "/admin/assignments/create",
        },
        {
            title: "Create Problem",
            description: "Add a new problem to the bank",
            icon: Code2,
            href: "/admin/problems/create",
        },
        {
            title: "View Assignments",
            description: "Manage all assignments",
            icon: Library,
            href: "/admin/assignments",
        },
        {
            title: "Problem Bank",
            description: "Browse all problems",
            icon: BookOpen,
            href: "/admin/problems",
        },
    ]

    const gettingStartedSteps = [
        {
            stepNumber: 1,
            title: "Create Problems",
            description:
                "Start by adding problems to your problem bank with detailed descriptions, test cases, and starter code.",
        },
        {
            stepNumber: 2,
            title: "Create Assignments",
            description:
                "Build assignments by selecting problems from your problem bank and setting deadlines.",
        },
        {
            stepNumber: 3,
            title: "Manage Submissions",
            description:
                "Monitor student submissions and track progress through the dashboard.",
        },
    ]

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 pt-2">
            {/* Enhanced Header */}
            {loading ? (
                <SectionHeader title="" description="" />
            ) : (
                <SectionHeader
                    title="Admin Dashboard"
                    description="Manage assignments and problems for your courses"
                    icon={Sparkles}
                />
            )}

            {/* Quick Actions */}
            {loading ? (
                <QuickActionsSkeleton />
            ) : (
                <div
                    className="rounded-2xl border bg-background p-6 shadow-sm"
                    role="region"
                    aria-labelledby="quick-actions-heading"
                >
                    <h2 id="quick-actions-heading" className="mb-4 text-lg font-semibold">
                        Quick Actions
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {quickActions.map((action, index) => {
                            const Icon = action.icon
                            return (
                                <a
                                    key={index}
                                    href={action.href}
                                    className="group relative overflow-hidden rounded-xl border bg-background p-5 transition-all duration-300 hover:shadow-md hover:border-primary/50"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-110">
                                            <Icon className="h-5 w-5 icon-hover-scale" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold">{action.title}</h3>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {action.description}
                                            </p>
                                        </div>
                                        <ArrowRight className="mt-1 h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                                    </div>
                                </a>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Stats Overview */}
            {loading ? (
                <DashboardStatsSkeleton />
            ) : (
                <div
                    className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
                    role="region"
                    aria-label="Dashboard statistics"
                >
                    <DashboardStatCard
                        icon={FileText}
                        title="Total Assignments"
                        value={stats.totalAssignments}
                        description="All created assignments"
                    />
                    <DashboardStatCard
                        icon={Library}
                        title="Total Problems"
                        value={stats.totalProblems}
                        description="In problem bank"
                    />
                    <DashboardStatCard
                        icon={Clock}
                        title="Active Assignments"
                        value={stats.activeAssignments}
                        description="Currently active"
                    />
                    <DashboardStatCard
                        icon={CheckCircle2}
                        title="Total Submissions"
                        value={stats.totalSubmissions}
                        description="All student submissions"
                    />
                </div>
            )}

            {/* Getting Started Guide */}
            {loading ? (
                <GuideSectionSkeleton />
            ) : (
                <GuideSection
                    title="Getting Started"
                    steps={gettingStartedSteps}
                />
            )}
        </div>
    )
}
