"use client";

import { useState, useEffect, useCallback } from "react";
import { SectionHeader } from "@/components/ui/section-header";
import { StatsCard } from "@/components/ui/stats-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    CalendarCheck, 
    Users, 
    BarChart3, 
    Plus, 
    Calendar, 
    Search, 
    MoreVertical, 
    Trash2, 
    Edit,
    CheckCircle2,
    XCircle
} from "lucide-react";
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle,
    DialogDescription 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { format } from "date-fns";
import { AttendanceForm } from "@/components/admin/attendance-form";

// Types
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
                if (data.success) setSessions(data.data.sessions);
            } else {
                const res = await fetch("/api/admin/attendance/summary");
                const data = await res.json();
                if (data.success) setSummaries(data.data);
            }
        } catch (error) {
            console.error("Error fetching attendance data:", error);
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    }, [activeTab]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAddClass = () => {
        setEditingSession(null);
        setDialogOpen(true);
    };

    const handleEditSession = (session: Session) => {
        setEditingSession(session);
        // For simplicity in this step, we'll just show the same form. 
        // Real edit would pre-populate present students.
        toast.info("Editing functionality is restricted to Title/Date in this version");
        setDialogOpen(true);
    };

    const handleDeleteSession = async (id: string) => {
        if (!confirm("Are you sure you want to delete this session?")) return;
        try {
            const res = await fetch(`/api/admin/attendance/${id}`, { method: "DELETE" });
            const data = await res.json();
            if (data.success) {
                toast.success("Session deleted");
                fetchData();
            }
        } catch (error) {
            toast.error("Failed to delete session");
        }
    };

    return (
        <div className="space-y-6 pb-8">
            <SectionHeader
                title="Attendance Management"
                description="Manage class attendance and monitor student engagement"
                icon={CalendarCheck}
                action={
                    <Button onClick={handleAddClass}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Class
                    </Button>
                }
            />

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-[95vw] w-full max-h-[95vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingSession ? "Edit Attendance Session" : "Record New Class Attendance"}</DialogTitle>
                        <DialogDescription>
                            Select students who were present for this class session.
                        </DialogDescription>
                    </DialogHeader>
                    <AttendanceForm 
                        onSuccess={() => {
                            setDialogOpen(false);
                            fetchData();
                        }}
                        onCancel={() => setDialogOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                    title="Total Sessions"
                    value={sessions.length || summaries[0]?.totalSessions || 0}
                    icon={Calendar}
                    subtitle="Last updated today"
                />
                <StatsCard
                    title="Avg. Attendance"
                    value={`${summaries.length > 0 ? (summaries.reduce((a, b) => a + b.percentage, 0) / summaries.length).toFixed(1) : 0}%`}
                    icon={BarChart3}
                    subtitle="Overall percentage"
                />
                <StatsCard
                    title="Regular Students"
                    value={summaries.filter(s => s.percentage >= 75).length}
                    icon={Users}
                    subtitle="Above 75%"
                />
                <StatsCard
                    title="At Risk"
                    value={summaries.filter(s => s.percentage < 75).length}
                    icon={XCircle}
                    subtitle="Below 75%"
                />
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="sessions" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Sessions
                    </TabsTrigger>
                    <TabsTrigger value="analytics" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Student Analytics
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="sessions" className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="relative w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search sessions..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>

                    <div className="rounded-xl border bg-card">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Present</TableHead>
                                    <TableHead>Created By</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center">Loading sessions...</TableCell>
                                    </TableRow>
                                ) : sessions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center">No sessions found</TableCell>
                                    </TableRow>
                                ) : (
                                    sessions.map((session) => (
                                        <TableRow key={session._id}>
                                            <TableCell>{format(new Date(session.date), "PPP")}</TableCell>
                                            <TableCell className="font-medium">{session.title}</TableCell>
                                            <TableCell>
                                                <Badge variant={session.type === "class" ? "default" : "secondary"}>
                                                    {session.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-green-600">
                                                        {session.records.filter(r => r.present).length}
                                                    </span>
                                                    <span className="text-muted-foreground">/</span>
                                                    <span>{session.records.length}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{session.createdBy?.name || "Admin"}</TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm"><MoreVertical className="h-4 w-4" /></Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                                                        <DropdownMenuItem 
                                                            className="text-red-600"
                                                            onClick={() => handleDeleteSession(session._id)}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="relative w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search students..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>

                    <div className="rounded-xl border bg-card">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Student</TableHead>
                                    <TableHead>Roll No</TableHead>
                                    <TableHead>Classes</TableHead>
                                    <TableHead>Assignments</TableHead>
                                    <TableHead>Total Attended</TableHead>
                                    <TableHead>Percentage</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center">Loading analytics...</TableCell>
                                    </TableRow>
                                ) : summaries.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center">No student data found</TableCell>
                                    </TableRow>
                                ) : (
                                    summaries
                                        .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.rollNo.toLowerCase().includes(searchQuery.toLowerCase()))
                                        .map((student) => (
                                        <TableRow key={student.userId}>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{student.name}</span>
                                                    <span className="text-xs text-muted-foreground">{student.email}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{student.rollNo}</TableCell>
                                            <TableCell>{student.attendedClasses} / {student.totalClasses}</TableCell>
                                            <TableCell>{student.attendedAssignments} / {student.totalAssignments}</TableCell>
                                            <TableCell className="font-semibold">
                                                {student.totalAttended} / {student.totalSessions}
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={
                                                    student.percentage >= 90 ? "bg-green-500" :
                                                    student.percentage >= 75 ? "bg-yellow-500" :
                                                    "bg-red-500"
                                                }>
                                                    {student.percentage}%
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
