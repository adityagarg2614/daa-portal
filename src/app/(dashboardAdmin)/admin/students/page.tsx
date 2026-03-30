"use client";

import { useState, useEffect, useCallback } from "react";
import { SectionHeader } from "@/components/ui/section-header";
import { StatsCard } from "@/components/ui/stats-card";
import { StudentsTable } from "@/components/admin/students-table";
import { StudentsFilters } from "@/components/admin/students-filters";
import { StudentsPagination } from "@/components/admin/students-pagination";
import { StudentDetailDialog } from "@/components/admin/student-detail-dialog";
import { Users, UserCheck, TrendingUp, Medal } from "lucide-react";
import { toast } from "sonner";

interface Student {
    _id: string;
    name: string | null;
    email: string | null;
    rollNo: string | null;
    totalSubmissions: number;
    totalScore: number;
    averageScore: number;
    lastActive: string | null;
    status: string;
}

interface PaginationData {
    currentPage: number;
    totalPages: number;
    totalStudents: number;
    hasNext: boolean;
    hasPrev: boolean;
}

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

export default function StudentsPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [pagination, setPagination] = useState<PaginationData>({
        currentPage: 1,
        totalPages: 0,
        totalStudents: 0,
        hasNext: false,
        hasPrev: false,
    });
    const [loading, setLoading] = useState(true);
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [studentDetail, setStudentDetail] = useState<StudentDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);

    // Filter states
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");
    const [sortBy, setSortBy] = useState("name");
    const [order, setOrder] = useState("asc");
    const [limit, setLimit] = useState(20);

    // Fetch students
    const fetchStudents = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: pagination.currentPage.toString(),
                limit: limit.toString(),
                search,
                status,
                sortBy,
                order,
            });

            const response = await fetch(`/api/admin/students?${params}`);
            const data = await response.json();

            if (data.success) {
                setStudents(data.data.students);
                setPagination(data.data.pagination);
            } else {
                toast.error(data.message || "Failed to fetch students");
            }
        } catch (error) {
            console.error("Error fetching students:", error);
            toast.error("Failed to fetch students data");
        } finally {
            setLoading(false);
        }
    }, [pagination.currentPage, limit, search, status, sortBy, order]);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    // Fetch student detail
    const fetchStudentDetail = async (studentId: string) => {
        setDetailLoading(true);
        try {
            const response = await fetch(`/api/admin/students/${studentId}`);
            const data = await response.json();

            if (data.success) {
                setStudentDetail(data.data);
                setDialogOpen(true);
            } else {
                toast.error(data.message || "Failed to fetch student details");
            }
        } catch (error) {
            console.error("Error fetching student detail:", error);
            toast.error("Failed to fetch student details");
        } finally {
            setDetailLoading(false);
        }
    };

    // Handlers
    const handleViewDetails = (studentId: string) => {
        setSelectedStudentId(studentId);
        fetchStudentDetail(studentId);
    };

    const handleExportSubmissions = (studentId: string, studentName: string) => {
        toast.success(`Exporting submissions for ${studentName}...`);
        fetchStudentDetail(studentId);
    };

    const handlePageChange = (page: number) => {
        setPagination((prev) => ({ ...prev, currentPage: page }));
    };

    const handleLimitChange = (newLimit: number) => {
        setLimit(newLimit);
        setPagination((prev) => ({ ...prev, currentPage: 1 }));
    };

    const handleSearchChange = (newSearch: string) => {
        setSearch(newSearch);
        setPagination((prev) => ({ ...prev, currentPage: 1 }));
    };

    const handleStatusChange = (newStatus: string) => {
        setStatus(newStatus);
        setPagination((prev) => ({ ...prev, currentPage: 1 }));
    };

    const handleSortChange = (newSortBy: string, newOrder: string) => {
        setSortBy(newSortBy);
        setOrder(newOrder);
        setPagination((prev) => ({ ...prev, currentPage: 1 }));
    };

    // Calculate stats
    const activeStudents = students.filter((s) => s.status === "active").length;
    const avgScore =
        students.length > 0
            ? Math.round(students.reduce((sum, s) => sum + s.averageScore, 0) / students.length)
            : 0;
    const topPerformer = students.length > 0 ? students.sort((a, b) => b.totalScore - a.totalScore)[0] : null;

    return (
        <div className="space-y-6 pb-8">
            {/* Header */}
            <SectionHeader
                title="Student Management"
                description="View and manage all enrolled students"
                icon={Users}
            />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                    icon={Users}
                    title="Total Students"
                    value={pagination.totalStudents}
                    subtitle="All registered students"
                />
                <StatsCard
                    icon={UserCheck}
                    title="Active Students"
                    value={activeStudents}
                    subtitle="Submitted in last 30 days"
                />
                <StatsCard
                    icon={TrendingUp}
                    title="Average Score"
                    value={`${avgScore}%`}
                    subtitle="Class average performance"
                />
                <StatsCard
                    icon={Medal}
                    title="Top Performer"
                    value={topPerformer?.name || "N/A"}
                    subtitle={topPerformer ? `${topPerformer.totalScore} total points` : "No data"}
                />
            </div>

            {/* Filters */}
            <StudentsFilters
                onSearchChange={handleSearchChange}
                onStatusChange={handleStatusChange}
                onSortChange={handleSortChange}
                students={students}
            />

            {/* Table */}
            <StudentsTable
                students={students}
                onViewDetails={handleViewDetails}
                onExportSubmissions={handleExportSubmissions}
            />

            {/* Pagination */}
            {!loading && pagination.totalPages > 1 && (
                <StudentsPagination
                    currentPage={pagination.currentPage}
                    totalPages={pagination.totalPages}
                    totalStudents={pagination.totalStudents}
                    onPageChange={handlePageChange}
                    onLimitChange={handleLimitChange}
                    currentLimit={limit}
                />
            )}

            {/* Detail Dialog */}
            <StudentDetailDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                studentData={studentDetail}
                isLoading={detailLoading}
            />
        </div>
    );
}
