"use client";

import React, { useState, useEffect } from "react";
import { 
    CalendarCheck, 
    BookOpen, 
    CheckCircle2, 
    XCircle, 
    Percent, 
    Info,
    ChevronRight,
    Search
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Heatmap } from "@/components/attendance/Heatmap";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
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
                }
            } catch (error) {
                toast.error("Failed to load attendance records");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredSessions = sessions.filter(s => 
        s.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const overallPercentage = stats 
        ? Math.round(((stats.attendedClasses + stats.attendedAssignments) / 
          (stats.totalClasses + stats.totalAssignments || 1)) * 100)
        : 0;

    const getProgressColor = (percent: number) => {
        if (percent >= 90) return "bg-green-500";
        if (percent >= 75) return "bg-yellow-500";
        return "bg-red-500";
    };

    if (loading) {
        return (
            <div className="flex flex-1 flex-col gap-6 p-8">
                <div className="flex flex-col gap-2">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
                </div>
                <Skeleton className="h-64 rounded-2xl" />
                <Skeleton className="h-96 rounded-2xl" />
            </div>
        );
    }

    return (
        <div className="flex flex-1 flex-col gap-8 p-8 max-w-7xl mx-auto w-full">
            {/* Header Section */}
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">My Attendance</h1>
                <p className="text-muted-foreground">
                    Track your class participation and assignment engagement.
                </p>
            </div>

            {/* Combined Progress Ring / Hero Bar */}
            <Card className="border-none bg-linear-to-br from-primary/5 to-primary/10 shadow-none overflow-hidden relative">
                <div className="absolute right-0 top-0 h-full w-1/3 bg-primary/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
                <CardContent className="p-8">
                    <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                        <div className="flex flex-col gap-1 items-center md:items-start">
                           <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Overall Present</span>
                           <div className="flex items-baseline gap-1">
                                <span className={cn("text-6xl font-black tabular-nums tracking-tighter", 
                                    overallPercentage >= 90 ? "text-green-500" : overallPercentage >= 75 ? "text-yellow-500" : "text-red-500"
                                )}>
                                    {overallPercentage}%
                                </span>
                           </div>
                        </div>
                        <div className="flex-1 w-full space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="font-medium">Attendance Progress</span>
                                <span className="text-muted-foreground italic">
                                    {overallPercentage >= 75 ? "You're doing great!" : "Needs improvement to reach 75%"}
                                </span>
                            </div>
                            <Progress 
                                value={overallPercentage} 
                                className="h-4 bg-background" 
                                indicatorClassName={getProgressColor(overallPercentage)}
                            />
                            <div className="grid grid-cols-2 gap-4 text-xs">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                                    <span>Classes: {stats?.attendedClasses}/{stats?.totalClasses}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                                    <span>Assignments: {stats?.attendedAssignments}/{stats?.totalAssignments}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Classes Stat Card */}
                <Card className="hover:shadow-md transition-shadow duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Regular Classes</CardTitle>
                        <CalendarCheck className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-2xl font-bold">{stats?.attendedClasses} / {stats?.totalClasses}</div>
                                <p className="text-xs text-muted-foreground mt-1">Sessions attended</p>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-blue-500">
                                    {stats?.totalClasses ? Math.round((stats.attendedClasses / stats.totalClasses) * 100) : 100}%
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Attendance</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Assignments Stat Card */}
                <Card className="hover:shadow-md transition-shadow duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Assignment Engagement</CardTitle>
                        <BookOpen className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-2xl font-bold">{stats?.attendedAssignments} / {stats?.totalAssignments}</div>
                                <p className="text-xs text-muted-foreground mt-1">Assignments opened</p>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-purple-500">
                                    {stats?.totalAssignments ? Math.round((stats.attendedAssignments / stats.totalAssignments) * 100) : 100}%
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Completion</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Heatmap Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold tracking-tight">Attendance Heatmap</h2>
                    <Badge variant="outline" className="gap-1 font-normal">
                        <Info className="h-3 w-3" />
                        Heatmap shows activity for {new Date().getFullYear()}
                    </Badge>
                </div>
                <Heatmap data={heatmapData} />
            </div>

            {/* Session History Table */}
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-xl font-semibold tracking-tight">Session History</h2>
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Find session..." 
                            className="pl-9 bg-muted/50 border-none h-9 text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <Card className="border-none shadow-none bg-card/50">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-muted/50">
                                <TableHead className="w-[120px]">Date</TableHead>
                                <TableHead>Session Title</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="text-right">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredSessions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground font-medium">
                                        No attendance records found matched your search.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredSessions.map((s) => (
                                    <TableRow key={s._id} className="group border-muted/50">
                                        <TableCell className="font-medium text-muted-foreground tabular-nums">
                                            {format(new Date(s.date), 'MMM d, yyyy')}
                                        </TableCell>
                                        <TableCell className="font-semibold group-hover:text-primary transition-colors">
                                            {s.title}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={s.type === "class" ? "secondary" : "outline"} className="capitalize font-normal">
                                                {s.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {s.present ? (
                                                <div className="inline-flex items-center gap-1.5 text-green-500 font-bold px-2 py-1 rounded-lg bg-green-500/10">
                                                    <CheckCircle2 className="h-4 w-4" />
                                                    <span>Present</span>
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center gap-1.5 text-red-500 font-bold px-2 py-1 rounded-lg bg-red-500/10">
                                                    <XCircle className="h-4 w-4" />
                                                    <span>Absent</span>
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </Card>
            </div>
        </div>
    );
}
