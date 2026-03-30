"use client";

import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from "@/components/ui/table";
import { StudentRow } from "./student-row";

interface Student {
    _id: string;
    name: string | null;
    email: string | null;
    rollNo: string | null;
    totalSubmissions: number;
    totalScore: number;
    averageScore: number;
}

interface StudentsTableProps {
    students: Student[];
    onViewDetails: (studentId: string) => void;
    onExportSubmissions: (studentId: string, studentName: string) => void;
}

export function StudentsTable({ students, onViewDetails, onExportSubmissions }: StudentsTableProps) {
    return (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/50">
                        <TableHead className="h-12 font-semibold">Student</TableHead>
                        <TableHead className="h-12 font-semibold hidden md:table-cell">Roll Number</TableHead>
                        <TableHead className="h-12 font-semibold hidden lg:table-cell">Email</TableHead>
                        <TableHead className="h-12 font-semibold text-center">Submissions</TableHead>
                        <TableHead className="h-12 font-semibold text-center">Total Score</TableHead>
                        <TableHead className="h-12 font-semibold hidden sm:table-cell">Avg Score</TableHead>
                        <TableHead className="h-12 font-semibold text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {students.length === 0 ? (
                        <TableRow className="hover:bg-transparent">
                            <TableCell colSpan={7} className="h-32 text-center">
                                <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                    <p className="text-sm">No students found</p>
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : (
                        students.map((student) => (
                            <StudentRow
                                key={student._id}
                                student={student}
                                onViewDetails={onViewDetails}
                                onExportSubmissions={onExportSubmissions}
                            />
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
