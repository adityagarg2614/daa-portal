'use client'

import React from "react"
import { useUser } from "@clerk/nextjs"
import {
    BookOpen,
    ClipboardCheck,
    Trophy,
    Bell,
    CalendarCheck,
    Clock,
    ArrowRight,
} from "lucide-react"
import Link from "next/link"
import { StatsCard } from "@/components/ui/stats-card"
import { InfoCard } from "@/components/ui/info-card"
import { SectionHeader } from "@/components/ui/section-header"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export default function HomePage() {
    const { user } = useUser()

    const stats = [
        {
            title: "Total Assignments",
            value: "12",
            subtitle: "This semester",
            icon: BookOpen,
        },
        {
            title: "Pending Assignments",
            value: "3",
            subtitle: "Need submission",
            icon: Clock,
        },
        {
            title: "Completed",
            value: "8",
            subtitle: "Successfully submitted",
            icon: ClipboardCheck,
        },
        {
            title: "Average Score",
            value: "78%",
            subtitle: "Overall performance",
            icon: Trophy,
        },
    ]

    const upcomingAssignments = [
        {
            title: "DAA Lab Assignment 4",
            due: "Tomorrow, 11:59 PM",
            status: "Active",
        },
        {
            title: "Greedy Algorithms Practice",
            due: "25 Mar 2026, 10:00 AM",
            status: "Upcoming",
        },
        {
            title: "Dynamic Programming Sheet",
            due: "28 Mar 2026, 11:59 PM",
            status: "Upcoming",
        },
    ]

    const recentSubmissions = [
        {
            title: "DAA Lab Assignment 3",
            score: "18/20",
            submittedAt: "Submitted 2 days ago",
        },
        {
            title: "Searching & Sorting",
            score: "14/20",
            submittedAt: "Submitted 5 days ago",
        },
        {
            title: "Recursion Basics",
            score: "20/20",
            submittedAt: "Submitted 1 week ago",
        },
    ]

    const announcements = [
        "Assignment 4 has been published by the professor.",
        "Lab attendance feature will be available soon.",
        "Make sure to submit before the deadline to avoid zero marks.",
    ]

    const getStatusClasses = (status: string) => {
        switch (status) {
            case "Active":
                return "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
            case "Upcoming":
                return "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
            default:
                return "bg-muted text-muted-foreground"
        }
    }

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 pt-2">
            {/* Enhanced Header */}
            <SectionHeader
                title={`Welcome back, ${user?.firstName || "Student"} 👋`}
                description="Here is an overview of your assignments, submissions, and recent updates"
            />

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" role="region" aria-label="Statistics">
                {stats.map((item) => (
                    <StatsCard
                        key={item.title}
                        icon={item.icon}
                        title={item.title}
                        value={item.value}
                        subtitle={item.subtitle}
                    />
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-4 xl:grid-cols-3">
                {/* Upcoming Assignments */}
                <InfoCard
                    title="Upcoming Assignments"
                    icon={BookOpen}
                    className="xl:col-span-2"
                    action={
                        <Link
                            href="/assignment"
                            className="text-sm font-medium text-primary hover:underline"
                        >
                            View all →
                        </Link>
                    }
                >
                    <div className="space-y-3">
                        {upcomingAssignments.map((assignment, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between rounded-xl border p-4 transition-all hover:shadow-md"
                            >
                                <div>
                                    <h3 className="font-medium">{assignment.title}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Due: {assignment.due}
                                    </p>
                                </div>
                                <Badge
                                    variant={assignment.status === "Active" ? "secondary" : "outline"}
                                    className={cn(
                                        getStatusClasses(assignment.status)
                                    )}
                                >
                                    {assignment.status}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </InfoCard>

                {/* Attendance */}
                <InfoCard title="Attendance" icon={CalendarCheck}>
                    <div className="space-y-3">
                        <div className="rounded-xl border p-4">
                            <p className="text-sm text-muted-foreground">Current Attendance</p>
                            <h3 className="mt-2 text-3xl font-bold">82%</h3>
                        </div>
                        <div className="rounded-xl border p-4">
                            <p className="text-sm text-muted-foreground">Status</p>
                            <p className="mt-2 text-sm font-medium">
                                Feature coming soon for live tracking
                            </p>
                        </div>
                    </div>
                </InfoCard>
            </div>

            {/* Bottom Grid */}
            <div className="grid gap-4 xl:grid-cols-2">
                {/* Recent Results */}
                <InfoCard
                    title="Recent Results"
                    icon={Trophy}
                    action={
                        <Link
                            href="/results"
                            className="text-sm font-medium text-primary hover:underline"
                        >
                            View all →
                        </Link>
                    }
                >
                    <div className="space-y-3">
                        {recentSubmissions.map((submission, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between rounded-xl border p-4 transition-all hover:shadow-md"
                            >
                                <div>
                                    <h3 className="font-medium">{submission.title}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {submission.submittedAt}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold">{submission.score}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </InfoCard>

                {/* Announcements */}
                <InfoCard title="Announcements" icon={Bell}>
                    <div className="space-y-3">
                        {announcements.map((item, index) => (
                            <div
                                key={index}
                                className="rounded-xl border bg-muted/30 p-4 transition-all hover:shadow-sm"
                            >
                                <p className="text-sm">{item}</p>
                            </div>
                        ))}
                    </div>
                </InfoCard>
            </div>

            {/* Quick Actions */}
            <InfoCard title="Quick Actions">
                <div className="grid gap-4 md:grid-cols-3">
                    <Link
                        href="/assignment"
                        className="group flex items-start gap-3 rounded-xl border bg-background p-4 transition-all hover:shadow-md hover:border-primary/50"
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-110">
                            <BookOpen className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold">View Assignments</h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Browse all your assignments
                            </p>
                        </div>
                        <ArrowRight className="mt-1 h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                    </Link>

                    <Link
                        href="/submission"
                        className="group flex items-start gap-3 rounded-xl border bg-background p-4 transition-all hover:shadow-md hover:border-primary/50"
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-110">
                            <ClipboardCheck className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold">My Submissions</h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Track your submissions
                            </p>
                        </div>
                        <ArrowRight className="mt-1 h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                    </Link>

                    <Link
                        href="/results"
                        className="group flex items-start gap-3 rounded-xl border bg-background p-4 transition-all hover:shadow-md hover:border-primary/50"
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-110">
                            <Trophy className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold">View Results</h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Check your grades
                            </p>
                        </div>
                        <ArrowRight className="mt-1 h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                    </Link>
                </div>
            </InfoCard>
        </div>
    )
}
