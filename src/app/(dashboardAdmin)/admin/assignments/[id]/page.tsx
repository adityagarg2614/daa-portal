'use client';

import axios from 'axios';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import {
    ArrowLeft,
    FileText,
    CalendarDays,
    Clock3,
    Award,
    Trash2,
    Edit,
    BarChart3,
    CheckCircle2,
    AlertCircle,
    Users,
    TrendingUp,
    Code2,
    Eye,
    Loader2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatsCard } from '@/components/ui/stats-card';
import { cn } from '@/lib/utils';

type Problem = {
    _id: string;
    title: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    marks: number;
    tags: string[];
};

type User = {
    _id: string;
    name: string;
    email: string;
    rollNo?: string;
};

type TopPerformer = {
    userId: User | null;
    score?: number;
    status: string;
    submittedAt: string;
};

type SubmissionStats = {
    total: number;
    graded: number;
    pending: number;
    averageScore: number;
    topPerformers: TopPerformer[];
};

type Assignment = {
    _id: string;
    title: string;
    description: string;
    totalProblems: number;
    totalMarks: number;
    publishAt: string;
    dueAt: string;
    problemIds: Problem[];
    createdBy: User | null;
    createdAt: string;
    updatedAt: string;
    submissionStats: SubmissionStats;
};

type AssignmentStatus = 'Upcoming' | 'Active' | 'Expired';

