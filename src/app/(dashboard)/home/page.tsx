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
} from "lucide-react"

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

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 pt-2">
            <div className="rounded-2xl border bg-background p-6 shadow-sm">
                <h1 className="text-2xl font-bold tracking-tight">
                    Welcome back, {user?.firstName || "Student"} 👋
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                    Here is an overview of your assignments, submissions, and recent updates.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {stats.map((item) => {
                    const Icon = item.icon
                    return (
                        <div
                            key={item.title}
                            className="rounded-2xl border bg-background p-5 shadow-sm"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">{item.title}</p>
                                    <h2 className="mt-2 text-2xl font-bold">{item.value}</h2>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {item.subtitle}
                                    </p>
                                </div>
                                <div className="rounded-xl bg-muted p-2">
                                    <Icon className="h-5 w-5" />
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
                <div className="xl:col-span-2 rounded-2xl border bg-background p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Upcoming Assignments</h2>
                        <span className="text-sm text-muted-foreground">View all</span>
                    </div>

                    <div className="space-y-3">
                        {upcomingAssignments.map((assignment, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between rounded-xl border p-4"
                            >
                                <div>
                                    <h3 className="font-medium">{assignment.title}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Due: {assignment.due}
                                    </p>
                                </div>
                                <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
                                    {assignment.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-2xl border bg-background p-5 shadow-sm">
                    <div className="mb-4 flex items-center gap-2">
                        <CalendarCheck className="h-5 w-5" />
                        <h2 className="text-lg font-semibold">Attendance</h2>
                    </div>

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
                </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
                <div className="rounded-2xl border bg-background p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Recent Results</h2>
                        <span className="text-sm text-muted-foreground">Latest submissions</span>
                    </div>

                    <div className="space-y-3">
                        {recentSubmissions.map((submission, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between rounded-xl border p-4"
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
                </div>

                <div className="rounded-2xl border bg-background p-5 shadow-sm">
                    <div className="mb-4 flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        <h2 className="text-lg font-semibold">Announcements</h2>
                    </div>

                    <div className="space-y-3">
                        {announcements.map((item, index) => (
                            <div key={index} className="rounded-xl border p-4">
                                <p className="text-sm">{item}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}