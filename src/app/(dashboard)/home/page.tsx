'use client'

import React, { useState, useEffect, useCallback } from "react"
import { useRefetchOnFocus } from "@/hooks/use-refetch-on-focus"
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
import { toast } from "sonner"
import { format } from "date-fns"

export default function HomePage() {
    const { user } = useUser()
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    const fetchDashboardData = useCallback(async () => {
        try {
            const response = await fetch("/api/student/dashboard");
            const resData = await response.json();
            if (resData.success) {
                setData(resData.data);
            }
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            toast.error("Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    useRefetchOnFocus(fetchDashboardData);

    const stats = data ? [
        {
            title: "Total Assignments",
            value: data.stats.totalAssignments.toString(),
            subtitle: "In the portal",
            icon: BookOpen,
        },
        {
            title: "Pending Assignments",
            value: data.stats.pendingAssignments.toString(),
            subtitle: "To be completed",
            icon: Clock,
        },
        {
            title: "Completed",
            value: data.stats.completedAssignments.toString(),
            subtitle: "Solved by you",
            icon: ClipboardCheck,
        },
        {
            title: "Average Score",
            value: data.stats.averageScore,
            subtitle: "Performance",
            icon: Trophy,
        },
    ] : []

    const upcomingAssignments = data?.upcomingAssignments || []
    const recentSubmissions = data?.recentResults || []

    const formatDueDate = (dateString: string) => {
        const date = new Date(dateString);
        return format(date, "MMM d, yyyy h:mm a");
    }

    const formatRelativeTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 3600 * 24));
        
        if (diffInDays === 0) return "Today";
        if (diffInDays === 1) return "Yesterday";
        return `${diffInDays} days ago`;
    }

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
                {loading ? (
                    [...Array(4)].map((_, i) => (
                        <div key={i} className="h-32 rounded-2xl bg-muted animate-pulse" />
                    ))
                ) : (
                    stats.map((item) => (
                        <StatsCard
                            key={item.title}
                            icon={item.icon}
                            title={item.title}
                            value={item.value}
                            subtitle={item.subtitle}
                        />
                    ))
                )}
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
                        {loading ? (
                            [...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)
                        ) : upcomingAssignments.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">No upcoming assignments</div>
                        ) : (
                            upcomingAssignments.map((assignment: any, index: number) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between rounded-xl border p-4 transition-all hover:shadow-md"
                                >
                                    <div>
                                        <h3 className="font-medium">{assignment.title}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Due: {formatDueDate(assignment.due)}
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
                            ))
                        )}
                    </div>
                </InfoCard>

                {/* Attendance */}
                <InfoCard title="Attendance" icon={CalendarCheck}>
                    <div className="space-y-3">
                        {loading ? (
                            <div className="h-40 rounded-xl bg-muted animate-pulse" />
                        ) : (
                            <>
                                <Link href="/attendance" className="block group">
                                    <div className="rounded-xl border p-4 transition-all group-hover:border-primary/50 group-hover:shadow-sm">
                                        <div className="flex justify-between items-start">
                                            <p className="text-sm text-muted-foreground">Current Attendance</p>
                                            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-1" />
                                        </div>
                                        <h3 className={cn("mt-2 text-3xl font-bold", 
                                            (data?.attendance?.percentage || 0) >= 75 ? "text-primary" : "text-red-500"
                                        )}>
                                            {data?.attendance?.percentage || 0}%
                                        </h3>
                                    </div>
                                </Link>
                                <div className="rounded-xl border p-4 bg-muted/30">
                                    <p className="text-sm text-muted-foreground">Summary</p>
                                    <p className="mt-2 text-xs font-medium">
                                        {(data?.attendance?.percentage || 0) >= 75 
                                            ? "Your attendance is well maintained." 
                                            : "Your attendance is below 75%. Please attend more sessions."}
                                    </p>
                                </div>
                            </>
                        )}
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
                        {loading ? (
                            [...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)
                        ) : recentSubmissions.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">No submissions yet</div>
                        ) : (
                            recentSubmissions.map((submission: any, index: number) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between rounded-xl border p-4 transition-all hover:shadow-md"
                                >
                                    <div>
                                        <h3 className="font-medium">{submission.title}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Submitted {formatRelativeTime(submission.submittedAt)}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-primary">{submission.score}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </InfoCard>

                {/* Announcements */}
                <InfoCard
                    title="Announcements"
                    icon={Bell}
                    action={
                        <Link
                            href="/announcements"
                            className="text-sm font-medium text-primary hover:underline"
                        >
                            View all →
                        </Link>
                    }
                >
                    <AnnouncementsList />
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

// Announcements List Component
function AnnouncementsList() {
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAnnouncements = useCallback(async () => {
        try {
            const response = await fetch("/api/student/announcements?limit=3");
            const data = await response.json();

            if (data.success) {
                setAnnouncements(data.data);
            }
        } catch (error) {
            console.error("Error fetching announcements:", error);
            toast.error("Failed to fetch announcements");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAnnouncements();
    }, [fetchAnnouncements]);

    // Refetch when navigating back via browser back button or window focus
    useRefetchOnFocus(fetchAnnouncements);

    if (loading) {
        return (
            <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                    <div
                        key={i}
                        className="h-16 rounded-xl bg-muted animate-pulse"
                    />
                ))}
            </div>
        );
    }

    if (announcements.length === 0) {
        return (
            <div className="text-center py-8">
                <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No announcements yet</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {announcements.map((item) => (
                <div
                    key={item._id}
                    className="rounded-xl border bg-muted/30 p-4 transition-all hover:shadow-sm"
                >
                    <p className="text-sm">{item.content}</p>
                </div>
            ))}
        </div>
    );
}
