"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    BarChart3,
    Calendar,
    CalendarCheck,
    Edit,
    MoreVertical,
    Plus,
    Search,
    ShieldAlert,
    Sparkles,
    Trash2,
    TrendingUp,
    Users,
    XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { AttendanceForm } from "@/components/admin/attendance-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface Session {
    _id: string;
    type: "class" | "assignment";
    title: string;
    date: string;
    records: { userId: string; present: boolean }[];
    createdBy: { name: string; email: string };
}

interface StudentSummary {
    userId: string;
    name: string;
    email: string;
    rollNo: string;
    attendedClasses: number;
    totalClasses: number;
    attendedAssignments: number;
    totalAssignments: number;
    totalAttended: number;
    totalSessions: number;
    percentage: number;
}

export default function AttendancePage() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [summaries, setSummaries] = useState<StudentSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("sessions");
    const [searchQuery, setSearchQuery] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingSession, setEditingSession] = useState<Session | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            if (activeTab === "sessions") {
                const res = await fetch("/api/admin/attendance");
                const data = await res.json();
                if (data.success) {
                    setSessions(data.data.sessions);
                } else {
                    toast.error(data.message || "Failed to load sessions");
                }
            } else {
                const res = await fetch("/api/admin/attendance/summary");
                const data = await res.json();
                if (data.success) {
                    setSummaries(data.data);
                } else {
                    toast.error(data.message || "Failed to load student summary");
                }
            }
        } catch (error) {
            console.error("Error fetching attendance data:", error);
            toast.error("Failed to load attendance data");
        } finally {
            setLoading(false);
        }
    }, [activeTab]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            void fetchData();
        }, 0);

        return () => window.clearTimeout(timer);
    }, [fetchData]);

    const handleAddClass = () => {
        setEditingSession(null);
        setDialogOpen(true);
    };

    const handleEditSession = (session: Session) => {
        setEditingSession(session);
        setDialogOpen(true);
    };

    const handleDeleteSession = async (id: string) => {
        if (!confirm("Are you sure you want to delete this session?")) return;

        try {
            const res = await fetch(`/api/admin/attendance/${id}`, { method: "DELETE" });
            const data = await res.json();

            if (data.success) {
                toast.success("Attendance session deleted");
                fetchData();
            } else {
                toast.error(data.message || "Failed to delete session");
            }
        } catch {
            toast.error("Failed to delete session");
        }
    };

    const sessionInsights = useMemo(() => {
        const totalSessions = sessions.length;
        const averageAttendance = sessions.length
            ? sessions.reduce((sum, session) => {
                const total = session.records.length || 1;
                const present = session.records.filter((record) => record.present).length;
                return sum + (present / total) * 100;
            }, 0) / sessions.length
            : 0;
        const latestSession = sessions[0];
        const recentPresentCount = latestSession
            ? latestSession.records.filter((record) => record.present).length
            : 0;

        return {
            totalSessions,
            averageAttendance: Number(averageAttendance.toFixed(1)),
            latestSession,
            recentPresentCount,
        };
    }, [sessions]);

    const summaryInsights = useMemo(() => {
        const averagePercentage = summaries.length
            ? summaries.reduce((sum, student) => sum + student.percentage, 0) / summaries.length
            : 0;
        const regularStudents = summaries.filter((student) => student.percentage >= 75).length;
        const atRiskStudents = summaries.filter((student) => student.percentage < 75).length;
        const topPerformer = [...summaries].sort((a, b) => b.percentage - a.percentage)[0];

        return {
            averagePercentage: Number(averagePercentage.toFixed(1)),
            regularStudents,
            atRiskStudents,
            topPerformer,
        };
    }, [summaries]);

    const filteredSessions = useMemo(
        () =>
            sessions.filter(
                (session) =>
                    session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    session.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    session.createdBy?.name?.toLowerCase().includes(searchQuery.toLowerCase())
            ),
        [sessions, searchQuery]
    );

    const filteredSummaries = useMemo(
        () =>
            summaries.filter(
                (student) =>
                    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    student.rollNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    student.email?.toLowerCase().includes(searchQuery.toLowerCase())
            ),
        [summaries, searchQuery]
    );

    return (
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-8 pt-2 sm:px-6 xl:px-8">
            <section className="relative overflow-hidden rounded-[32px] border border-border/60 bg-linear-to-br from-card via-card to-sky-500/8 shadow-[0_28px_80px_-40px_rgba(0,0,0,0.65)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.14),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.12),transparent_30%)]" />
                <div className="relative grid gap-8 px-5 py-6 sm:px-7 sm:py-7 xl:grid-cols-[1.35fr_0.95fr] xl:px-8">
                    <div className="space-y-6">
                        <div className="flex flex-wrap items-center gap-3">
                            <Badge className="rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-sky-500 shadow-none">
                                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                                Attendance Control Center
                            </Badge>
                            <Badge variant="outline" className="rounded-full px-3 py-1">
                                <CalendarCheck className="mr-1.5 h-3.5 w-3.5" />
                                Sessions and student analytics
                            </Badge>
                        </div>

                        <div className="space-y-3">
                            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                                Manage Attendance
                            </h1>
                            <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                                Oversee all class sessions, adjust attendance records, and monitor student engagement levels with comprehensive analytics.
                            </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                            <HeroChip
                                label="Total Sessions"
                                value={String(sessionInsights.totalSessions)}
                                tone="slate"
                            />
                            <HeroChip
                                label="Avg Attendance"
                                value={`${summaryInsights.averagePercentage}%`}
                                tone="sky"
                            />
                            <HeroChip
                                label="Regular Students"
                                value={String(summaryInsights.regularStudents)}
                                tone="emerald"
                            />
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                        <SummaryPanel
                            icon={Calendar}
                            label="Latest Session"
                            value={
                                sessionInsights.latestSession
                                    ? format(new Date(sessionInsights.latestSession.date), "MMM d")
                                    : "—"
                            }
                            helper={
                                sessionInsights.latestSession
                                    ? sessionInsights.latestSession.title
                                    : "No session recorded yet"
                            }
                            tone="sky"
                        />
                        <SummaryPanel
                            icon={Users}
                            label="Present In Latest"
                            value={String(sessionInsights.recentPresentCount)}
                            helper="Students marked present in the newest session"
                            tone="emerald"
                        />
                        <SummaryPanel
                            icon={ShieldAlert}
                            label="At Risk"
                            value={String(summaryInsights.atRiskStudents)}
                            helper="Students currently below 75%"
                            tone="amber"
                        />
                    </div>
                </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-4">
                <SnapshotCard
                    icon={Calendar}
                    label="Sessions"
                    value={String(sessionInsights.totalSessions)}
                    helper="Attendance events recorded"
                    tone="sky"
                />
                <SnapshotCard
                    icon={BarChart3}
                    label="Avg. Attendance"
                    value={`${summaryInsights.averagePercentage}%`}
                    helper="Across all students"
                    tone="violet"
                />
                <SnapshotCard
                    icon={TrendingUp}
                    label="Regular Students"
                    value={String(summaryInsights.regularStudents)}
                    helper="Attendance at or above 75%"
                    tone="emerald"
                />
                <SnapshotCard
                    icon={XCircle}
                    label="At Risk"
                    value={String(summaryInsights.atRiskStudents)}
                    helper="Attendance below 75%"
                    tone="amber"
                />
            </section>

            <section className="rounded-[28px] border border-border/60 bg-card/80 p-5 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)] backdrop-blur-sm sm:p-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                            Admin Workspace
                        </p>
                        <h3 className="text-2xl font-semibold tracking-tight">
                            Switch between sessions and student analytics
                        </h3>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="relative w-full sm:w-80">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder={
                                    activeTab === "sessions"
                                        ? "Search sessions, type, or creator"
                                        : "Search students, roll no, or email"
                                }
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-11 rounded-2xl border-border/60 bg-background/80 pl-10 shadow-sm"
                            />
                        </div>

                        <Button onClick={handleAddClass} className="rounded-full">
                            <Plus className="mr-2 h-4 w-4" />
                            Record Attendance
                        </Button>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6 space-y-5">
                    <TabsList className="h-auto rounded-2xl bg-muted/70 p-1">
                        <TabsTrigger value="sessions" className="rounded-xl px-4 py-2.5">
                            <Calendar className="h-4 w-4" />
                            Sessions
                        </TabsTrigger>
                        <TabsTrigger value="analytics" className="rounded-xl px-4 py-2.5">
                            <Users className="h-4 w-4" />
                            Student Analytics
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="sessions" className="space-y-4">
                        <Card className="overflow-hidden rounded-[28px] border border-border/60 bg-card/75 py-0 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)]">
                            <CardContent className="p-0">
                                <div className="border-b border-border/60 px-5 py-4 sm:px-6">
                                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                        <span>{filteredSessions.length} sessions shown</span>
                                        <span className="text-border">•</span>
                                        <span>{sessions.length} total sessions</span>
                                    </div>
                                </div>

                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-border/60 hover:bg-transparent">
                                            <TableHead className="pl-5 sm:pl-6">Date</TableHead>
                                            <TableHead>Session</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Present</TableHead>
                                            <TableHead>Created By</TableHead>
                                            <TableHead className="pr-5 text-right sm:pr-6">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow className="border-border/60">
                                                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                                    Loading sessions...
                                                </TableCell>
                                            </TableRow>
                                        ) : filteredSessions.length === 0 ? (
                                            <TableRow className="border-border/60">
                                                <TableCell colSpan={6} className="h-32 text-center">
                                                    <EmptyState
                                                        title="No sessions found"
                                                        description="Try a different search, or create a new attendance session."
                                                        className="border-none bg-transparent p-0 shadow-none"
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredSessions.map((session) => {
                                                const presentCount = session.records.filter((record) => record.present).length;
                                                const totalCount = session.records.length;
                                                const percentage = totalCount
                                                    ? Math.round((presentCount / totalCount) * 100)
                                                    : 0;

                                                return (
                                                    <TableRow
                                                        key={session._id}
                                                        className="border-border/60 transition-colors hover:bg-muted/30"
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
                                                            <div className="space-y-1">
                                                                <p className="font-medium text-foreground">
                                                                    {session.title}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {percentage}% present in this session
                                                                </p>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge
                                                                variant="outline"
                                                                className={cn(
                                                                    "rounded-full px-3 py-1 capitalize",
                                                                    session.type === "class"
                                                                        ? "border-sky-500/20 bg-sky-500/10 text-sky-500"
                                                                        : "border-violet-500/20 bg-violet-500/10 text-violet-500"
                                                                )}
                                                            >
                                                                {session.type}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="space-y-1">
                                                                <p className="font-semibold text-foreground">
                                                                    {presentCount}/{totalCount}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    Present students
                                                                </p>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="space-y-1">
                                                                <p className="font-medium text-foreground">
                                                                    {session.createdBy?.name || "Admin"}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {session.createdBy?.email || "—"}
                                                                </p>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="pr-5 text-right sm:pr-6">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="sm" className="rounded-full">
                                                                        <MoreVertical className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuItem onClick={() => handleEditSession(session)}>
                                                                        <Edit className="mr-2 h-4 w-4" />
                                                                        Edit
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        className="text-red-600"
                                                                        onClick={() => handleDeleteSession(session._id)}
                                                                    >
                                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                                        Delete
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="analytics" className="space-y-4">
                        <Card className="overflow-hidden rounded-[28px] border border-border/60 bg-card/75 py-0 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)]">
                            <CardContent className="p-0">
                                <div className="border-b border-border/60 px-5 py-4 sm:px-6">
                                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                        <span>{filteredSummaries.length} students shown</span>
                                        <span className="text-border">•</span>
                                        <span>{summaries.length} total students</span>
                                        {summaryInsights.topPerformer && (
                                            <>
                                                <span className="text-border">•</span>
                                                <span>
                                                    Top performer: {summaryInsights.topPerformer.name} (
                                                    {summaryInsights.topPerformer.percentage}%)
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-border/60 hover:bg-transparent">
                                            <TableHead className="pl-5 sm:pl-6">Student</TableHead>
                                            <TableHead>Roll No</TableHead>
                                            <TableHead>Classes</TableHead>
                                            <TableHead>Assignments</TableHead>
                                            <TableHead>Total Attended</TableHead>
                                            <TableHead className="pr-5 text-right sm:pr-6">Percentage</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow className="border-border/60">
                                                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                                    Loading analytics...
                                                </TableCell>
                                            </TableRow>
                                        ) : filteredSummaries.length === 0 ? (
                                            <TableRow className="border-border/60">
                                                <TableCell colSpan={6} className="h-32 text-center">
                                                    <EmptyState
                                                        title="No student data found"
                                                        description="Try a different search or record some attendance first."
                                                        className="border-none bg-transparent p-0 shadow-none"
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredSummaries.map((student) => (
                                                <TableRow
                                                    key={student.userId}
                                                    className="border-border/60 transition-colors hover:bg-muted/30"
                                                >
                                                    <TableCell className="pl-5 sm:pl-6">
                                                        <div className="space-y-1">
                                                            <p className="font-medium text-foreground">
                                                                {student.name}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {student.email}
                                                            </p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="font-medium">
                                                        {student.rollNo || "—"}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="font-medium text-foreground">
                                                            {student.attendedClasses}/{student.totalClasses}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="font-medium text-foreground">
                                                            {student.attendedAssignments}/{student.totalAssignments}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="font-medium text-foreground">
                                                            {student.totalAttended}/{student.totalSessions}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="pr-5 text-right sm:pr-6">
                                                        <Badge
                                                            variant="outline"
                                                            className={cn(
                                                                "rounded-full px-3 py-1",
                                                                student.percentage >= 85 &&
                                                                "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
                                                                student.percentage >= 75 &&
                                                                student.percentage < 85 &&
                                                                "border-sky-500/20 bg-sky-500/10 text-sky-500",
                                                                student.percentage < 75 &&
                                                                "border-amber-500/20 bg-amber-500/10 text-amber-500"
                                                            )}
                                                        >
                                                            {student.percentage.toFixed(1)}%
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </section>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-h-[92vh] w-[95vw] max-w-[1400px] overflow-y-auto rounded-[30px] border border-border/60 bg-card/95 p-0 shadow-[0_32px_110px_-48px_rgba(0,0,0,0.8)] backdrop-blur-xl">
                    <div className="border-b border-border/60 px-5 py-5 sm:px-7">
                        <DialogHeader>
                            <DialogTitle className="text-2xl tracking-tight">
                                {editingSession
                                    ? "Edit attendance session"
                                    : "Record new class attendance"}
                            </DialogTitle>
                            <DialogDescription>
                                {editingSession
                                    ? "Update the session metadata and adjust who was present."
                                    : "Create a class attendance record and mark present students quickly."}
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="px-5 py-5 sm:px-7">
                        <AttendanceForm
                            key={editingSession?._id || "new-attendance-session"}
                            initialSession={editingSession}
                            onSuccess={() => {
                                setDialogOpen(false);
                                setEditingSession(null);
                                fetchData();
                            }}
                            onCancel={() => {
                                setDialogOpen(false);
                                setEditingSession(null);
                            }}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function HeroChip({
    label,
    value,
    tone,
}: {
    label: string;
    value: string;
    tone: "sky" | "emerald" | "slate";
}) {
    const tones = {
        sky: "border-sky-500/20 bg-sky-500/10 text-sky-500",
        emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
        slate: "border-border/60 bg-background/70 text-foreground",
    };

    return (
        <div className="rounded-2xl border border-border/60 bg-background/60 p-3 backdrop-blur-sm">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                {label}
            </p>
            <div className="mt-2 flex items-center justify-between">
                <span className="text-lg font-semibold tracking-tight">{value}</span>
                <span className={cn("rounded-full border px-2.5 py-1 text-xs font-medium", tones[tone])}>
                    Live
                </span>
            </div>
        </div>
    );
}

function SummaryPanel({
    icon: Icon,
    label,
    value,
    helper,
    tone,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
    helper: string;
    tone: "sky" | "emerald" | "amber";
}) {
    const tones = {
        sky: "border-sky-500/20 bg-sky-500/10 text-sky-500",
        emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
        amber: "border-amber-500/20 bg-amber-500/10 text-amber-500",
    };

    return (
        <div className="rounded-[24px] border border-border/60 bg-background/70 p-4 backdrop-blur-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">{label}</p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{helper}</p>
                </div>
                <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl border", tones[tone])}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </div>
    );
}

function SnapshotCard({
    icon: Icon,
    label,
    value,
    helper,
    tone,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
    helper: string;
    tone: "sky" | "violet" | "emerald" | "amber";
}) {
    const tones = {
        sky: "border-sky-500/20 bg-sky-500/10 text-sky-500",
        violet: "border-violet-500/20 bg-violet-500/10 text-violet-500",
        emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
        amber: "border-amber-500/20 bg-amber-500/10 text-amber-500",
    };

    return (
        <Card className="rounded-[28px] border border-border/60 bg-card/80 py-0 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)]">
            <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                            {label}
                        </p>
                        <p className="mt-3 text-4xl font-black tracking-tighter text-foreground">
                            {value}
                        </p>
                        <p className="mt-2 text-sm text-muted-foreground">{helper}</p>
                    </div>
                    <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl border", tones[tone])}>
                        <Icon className="h-5 w-5" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
