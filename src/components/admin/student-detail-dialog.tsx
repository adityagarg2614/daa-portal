"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from "@/components/ui/table";
import {
    User,
    Mail,
    Hash,
    Calendar,
    Trophy,
    BookOpen,
    TrendingUp,
    Download,
    Medal,
    Clock,
    CheckCircle2,
} from "lucide-react";
import { getInitials, getPerformanceBadgeColor, formatDate, exportStudentSubmissionsToCSV } from "@/lib/admin/students-utils";

interface StudentDetail {
    student: {
        _id: string;
        name: string | null;
        email: string | null;
        rollNo: string | null;
        clerkId: string;
        createdAt: string;
    };
    submissions: any[];
    stats: {
        totalSubmissions: number;
        totalScore: number;
        averageScore: number;
        completedAssignments: number;
        totalAssignments: number;
        rank: number;
        lastActive: string | null;
        status: string;
    };
}

interface StudentDetailDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    studentData: StudentDetail | null;
    isLoading: boolean;
}

export function StudentDetailDialog({
    open,
    onOpenChange,
    studentData,
    isLoading,
}: StudentDetailDialogProps) {
    if (!studentData && !isLoading) return null;

    const handleExport = () => {
        if (studentData) {
            exportStudentSubmissionsToCSV(
                studentData.student,
                studentData.submissions,
                `${studentData.student.name || "student"}_submissions.csv`
            );
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95vw]! w-full max-h-[90vh] overflow-y-auto sm:max-w-[95vw]!">
                <DialogHeader>
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-16 w-16">
                                <AvatarFallback className="bg-linear-to-br from-indigo-500 to-purple-600 text-white text-xl font-bold">
                                    {studentData ? getInitials(studentData.student.name) : "..."}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <DialogTitle className="text-2xl">
                                    {studentData?.student.name || "Loading..."}
                                </DialogTitle>
                                <DialogDescription className="flex items-center gap-2 mt-1">
                                    <Hash className="h-3 w-3" />
                                    {studentData?.student.rollNo || "N/A"}
                                </DialogDescription>
                            </div>
                        </div>
                        <Button onClick={handleExport} variant="outline" size="sm" className="gap-1.5">
                            <Download className="h-4 w-4" />
                            Export
                        </Button>
                    </div>
                </DialogHeader>

                {isLoading ? (
                    <div className="py-8 text-center text-muted-foreground">Loading student details...</div>
                ) : studentData ? (
                    <div className="space-y-6">
                        {/* Student Info Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center gap-3 pb-2">
                                    <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                                        <Mail className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <CardTitle className="text-xs font-medium text-muted-foreground">Email</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm font-medium truncate">{studentData.student.email || "N/A"}</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center gap-3 pb-2">
                                    <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                        <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <CardTitle className="text-xs font-medium text-muted-foreground">Joined</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm font-medium">{formatDate(studentData.student.createdAt)}</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center gap-3 pb-2">
                                    <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                                    </div>
                                    <CardTitle className="text-xs font-medium text-muted-foreground">Status</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Badge className={studentData.stats.status === "active" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"}>
                                        {studentData.stats.status}
                                    </Badge>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center gap-3 pb-2">
                                    <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                                        <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                    </div>
                                    <CardTitle className="text-xs font-medium text-muted-foreground">Last Active</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm font-medium">
                                        {studentData.stats.lastActive ? formatDate(studentData.stats.lastActive) : "Never"}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Performance Stats */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center gap-3 pb-2">
                                    <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                        <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <CardTitle className="text-xs font-medium text-muted-foreground">Submissions</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-2xl font-bold">{studentData.stats.totalSubmissions}</p>
                                    <p className="text-xs text-muted-foreground">Total submissions</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center gap-3 pb-2">
                                    <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                        <Trophy className="h-5 w-5 text-green-600 dark:text-green-400" />
                                    </div>
                                    <CardTitle className="text-xs font-medium text-muted-foreground">Total Score</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-2xl font-bold">{studentData.stats.totalScore}</p>
                                    <p className="text-xs text-muted-foreground">Cumulative points</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center gap-3 pb-2">
                                    <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                        <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <CardTitle className="text-xs font-medium text-muted-foreground">Average Score</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-3">
                                        <p className="text-2xl font-bold">{studentData.stats.averageScore}%</p>
                                        <Badge className={getPerformanceBadgeColor(studentData.stats.averageScore).bg + " " + getPerformanceBadgeColor(studentData.stats.averageScore).text + " border-0"}>
                                            {getPerformanceBadgeColor(studentData.stats.averageScore).label}
                                        </Badge>
                                    </div>
                                    <Progress value={studentData.stats.averageScore} className="h-2 mt-2" />
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center gap-3 pb-2">
                                    <div className="h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                                        <Medal className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                                    </div>
                                    <CardTitle className="text-xs font-medium text-muted-foreground">Class Rank</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-2xl font-bold">#{studentData.stats.rank}</p>
                                    <p className="text-xs text-muted-foreground">
                                        out of {studentData.stats.totalAssignments} assignments
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Submissions Table */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BookOpen className="h-5 w-5" />
                                    Submission History
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {studentData.submissions.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No submissions yet
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-muted/50">
                                                    <TableHead>Assignment</TableHead>
                                                    <TableHead>Problem</TableHead>
                                                    <TableHead className="text-center">Score</TableHead>
                                                    <TableHead className="text-center">Status</TableHead>
                                                    <TableHead className="hidden sm:table-cell">Language</TableHead>
                                                    <TableHead className="hidden md:table-cell">Submitted</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {studentData.submissions.map((sub: any) => (
                                                    <TableRow key={sub._id}>
                                                        <TableCell className="font-medium">
                                                            {sub.assignmentTitle}
                                                        </TableCell>
                                                        <TableCell>{sub.problemTitle}</TableCell>
                                                        <TableCell className="text-center">
                                                            <Badge variant={sub.score && sub.score >= (sub.problemMarks * 0.8) ? "success" : sub.score && sub.score >= (sub.problemMarks * 0.5) ? "secondary" : "destructive"}>
                                                                {sub.score ?? "N/A"} / {sub.problemMarks}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <Badge variant={sub.status === "Evaluated" ? "success" : "secondary"}>
                                                                {sub.status}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="hidden sm:table-cell capitalize">
                                                            {sub.language}
                                                        </TableCell>
                                                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                                                            {formatDate(sub.submittedAt)}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}
