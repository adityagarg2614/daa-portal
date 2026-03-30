"use client";

import { TableRow, TableCell } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getInitials, getPerformanceBadgeColor } from "@/lib/admin/students-utils";
import { MoreHorizontal, Eye, Download, Mail } from "lucide-react";

interface StudentRowProps {
    student: {
        _id: string;
        name: string | null;
        email: string | null;
        rollNo: string | null;
        totalSubmissions: number;
        totalScore: number;
        averageScore: number;
    };
    onViewDetails: (studentId: string) => void;
    onExportSubmissions: (studentId: string, studentName: string) => void;
}

export function StudentRow({ student, onViewDetails, onExportSubmissions }: StudentRowProps) {
    const performanceColors = getPerformanceBadgeColor(student.averageScore);

    return (
        <TableRow className="group hover:bg-muted/50 transition-colors">
            {/* Student Name with Avatar */}
            <TableCell className="p-4">
                <div className="flex items-center gap-3">
                    <Avatar size="sm" className="h-9 w-9">
                        <AvatarFallback className="bg-linear-to-br from-indigo-500 to-purple-600 text-white text-xs font-semibold">
                            {getInitials(student.name)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <span className="font-medium text-foreground">
                            {student.name || "N/A"}
                        </span>
                        <span className="text-xs text-muted-foreground md:hidden">
                            {student.rollNo || "N/A"}
                        </span>
                    </div>
                </div>
            </TableCell>

            {/* Roll Number - Hidden on mobile */}
            <TableCell className="p-4 hidden md:table-cell">
                <span className="font-mono text-sm">{student.rollNo || "N/A"}</span>
            </TableCell>

            {/* Email - Hidden on small screens */}
            <TableCell className="p-4 hidden lg:table-cell">
                <span className="text-sm text-muted-foreground">{student.email || "N/A"}</span>
            </TableCell>

            {/* Total Submissions */}
            <TableCell className="p-4 text-center">
                <Badge variant="secondary" className="font-medium">
                    {student.totalSubmissions}
                </Badge>
            </TableCell>

            {/* Total Score with Performance Badge */}
            <TableCell className="p-4 text-center">
                <div className="flex flex-col items-center gap-1">
                    <span className="font-semibold text-sm">{student.totalScore}</span>
                    <Badge variant="outline" className={`${performanceColors.bg} ${performanceColors.text} border-0 text-xs`}>
                        {performanceColors.label}
                    </Badge>
                </div>
            </TableCell>

            {/* Average Score with Progress Bar */}
            <TableCell className="p-4 hidden sm:table-cell">
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{student.averageScore}%</span>
                    </div>
                    <div className="h-1.5 w-24 bg-muted rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all ${student.averageScore >= 80
                                ? "bg-green-500"
                                : student.averageScore >= 50
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                                }`}
                            style={{ width: `${Math.min(student.averageScore, 100)}%` }}
                        />
                    </div>
                </div>
            </TableCell>

            {/* Actions */}
            <TableCell className="p-4 text-right">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => onViewDetails(student._id)} className="gap-2 cursor-pointer">
                            <Eye className="h-4 w-4" />
                            View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onExportSubmissions(student._id, student.name || "student")} className="gap-2 cursor-pointer">
                            <Download className="h-4 w-4" />
                            Export Submissions
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 cursor-pointer">
                            <Mail className="h-4 w-4" />
                            Send Email
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </TableCell>
        </TableRow>
    );
}