export default function AdminViewAssignmentPage() {
    const params = useParams();
    const router = useRouter();
    const assignmentId = params.id as string;

    const [assignment, setAssignment] = useState<Assignment | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        const fetchAssignment = async () => {
            try {
                setLoading(true);
                setError(null);
                const res = await axios.get(`/api/admin/assignments/${assignmentId}`);

                if (res.data.success) {
                    console.log("[Frontend] Assignment data received:", res.data.data);
                    setAssignment(res.data.data);
                } else {
                    const errorMsg = res.data.message || 'Failed to load assignment';
                    console.error("[Frontend] API returned error:", errorMsg);
                    setError(errorMsg);
                }
            } catch (err: any) {
                console.error('[Frontend] Error fetching assignment:', err);
                console.error('[Frontend] Error response:', err.response?.data);
                const errorMsg = err.response?.data?.message || 'Failed to load assignment';
                setError(errorMsg);
            } finally {
                setLoading(false);
            }
        };

        if (assignmentId) {
            fetchAssignment();
        }
    }, [assignmentId]);

    const getComputedStatus = (assignment: Assignment): AssignmentStatus => {
        const now = new Date();
        const publishAt = new Date(assignment.publishAt);
        const dueAt = new Date(assignment.dueAt);

        if (now < publishAt) return 'Upcoming';
        if (now > dueAt) return 'Expired';
        return 'Active';
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this assignment? This will also delete all related submissions. This action cannot be undone.')) {
            return;
        }

        try {
            setDeleting(true);
            const res = await axios.delete(`/api/admin/assignments/${assignmentId}`);

            if (res.data.success) {
                alert('Assignment deleted successfully');
                router.push('/admin/assignments');
            } else {
                alert(res.data.message || 'Failed to delete assignment');
            }
        } catch (err: any) {
            console.error('Error deleting assignment:', err);
            alert(err.response?.data?.message || 'Failed to delete assignment');
        } finally {
            setDeleting(false);
        }
    };

    const getStatusBadge = (status: AssignmentStatus) => {
        const config = {
            Active: { variant: 'secondary' as const, icon: Clock3, color: 'text-green-600' },
            Upcoming: { variant: 'default' as const, icon: CalendarDays, color: 'text-blue-600' },
            Expired: { variant: 'destructive' as const, icon: AlertCircle, color: 'text-red-600' },
        };

        const { variant, icon: Icon, color } = config[status];

        return (
            <Badge variant={variant} className="gap-1">
                <Icon className="h-3 w-3" />
                {status}
            </Badge>
        );
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'Easy':
                return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
            case 'Medium':
                return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
            case 'Hard':
                return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
            default:
                return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
        }
    };

    if (loading) {
        return (
            <div className="flex flex-1 flex-col gap-6 p-4 pt-2">
                <div className="animate-pulse space-y-6">
                    <div className="h-12 w-48 rounded-lg bg-muted" />
                    <div className="h-64 rounded-2xl bg-muted" />
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-32 rounded-2xl bg-muted" />
                        ))}
                    </div>
                    <div className="h-96 rounded-2xl bg-muted" />
                </div>
            </div>
        );
    }

    if (error || !assignment) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center gap-6 p-4 pt-2">
                <div className="rounded-2xl border border-dashed bg-background p-10 text-center shadow-sm">
                    <AlertCircle className="mx-auto mb-3 h-12 w-12 text-destructive" />
                    <h3 className="text-lg font-semibold">Error Loading Assignment</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                        {error || 'Assignment not found'}
                    </p>
                    <Link href="/admin/assignments">
                        <Button className="mt-4 gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Assignments
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    const status = getComputedStatus(assignment);

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 pt-2">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl border bg-linear-to-br from-background to-muted p-8 shadow-sm">
                <div className="relative z-10">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Link href="/admin/assignments">
                                <Button variant="outline" size="icon" className="h-10 w-10">
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                            </Link>
                            <div>
                                <div className="flex items-center gap-3">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
                                        <FileText className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold tracking-tight">
                                            {assignment.title}
                                        </h1>
                                        <p className="text-sm text-muted-foreground">
                                            Assignment Details
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Link href={`/admin/assignments/create?id=${assignment._id}`}>
                                <Button variant="outline" className="gap-2">
                                    <Edit className="h-4 w-4" />
                                    Edit
                                </Button>
                            </Link>
                            <Button
                                variant="destructive"
                                className="gap-2"
                                onClick={handleDelete}
                                disabled={deleting}
                            >
                                {deleting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Trash2 className="h-4 w-4" />
                                )}
                                Delete
                            </Button>
                        </div>
                    </div>
                </div>
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/5 blur-3xl" />
                <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-primary/5 blur-3xl" />
            </div>

            {/* Status and Description */}
            <div className="rounded-2xl border bg-background p-6 shadow-sm">
                <div className="mb-4 flex flex-wrap items-center gap-3">
                    {getStatusBadge(status)}
                    <Badge variant="outline" className="gap-1">
                        <Award className="h-3 w-3" />
                        {assignment.totalMarks} Marks
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                        <FileText className="h-3 w-3" />
                        {assignment.totalProblems} Problems
                    </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{assignment.description}</p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatsCard
                    icon={FileText}
                    title="Total Problems"
                    value={assignment.totalProblems}
                />
                <StatsCard
                    icon={Award}
                    title="Total Marks"
                    value={assignment.totalMarks}
                />
                <StatsCard
                    icon={Users}
                    title="Total Submissions"
                    value={assignment.submissionStats.total}
                />
                <StatsCard
                    icon={TrendingUp}
                    title="Average Score"
                    value={`${assignment.submissionStats.averageScore}%`}
                />
            </div>

            {/* Assignment Details Grid */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Dates Card */}
                <div className="rounded-2xl border bg-background p-6 shadow-sm">
                    <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                        <CalendarDays className="h-5 w-5 text-primary" />
                        Important Dates
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between rounded-lg bg-muted p-3">
                            <span className="text-sm font-medium">Publish Date</span>
                            <span className="text-sm text-muted-foreground">
                                {new Date(assignment.publishAt).toLocaleString()}
                            </span>
                        </div>
                        <div className="flex items-center justify-between rounded-lg bg-muted p-3">
                            <span className="text-sm font-medium">Due Date</span>
                            <span className="text-sm text-muted-foreground">
                                {new Date(assignment.dueAt).toLocaleString()}
                            </span>
                        </div>
                        <div className="flex items-center justify-between rounded-lg bg-muted p-3">
                            <span className="text-sm font-medium">Created At</span>
                            <span className="text-sm text-muted-foreground">
                                {new Date(assignment.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Problems Card */}
                <div className="rounded-2xl border bg-background p-6 shadow-sm">
                    <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                        <Code2 className="h-5 w-5 text-primary" />
                        Problems ({assignment.problemIds?.length || 0})
                    </h3>
                    <div className="space-y-3">
                        {assignment.problemIds && assignment.problemIds.length > 0 ? (
                            assignment.problemIds.map((problem, index) => (
                                <div
                                    key={problem._id}
                                    className="rounded-lg border bg-muted p-4 transition-all hover:shadow-md"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">
                                                    {index + 1}. {problem.title}
                                                </span>
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        'text-xs',
                                                        getDifficultyColor(problem.difficulty)
                                                    )}
                                                >
                                                    {problem.difficulty}
                                                </Badge>
                                            </div>
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {problem.tags && problem.tags.map((tag, idx) => (
                                                    <Badge key={idx} variant="secondary" className="text-xs">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 text-sm font-semibold text-primary">
                                            <Award className="h-4 w-4" />
                                            {problem.marks}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-sm text-muted-foreground">
                                No problems added
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Submission Statistics */}
            <div className="rounded-2xl border bg-background p-6 shadow-sm">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Submission Statistics
                </h3>
                <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            <span className="text-sm font-medium">Graded</span>
                        </div>
                        <p className="mt-2 text-3xl font-bold text-green-600">
                            {assignment.submissionStats.graded}
                        </p>
                    </div>
                    <div className="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20">
                        <div className="flex items-center gap-2">
                            <Clock3 className="h-5 w-5 text-yellow-600" />
                            <span className="text-sm font-medium">Pending</span>
                        </div>
                        <p className="mt-2 text-3xl font-bold text-yellow-600">
                            {assignment.submissionStats.pending}
                        </p>
                    </div>
                    <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                        <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-blue-600" />
                            <span className="text-sm font-medium">Total</span>
                        </div>
                        <p className="mt-2 text-3xl font-bold text-blue-600">
                            {assignment.submissionStats.total}
                        </p>
                    </div>
                </div>
            </div>

            {/* Top Performers */}
            {assignment.submissionStats.topPerformers.length > 0 && (
                <div className="rounded-2xl border bg-background p-6 shadow-sm">
                    <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        Top Performers
                    </h3>
                    <div className="space-y-3">
                        {assignment.submissionStats.topPerformers.map((performer, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between rounded-lg border bg-muted p-4"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <p className="font-medium">
                                            {performer.userId?.name || 'Anonymous'}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {performer.userId?.rollNo || 'N/A'} •{' '}
                                            {performer.userId?.email || 'N/A'}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-primary">
                                        {performer.score ?? 0}%
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {new Date(performer.submittedAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
                <Link href="/admin/assignments">
                    <Button variant="outline" className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Assignments
                    </Button>
                </Link>
                <Link href={`/admin/assignments/create?id=${assignment._id}`}>
                    <Button className="gap-2">
                        <Edit className="h-4 w-4" />
                        Edit Assignment
                    </Button>
                </Link>
            </div>
        </div>
    );
}
