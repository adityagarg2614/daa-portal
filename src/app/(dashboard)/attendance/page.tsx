"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
    ArrowUpRight,
    BookOpen,
    CalendarCheck,
    CheckCircle2,
    Clock3,
    Info,
    Search,
    Sparkles,
    TrendingUp,
    XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Heatmap } from "@/components/attendance/Heatmap";
import { cn } from "@/lib/utils";

interface AttendanceSession {
    _id: string;
    title: string;
    date: string;
    type: "class" | "assignment";
    present: boolean;
}

interface Stats {
    totalClasses: number;
    attendedClasses: number;
    totalAssignments: number;
    attendedAssignments: number;
}

export default function StudentAttendancePage() {
    const [sessions, setSessions] = useState<AttendanceSession[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [heatmapData, setHeatmapData] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch("/api/student/attendance");
                const data = await res.json();

                if (data.success) {
                    setSessions(data.data.sessions);
                    setStats(data.data.stats);
                    setHeatmapData(data.data.heatmap);
                } else {
                    toast.error(data.message || "Failed to load attendance records");
                }
            } catch {
                toast.error("Failed to load attendance records");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const filteredSessions = useMemo(
        () =>
            sessions.filter((session) =>
                session.title.toLowerCase().includes(searchQuery.toLowerCase())
            ),
        [sessions, searchQuery]
    );

    const derivedStats = useMemo(() => {
        const classPercentage = stats?.totalClasses
            ? Math.round((stats.attendedClasses / stats.totalClasses) * 100)
            : 0;

        const assignmentPercentage = stats?.totalAssignments
            ? Math.round((stats.attendedAssignments / stats.totalAssignments) * 100)
            : 0;

        const totalTracked = (stats?.totalClasses || 0) + (stats?.totalAssignments || 0);
        const totalPresent =
            (stats?.attendedClasses || 0) + (stats?.attendedAssignments || 0);
        const totalAbsent = Math.max(0, totalTracked - totalPresent);
        const overallPercentage = totalTracked
            ? Math.round((totalPresent / totalTracked) * 100)
            : 0;

        const sortedByDate = [...sessions].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        const recentPresentRate = sortedByDate.length
            ? Math.round(
                (sortedByDate.slice(0, 5).filter((session) => session.present).length /
                    Math.min(sortedByDate.length, 5)) *
                100
            )
            : 0;

        const attendanceMood =
            overallPercentage >= 90
                ? "Excellent consistency"
                : overallPercentage >= 75
                    ? "Healthy attendance rhythm"
                    : "Needs a stronger attendance push";

        return {
            overallPercentage,
            classPercentage,
            assignmentPercentage,
            totalTracked,
            totalPresent,
            totalAbsent,
            recentPresentRate,
            attendanceMood,
        };
    }, [sessions, stats]);

    const progressTone =
        derivedStats.overallPercentage >= 90
            ? "bg-emerald-500"
            : derivedStats.overallPercentage >= 75
                ? "bg-amber-500"
                : "bg-rose-500";

    if (loading) {
        return (
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-8 pt-2 sm:px-6 xl:px-8">
                <Skeleton className="h-36 rounded-[28px]" />
                <div className="grid gap-4 lg:grid-cols-3">
                    {[1, 2, 3].map((item) => (
                        <Skeleton key={item} className="h-40 rounded-[24px]" />
                    ))}
                </div>
                <Skeleton className="h-[360px] rounded-[28px]" />
                <Skeleton className="h-[420px] rounded-[28px]" />
            </div>
        );
    }

    return (
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-8 pt-2 sm:px-6 xl:px-8">
            <section className="relative overflow-hidden rounded-[32px] border border-border/60 bg-linear-to-br from-card via-card to-emerald-500/8 shadow-[0_28px_80px_-40px_rgba(0,0,0,0.65)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.14),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.12),transparent_30%)]" />
                <div className="relative grid gap-8 px-5 py-6 sm:px-7 sm:py-7 xl:grid-cols-[1.35fr_0.95fr] xl:px-8">
                    <div className="space-y-6">
                        <div className="flex flex-wrap items-center gap-3">
                            <Badge className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-emerald-500 shadow-none">
                                <Sparkles className="mr-1 h-3.5 w-3.5" />
                                Attendance Intelligence
                            </Badge>
                            <Badge variant="outline" className="rounded-full px-3 py-1">
                                <Info className="mr-1 h-3.5 w-3.5" />
                                Updated from live records
                            </Badge>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                                    Attendance
                                </h1>
                                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                                    Track your class participation and assignment engagement through a clear yearly heatmap and actionable insights.
                                </p>
                            </div>

                            <div className="flex flex-wrap items-end gap-4">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                                        Overall Present
                                    </p>
                                    <div className="mt-2 flex items-end gap-3">
                                        <span
                                            className={cn(
                                                "text-6xl font-black leading-none tracking-[-0.06em]",
                                                derivedStats.overallPercentage >= 90 &&
                                                "text-emerald-500",
                                                derivedStats.overallPercentage >= 75 &&
                                                derivedStats.overallPercentage < 90 &&
                                                "text-amber-500",
                                                derivedStats.overallPercentage < 75 &&
                                                "text-rose-500"
                                            )}
                                        >
                                            {derivedStats.overallPercentage}%
                                        </span>
                                        <div className="mb-1 rounded-2xl border border-border/60 bg-background/70 px-3 py-2 text-sm text-muted-foreground backdrop-blur">
                                            {derivedStats.attendanceMood}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-medium text-foreground">
                                    Attendance progress
                                </span>
                                <span className="text-muted-foreground">
                                    {derivedStats.totalPresent} of {derivedStats.totalTracked} sessions
                                </span>
                            </div>
                            <Progress
                                value={derivedStats.overallPercentage}
                                className="h-3 rounded-full bg-background/80"
                                indicatorClassName={progressTone}
                            />
                            <div className="grid gap-3 sm:grid-cols-3">
                                <InsightChip
                                    label="Classes"
                                    value={`${stats?.attendedClasses || 0}/${stats?.totalClasses || 0}`}
                                    tone="blue"
                                />
                                <InsightChip
                                    label="Assignments"
                                    value={`${stats?.attendedAssignments || 0}/${stats?.totalAssignments || 0}`}
                                    tone="violet"
                                />
                                <InsightChip
                                    label="Recent form"
                                    value={`${derivedStats.recentPresentRate}%`}
                                    tone="emerald"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                        <StatPanel
                            icon={CalendarCheck}
                            label="Regular Classes"
                            value={`${stats?.attendedClasses || 0} / ${stats?.totalClasses || 0}`}
                            helper={`${derivedStats.classPercentage}% attendance`}
                            tone="blue"
                        />
                        <StatPanel
                            icon={BookOpen}
                            label="Assignment Engagement"
                            value={`${stats?.attendedAssignments || 0} / ${stats?.totalAssignments || 0}`}
                            helper={`${derivedStats.assignmentPercentage}% engagement`}
                            tone="violet"
                        />
                        <StatPanel
                            icon={TrendingUp}
                            label="Missed Sessions"
                            value={derivedStats.totalAbsent}
                            helper="A quick signal for recovery"
                            tone="rose"
                        />
                    </div>
                </div>
            </section>

            <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                <Card className="rounded-[28px] border border-border/60 bg-card/75 py-0 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.55)]">
                    <CardContent className="p-5 sm:p-6">
                        <div className="mb-5 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                                    Performance Snapshot
                                </p>
                                <h2 className="mt-1 text-xl font-semibold tracking-tight">
                                    How your attendance is split
                                </h2>
                            </div>
                            <Badge variant="outline" className="rounded-full px-3 py-1">
                                Balanced breakdown
                            </Badge>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <MetricCard
                                title="Class attendance"
                                subtitle="Daily academic presence in class sessions"
                                value={`${derivedStats.classPercentage}%`}
                                fraction={`${stats?.attendedClasses || 0}/${stats?.totalClasses || 0}`}
                                tone="blue"
                            />
                            <MetricCard
                                title="Assignment activity"
                                subtitle="How consistently you open and engage with assignments"
                                value={`${derivedStats.assignmentPercentage}%`}
                                fraction={`${stats?.attendedAssignments || 0}/${stats?.totalAssignments || 0}`}
                                tone="violet"
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-[28px] border border-border/60 bg-card/75 py-0 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.55)]">
                    <CardContent className="p-5 sm:p-6">
                        <div className="mb-5">
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                                Quick Reading
                            </p>
                            <h2 className="mt-1 text-xl font-semibold tracking-tight">
                                What this means right now
                            </h2>
                        </div>

                        <div className="space-y-3">
                            <InsightRow
                                icon={CheckCircle2}
                                label="Present sessions"
                                value={derivedStats.totalPresent}
                                tone="emerald"
                            />
                            <InsightRow
                                icon={XCircle}
                                label="Missed sessions"
                                value={derivedStats.totalAbsent}
                                tone="rose"
                            />
                            <InsightRow
                                icon={Clock3}
                                label="Tracked sessions"
                                value={derivedStats.totalTracked}
                                tone="slate"
                            />
                        </div>
                    </CardContent>
                </Card>
            </section>

            <section className="space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                            Year View
                        </p>
                        <h2 className="text-2xl font-semibold tracking-tight">
                            Attendance Heatmap
                        </h2>
                    </div>
                    <Badge variant="outline" className="w-fit rounded-full px-3 py-1">
                        <Info className="mr-1 h-3.5 w-3.5" />
                        Heatmap shows activity for {new Date().getFullYear()}
                    </Badge>
                </div>

                <Heatmap data={heatmapData} />
            </section>

            <section className="space-y-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                            Session Timeline
                        </p>
                        <h2 className="text-2xl font-semibold tracking-tight">
                            Attendance History
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Search your class or assignment sessions and check their status quickly.
                        </p>
                    </div>

                    <div className="relative w-full lg:w-80">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search by session title"
                            className="h-11 rounded-2xl border-border/60 bg-card/70 pl-10 shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <Card className="overflow-hidden rounded-[28px] border border-border/60 bg-card/75 py-0 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.55)]">
                    <CardContent className="p-0">
                        <div className="border-b border-border/60 px-5 py-4 sm:px-6">
                            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                <span>{filteredSessions.length} records shown</span>
                                <span className="text-border">•</span>
                                <span>{sessions.length} total records</span>
                            </div>
                        </div>

                        <Table>
                            <TableHeader>
                                <TableRow className="border-border/60 hover:bg-transparent">
                                    <TableHead className="pl-5 sm:pl-6">Date</TableHead>
                                    <TableHead>Session</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="text-right pr-5 sm:pr-6">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredSessions.length === 0 ? (
                                    <TableRow className="border-border/60">
                                        <TableCell
                                            colSpan={4}
                                            className="h-40 text-center text-muted-foreground"
                                        >
                                            No attendance records matched your search.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredSessions.map((session) => (
                                        <TableRow
                                            key={session._id}
                                            className="group border-border/60 transition-colors hover:bg-muted/30"
                                        >
                                            <TableCell className="pl-5 sm:pl-6">
                                                <div className="space-y-1">
                                                    <p className="font-medium tabular-nums text-foreground">
                                                        {format(new Date(session.date), "MMM d, yyyy")}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {format(new Date(session.date), "EEEE")}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={cn(
                                                            "flex h-10 w-10 items-center justify-center rounded-2xl border",
                                                            session.type === "class"
                                                                ? "border-sky-500/20 bg-sky-500/10 text-sky-500"
                                                                : "border-violet-500/20 bg-violet-500/10 text-violet-500"
                                                        )}
                                                    >
                                                        {session.type === "class" ? (
                                                            <CalendarCheck className="h-4 w-4" />
                                                        ) : (
                                                            <BookOpen className="h-4 w-4" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-foreground transition-colors group-hover:text-primary">
                                                            {session.title}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {session.present
                                                                ? "Marked as present"
                                                                : "Recorded as absent"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        "rounded-full px-3 py-1 capitalize",
                                                        session.type === "class" &&
                                                        "border-sky-500/20 bg-sky-500/10 text-sky-500",
                                                        session.type === "assignment" &&
                                                        "border-violet-500/20 bg-violet-500/10 text-violet-500"
                                                    )}
                                                >
                                                    {session.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="pr-5 text-right sm:pr-6">
                                                <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1.5 text-sm">
                                                    {session.present ? (
                                                        <>
                                                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                                            <span className="font-medium text-emerald-500">
                                                                Present
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <XCircle className="h-4 w-4 text-rose-500" />
                                                            <span className="font-medium text-rose-500">
                                                                Absent
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </section>
        </div>
    );
}

function StatPanel({
    icon: Icon,
    label,
    value,
    helper,
    tone,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string | number;
    helper: string;
    tone: "blue" | "violet" | "rose";
}) {
    const toneMap = {
        blue: "border-sky-500/20 bg-sky-500/10 text-sky-500",
        violet: "border-violet-500/20 bg-violet-500/10 text-violet-500",
        rose: "border-rose-500/20 bg-rose-500/10 text-rose-500",
    };

    return (
        <div className="rounded-[24px] border border-border/60 bg-background/70 p-4 backdrop-blur-sm">
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">{label}</p>
                    <p className="text-3xl font-semibold tracking-tight">{value}</p>
                    <p className="text-sm text-muted-foreground">{helper}</p>
                </div>
                <div
                    className={cn(
                        "flex h-11 w-11 items-center justify-center rounded-2xl border",
                        toneMap[tone]
                    )}
                >
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </div>
    );
}

function InsightChip({
    label,
    value,
    tone,
}: {
    label: string;
    value: string;
    tone: "blue" | "violet" | "emerald";
}) {
    const toneMap = {
        blue: "border-sky-500/20 bg-sky-500/10 text-sky-500",
        violet: "border-violet-500/20 bg-violet-500/10 text-violet-500",
        emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
    };

    return (
        <div className="rounded-2xl border border-border/60 bg-background/60 p-3 backdrop-blur-sm">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                {label}
            </p>
            <div className="mt-2 flex items-center justify-between">
                <span className="text-lg font-semibold tracking-tight">{value}</span>
                <span
                    className={cn(
                        "rounded-full border px-2 py-1 text-xs font-medium",
                        toneMap[tone]
                    )}
                >
                    Live
                </span>
            </div>
        </div>
    );
}

function MetricCard({
    title,
    subtitle,
    value,
    fraction,
    tone,
}: {
    title: string;
    subtitle: string;
    value: string;
    fraction: string;
    tone: "blue" | "violet";
}) {
    const toneMap = {
        blue: "from-sky-500/12 to-transparent text-sky-500",
        violet: "from-violet-500/12 to-transparent text-violet-500",
    };

    return (
        <div className="rounded-[24px] border border-border/60 bg-background/70 p-5 shadow-sm backdrop-blur-sm">
            <div className={cn("rounded-2xl bg-linear-to-br p-4", toneMap[tone])}>
                <p className="text-sm font-medium">{title}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{subtitle}</p>
                <div className="mt-5 flex items-end justify-between gap-4">
                    <div>
                        <p className="text-4xl font-black tracking-tighter text-foreground">
                            {value}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">{fraction} recorded</p>
                    </div>
                    <ArrowUpRight className="h-5 w-5 text-muted-foreground" />
                </div>
            </div>
        </div>
    );
}

function InsightRow({
    icon: Icon,
    label,
    value,
    tone,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string | number;
    tone: "emerald" | "rose" | "slate";
}) {
    const toneMap = {
        emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
        rose: "border-rose-500/20 bg-rose-500/10 text-rose-500",
        slate: "border-border/60 bg-background/70 text-foreground",
    };

    return (
        <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/70 p-4">
            <div className="flex items-center gap-3">
                <div
                    className={cn(
                        "flex h-11 w-11 items-center justify-center rounded-2xl border",
                        toneMap[tone]
                    )}
                >
                    <Icon className="h-5 w-5" />
                </div>
                <div>
                    <p className="font-medium text-foreground">{label}</p>
                    <p className="text-sm text-muted-foreground">Derived from your recorded history</p>
                </div>
            </div>
            <span className="text-2xl font-semibold tracking-tight">{value}</span>
        </div>
    );
}
