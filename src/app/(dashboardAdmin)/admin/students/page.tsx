"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { StudentsTable } from "@/components/admin/students-table";
import { StudentsFilters } from "@/components/admin/students-filters";
import { StudentsPagination } from "@/components/admin/students-pagination";
import { StudentDetailDialog } from "@/components/admin/student-detail-dialog";
import {
    Medal,
    Sparkles,
    TrendingUp,
    Trophy,
    Users,
    BookOpen,
    Search,
    GraduationCap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Student {
    _id: string;
    name: string | null;
    email: string | null;
    rollNo: string | null;
    totalSubmissions: number;
    totalScore: number;
    averageScore: number;
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
    submissions: unknown[];
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
    const [studentDetail, setStudentDetail] = useState<StudentDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);

    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("name");
    const [order, setOrder] = useState("asc");
    const [limit, setLimit] = useState(20);

    const fetchStudents = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: pagination.currentPage.toString(),
                limit: limit.toString(),
                search,
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
    }, [pagination.currentPage, limit, search, sortBy, order]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            void fetchStudents();
        }, 0);

        return () => window.clearTimeout(timer);
    }, [fetchStudents]);

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

    const handleViewDetails = (studentId: string) => {
        void fetchStudentDetail(studentId);
    };

    const handleExportSubmissions = (studentId: string, studentName: string) => {
        toast.success(`Exporting submissions for ${studentName}...`);
        void fetchStudentDetail(studentId);
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

    const handleSortChange = (newSortBy: string, newOrder: string) => {
        setSortBy(newSortBy);
        setOrder(newOrder);
        setPagination((prev) => ({ ...prev, currentPage: 1 }));
    };

    const insights = useMemo(() => {
        const avgScore =
            students.length > 0
                ? Math.round(students.reduce((sum, student) => sum + student.averageScore, 0) / students.length)
                : 0;

        const topPerformer =
            students.length > 0
                ? [...students].sort((a, b) => b.totalScore - a.totalScore)[0]
                : null;

        const engagedStudents = students.filter((student) => student.totalSubmissions > 0).length;
        const highPerformers = students.filter((student) => student.averageScore >= 80).length;
        const activeTone =
            search.trim().length > 0
                ? `Showing filtered results for "${search}".`
                : pagination.totalStudents > 0
                    ? "Track class activity, review performance, and open student details quickly."
                    : "Student data will appear here once records are available.";

        return {
            avgScore,
            topPerformer,
            engagedStudents,
            highPerformers,
            activeTone,
        };
    }, [students, pagination.totalStudents, search]);

    const pageRange = useMemo(() => {
        if (pagination.totalStudents === 0) {
            return { start: 0, end: 0 };
        }

        const start = (pagination.currentPage - 1) * limit + 1;
        const end = Math.min(pagination.currentPage * limit, pagination.totalStudents);

        return { start, end };
    }, [pagination.currentPage, pagination.totalStudents, limit]);

    if (loading) {
        return (
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-8 pt-2 sm:px-6 xl:px-8">
                <StudentsPageSkeleton />
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
                                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                                Student Management
                            </Badge>
                            <Badge variant="outline" className="rounded-full px-3 py-1">
                                <GraduationCap className="mr-1.5 h-3.5 w-3.5" />
                                Admin student oversight workspace
                            </Badge>
                        </div>

                        <div className="space-y-3">
                            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                                Manage Students
                            </h1>
                            <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                                Track student progress, submission trends, and identify areas needing attention.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                                    Class Signal
                                </p>
                                <div className="mt-2 flex flex-wrap items-end gap-3">
                                    <span className="text-5xl font-black leading-none tracking-[-0.06em] text-emerald-500">
                                        {pagination.totalStudents}
                                    </span>
                                    <div className="mb-1 rounded-2xl border border-border/60 bg-background/70 px-3 py-2 text-sm text-muted-foreground backdrop-blur">
                                        {insights.activeTone}
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-3">
                                <HeroChip label="Visible" value={String(students.length)} tone="sky" />
                                <HeroChip label="Engaged" value={String(insights.engagedStudents)} tone="emerald" />
                                <HeroChip label="High Scorers" value={String(insights.highPerformers)} tone="amber" />
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                        <SummaryPanel
                            icon={Users}
                            label="Total Students"
                            value={String(pagination.totalStudents)}
                            helper="Registered learners available in the current dataset"
                            tone="sky"
                        />
                        <SummaryPanel
                            icon={TrendingUp}
                            label="Average Score"
                            value={`${insights.avgScore}%`}
                            helper="Average performance of the currently visible cohort"
                            tone="emerald"
                        />
                        <SummaryPanel
                            icon={Trophy}
                            label="Top Performer"
                            value={insights.topPerformer?.name || "N/A"}
                            helper={
                                insights.topPerformer
                                    ? `${insights.topPerformer.totalScore} total points`
                                    : "No performance data available yet"
                            }
                            tone="amber"
                        />
                    </div>
                </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
                <SnapshotCard
                    icon={Users}
                    label="Students"
                    value={String(pagination.totalStudents)}
                    helper="Total registered student records"
                    tone="sky"
                />
                <SnapshotCard
                    icon={BookOpen}
                    label="Active Records"
                    value={String(insights.engagedStudents)}
                    helper="Students with at least one submission"
                    tone="emerald"
                />
                <SnapshotCard
                    icon={Medal}
                    label="Current Page"
                    value={`${pagination.currentPage}/${Math.max(pagination.totalPages, 1)}`}
                    helper="Pagination is already enabled for this student list"
                    tone="amber"
                />
            </section>

            <section className="rounded-[28px] border border-border/60 bg-card/80 p-5 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)] backdrop-blur-sm sm:p-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="space-y-1.5">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                            Explore Students
                        </p>
                        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                            Search, sort, and move through the class list
                        </h2>
                    </div>

                    <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3 text-sm text-muted-foreground">
                        Showing {pageRange.start} to {pageRange.end} of {pagination.totalStudents}
                    </div>
                </div>

                <div className="mt-5">
                    <StudentsFilters
                        onSearchChange={handleSearchChange}
                        onSortChange={handleSortChange}
                        students={students}
                    />
                </div>
            </section>

            <section className="rounded-[28px] border border-border/60 bg-card/80 p-3 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)] sm:p-4">
                <div className="mb-3 flex flex-col gap-3 rounded-[22px] border border-border/60 bg-background/55 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                            Student List
                        </p>
                        <h2 className="mt-1 text-lg font-semibold tracking-tight">
                            Review performance and open full student detail
                        </h2>
                    </div>
                    <div className="flex items-center gap-2 rounded-full border border-border/60 bg-background px-3 py-1.5 text-sm text-muted-foreground">
                        <Search className="h-4 w-4" />
                        Detail view and export actions available
                    </div>
                </div>

                <StudentsTable
                    students={students}
                    onViewDetails={handleViewDetails}
                    onExportSubmissions={handleExportSubmissions}
                />
            </section>

            {!loading && pagination.totalPages > 1 && (
                <section className="rounded-[28px] border border-border/60 bg-card/80 p-5 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)] sm:p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                                Pagination
                            </p>
                            <h2 className="mt-1 text-lg font-semibold tracking-tight">
                                Move across the full student directory
                            </h2>
                        </div>
                        <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3 text-sm text-muted-foreground">
                            Page {pagination.currentPage} of {pagination.totalPages}
                        </div>
                    </div>

                    <div className="mt-5">
                        <StudentsPagination
                            currentPage={pagination.currentPage}
                            totalPages={pagination.totalPages}
                            totalStudents={pagination.totalStudents}
                            onPageChange={handlePageChange}
                            onLimitChange={handleLimitChange}
                            currentLimit={limit}
                        />
                    </div>
                </section>
            )}

            <StudentDetailDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                studentData={studentDetail}
                isLoading={detailLoading}
            />
        </div>
    );
}

function StudentsPageSkeleton() {
    return (
        <div className="space-y-6">
            <section className="rounded-[32px] border border-border/60 bg-card/80 p-6 shadow-[0_28px_80px_-40px_rgba(0,0,0,0.65)] sm:p-8">
                <div className="grid gap-8 xl:grid-cols-[1.35fr_0.95fr]">
                    <div className="space-y-5">
                        <div className="flex flex-wrap gap-3">
                            <div className="h-8 w-44 animate-pulse rounded-full bg-muted" />
                            <div className="h-8 w-56 animate-pulse rounded-full bg-muted" />
                        </div>
                        <div className="space-y-3">
                            <div className="h-12 w-full max-w-xl animate-pulse rounded bg-muted" />
                            <div className="h-5 w-full max-w-2xl animate-pulse rounded bg-muted" />
                            <div className="h-5 w-4/5 max-w-xl animate-pulse rounded bg-muted" />
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3">
                            <div className="h-24 animate-pulse rounded-[24px] bg-muted" />
                            <div className="h-24 animate-pulse rounded-[24px] bg-muted" />
                            <div className="h-24 animate-pulse rounded-[24px] bg-muted" />
                        </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                        <div className="h-32 animate-pulse rounded-[24px] bg-muted" />
                        <div className="h-32 animate-pulse rounded-[24px] bg-muted" />
                        <div className="h-32 animate-pulse rounded-[24px] bg-muted" />
                    </div>
                </div>
            </section>

            <div className="grid gap-4 lg:grid-cols-3">
                <div className="h-40 animate-pulse rounded-[24px] border border-border/60 bg-muted" />
                <div className="h-40 animate-pulse rounded-[24px] border border-border/60 bg-muted" />
                <div className="h-40 animate-pulse rounded-[24px] border border-border/60 bg-muted" />
            </div>

            <section className="rounded-[28px] border border-border/60 bg-card/80 p-5 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)] sm:p-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="space-y-2">
                        <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                        <div className="h-8 w-72 animate-pulse rounded bg-muted" />
                    </div>
                    <div className="h-11 w-full animate-pulse rounded-2xl bg-muted xl:w-72" />
                </div>

                <div className="mt-5 rounded-[24px] border border-border/60 bg-background/55 p-4">
                    <div className="grid gap-3 md:grid-cols-3">
                        <div className="h-11 animate-pulse rounded-2xl bg-muted" />
                        <div className="h-11 animate-pulse rounded-2xl bg-muted" />
                        <div className="h-11 animate-pulse rounded-2xl bg-muted" />
                    </div>
                    <div className="mt-4 space-y-3">
                        <div className="h-14 animate-pulse rounded-[18px] bg-muted" />
                        <div className="h-14 animate-pulse rounded-[18px] bg-muted" />
                        <div className="h-14 animate-pulse rounded-[18px] bg-muted" />
                        <div className="h-14 animate-pulse rounded-[18px] bg-muted" />
                    </div>
                </div>
            </section>

            <section className="rounded-[28px] border border-border/60 bg-card/80 p-5 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)] sm:p-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                        <div className="h-7 w-64 animate-pulse rounded bg-muted" />
                    </div>
                    <div className="h-10 w-36 animate-pulse rounded-2xl bg-muted" />
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                    <div className="h-10 w-24 animate-pulse rounded-full bg-muted" />
                    <div className="h-10 w-24 animate-pulse rounded-full bg-muted" />
                    <div className="h-10 w-24 animate-pulse rounded-full bg-muted" />
                </div>
            </section>
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
    tone: "sky" | "emerald" | "amber";
}) {
    const toneClass = {
        sky: "border-sky-500/20 bg-sky-500/10 text-sky-500",
        emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
        amber: "border-amber-500/20 bg-amber-500/10 text-amber-500",
    }[tone];

    return (
        <div className={cn("rounded-[24px] border p-4 backdrop-blur-sm", toneClass)}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {label}
            </p>
            <p className="mt-3 text-3xl font-black tracking-tighter">{value}</p>
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
    icon: typeof Users;
    label: string;
    value: string;
    helper: string;
    tone: "sky" | "emerald" | "amber";
}) {
    const toneClass = {
        sky: "border-sky-500/20 bg-sky-500/10 text-sky-500",
        emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
        amber: "border-amber-500/20 bg-amber-500/10 text-amber-500",
    }[tone];

    return (
        <div className="rounded-[24px] border border-border/60 bg-background/70 p-5 backdrop-blur-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        {label}
                    </p>
                    <p className="mt-3 text-3xl font-black tracking-tighter text-foreground">{value}</p>
                </div>
                <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl border", toneClass)}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{helper}</p>
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
    icon: typeof Users;
    label: string;
    value: string;
    helper: string;
    tone: "sky" | "emerald" | "amber";
}) {
    const toneClass = {
        sky: "text-sky-500",
        emerald: "text-emerald-500",
        amber: "text-amber-500",
    }[tone];

    return (
        <div className="rounded-[24px] border border-border/60 bg-card/80 p-5 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)]">
            <div className="flex items-center justify-between gap-3">
                <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl border border-border/60 bg-background/70", toneClass)}>
                    <Icon className="h-5 w-5" />
                </div>
                <p className="text-3xl font-black tracking-tighter text-foreground">{value}</p>
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {label}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{helper}</p>
        </div>
    );
}
