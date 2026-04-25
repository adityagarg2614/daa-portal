"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { UsersTable } from "@/components/admin/users-table";
import { UsersFilters } from "@/components/admin/users-filters";
import { UsersPagination } from "@/components/admin/users-pagination";
import { UserDetailDialog } from "@/components/admin/user-detail-dialog";
import { UserRoleDialog } from "@/components/admin/user-role-dialog";
import { CreateUserDialog } from "@/components/admin/create-user-dialog";
import { SendEmailDialog } from "@/components/admin/send-email-dialog";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
    GraduationCap,
    Search,
    Shield,
    Sparkles,
    UserPlus,
    Users,
    UserCog,
    Trophy,
    ShieldCheck,
} from "lucide-react";

interface User {
    _id: string;
    name: string | null;
    email: string | null;
    role: "admin" | "student";
    rollNo: string | null;
    clerkId: string;
    createdAt: string;
}

interface UserDetail {
    _id: string;
    name: string | null;
    email: string | null;
    role: "admin" | "student";
    rollNo: string | null;
    clerkId: string;
    createdAt: string;
    updatedAt: string;
    totalSubmissions?: number;
    totalScore?: number;
    averageScore?: number;
}

interface PaginationData {
    currentPage: number;
    totalPages: number;
    totalUsers: number;
    hasNext: boolean;
    hasPrev: boolean;
}

export default function UsersManagementPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [pagination, setPagination] = useState<PaginationData>({
        currentPage: 1,
        totalPages: 0,
        totalUsers: 0,
        hasNext: false,
        hasPrev: false,
    });
    const [initialLoading, setInitialLoading] = useState(true);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "student">("all");
    const [sortBy, setSortBy] = useState("createdAt");
    const [order, setOrder] = useState("desc");
    const [limit, setLimit] = useState(20);

    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [roleDialogOpen, setRoleDialogOpen] = useState(false);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const [emailDialogOpen, setEmailDialogOpen] = useState(false);
    const [pendingEmailData, setPendingEmailData] = useState<{
        name: string;
        email: string;
        password: string;
        role: "admin" | "student";
        rollNo?: string;
    } | null>(null);

    const [userCounts, setUserCounts] = useState({
        all: 0,
        admin: 0,
        student: 0,
    });

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: pagination.currentPage.toString(),
                limit: limit.toString(),
                search,
                role: roleFilter,
                sortBy,
                order,
            });

            const response = await fetch(`/api/admin/users?${params}`);
            const data = await response.json();

            if (data.success) {
                setUsers(data.data.users);
                setPagination(data.data.pagination);
                setUserCounts((prev) => ({
                    ...prev,
                    all: data.data.pagination.totalUsers,
                }));
            } else {
                toast.error(data.message || "Failed to fetch users");
            }
        } catch (error) {
            console.error("Error fetching users:", error);
            toast.error("Failed to fetch users data");
        } finally {
            setLoading(false);
            setInitialLoading(false);
        }
    }, [pagination.currentPage, limit, search, roleFilter, sortBy, order]);

    const fetchUserCounts = useCallback(async () => {
        try {
            const [adminRes, studentRes] = await Promise.all([
                fetch("/api/admin/users?role=admin&limit=1"),
                fetch("/api/admin/users?role=student&limit=1"),
            ]);

            const adminData = await adminRes.json();
            const studentData = await studentRes.json();

            setUserCounts({
                all: pagination.totalUsers,
                admin: adminData.success ? adminData.data.pagination.totalUsers : 0,
                student: studentData.success ? studentData.data.pagination.totalUsers : 0,
            });
        } catch (error) {
            console.error("Error fetching user counts:", error);
        }
    }, [pagination.totalUsers]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            void fetchUsers();
        }, 0);

        return () => window.clearTimeout(timer);
    }, [fetchUsers]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            void fetchUserCounts();
        }, 0);

        return () => window.clearTimeout(timer);
    }, [fetchUserCounts]);

    const fetchUserDetail = async (userId: string) => {
        setDetailLoading(true);
        try {
            const response = await fetch(`/api/admin/users/${userId}`);
            const data = await response.json();

            if (data.success) {
                setUserDetail(data.data);
                setDetailDialogOpen(true);
            } else {
                toast.error(data.message || "Failed to fetch user details");
            }
        } catch (error) {
            console.error("Error fetching user detail:", error);
            toast.error("Failed to fetch user details");
        } finally {
            setDetailLoading(false);
        }
    };

    const handleViewDetails = (userId: string) => {
        setSelectedUserId(userId);
        void fetchUserDetail(userId);
    };

    const handleChangeRole = (userId: string, user: User) => {
        setSelectedUserId(userId);
        setSelectedUser(user);
        setRoleDialogOpen(true);
    };

    const handleDelete = (userId: string, user: User) => {
        setSelectedUserId(userId);
        setSelectedUser(user);
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedUserId) return;

        try {
            const response = await fetch(`/api/admin/users/${selectedUserId}`, {
                method: "DELETE",
            });

            const data = await response.json();

            if (data.success) {
                toast.success(data.message || "User deleted successfully");
                void fetchUsers();
                setDeleteDialogOpen(false);
            } else {
                toast.error(data.message || "Failed to delete user");
            }
        } catch (error) {
            console.error("Error deleting user:", error);
            toast.error("Failed to delete user");
        }
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

    const handleRoleFilterChange = (newRole: string) => {
        setRoleFilter(newRole as "all" | "admin" | "student");
        setPagination((prev) => ({ ...prev, currentPage: 1 }));
    };

    const handleRoleUpdateSuccess = () => {
        void fetchUsers();
        setRoleDialogOpen(false);
    };

    const handleCreateSuccess = () => {
        void fetchUsers();
    };

    const handleUserCreated = (userData: {
        name: string;
        email: string;
        password: string;
        role: "admin" | "student";
        rollNo?: string;
    }) => {
        setPendingEmailData(userData);
        setEmailDialogOpen(true);
    };

    const handleEmailSent = () => {
        setPendingEmailData(null);
    };

    const handleEmailSkipped = () => {
        setPendingEmailData(null);
    };

    const handleDetailDialogClose = () => {
        setDetailDialogOpen(false);
        setUserDetail(null);
    };

    const insights = useMemo(() => {
        const adminsVisible = users.filter((user) => user.role === "admin").length;
        const studentsVisible = users.filter((user) => user.role === "student").length;
        const newestUser = users.length > 0 ? [...users].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))[0] : null;
        const activeTone =
            search.trim().length > 0
                ? `Showing filtered results for "${search}".`
                : roleFilter !== "all"
                    ? `Viewing only ${roleFilter} records right now.`
                    : pagination.totalUsers > 0
                        ? "Manage roles, open detail dialogs, and keep account access organized."
                        : "User records will appear here once accounts are created.";

        return {
            adminsVisible,
            studentsVisible,
            newestUser,
            activeTone,
        };
    }, [users, search, roleFilter, pagination.totalUsers]);

    const pageRange = useMemo(() => {
        if (pagination.totalUsers === 0) {
            return { start: 0, end: 0 };
        }

        const start = (pagination.currentPage - 1) * limit + 1;
        const end = Math.min(pagination.currentPage * limit, pagination.totalUsers);

        return { start, end };
    }, [pagination.currentPage, pagination.totalUsers, limit]);

    if (initialLoading) {
        return (
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-8 pt-2 sm:px-6 xl:px-8">
                <UsersHeroSkeleton />
                <div className="grid gap-4 lg:grid-cols-3">
                    <MetricSkeleton />
                    <MetricSkeleton />
                    <MetricSkeleton />
                </div>
                <div className="rounded-[28px] border border-border/60 bg-card/80 p-5 shadow-sm sm:p-6">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                        <div className="space-y-2">
                            <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                            <div className="h-8 w-72 animate-pulse rounded bg-muted" />
                        </div>
                        <div className="h-11 w-full animate-pulse rounded-2xl bg-muted xl:w-80" />
                    </div>
                </div>
                <div className="rounded-[28px] border border-border/60 bg-card/80 p-5 shadow-sm sm:p-6">
                    <div className="space-y-3">
                        <div className="h-10 animate-pulse rounded bg-muted" />
                        <div className="h-10 animate-pulse rounded bg-muted" />
                        <div className="h-10 animate-pulse rounded bg-muted" />
                        <div className="h-10 animate-pulse rounded bg-muted" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-8 pt-2 sm:px-6 xl:px-8">
            <section className="relative overflow-hidden rounded-[32px] border border-border/60 bg-linear-to-br from-card via-card to-violet-500/8 shadow-[0_28px_80px_-40px_rgba(0,0,0,0.65)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.14),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.12),transparent_30%)]" />
                <div className="relative grid gap-8 px-5 py-6 sm:px-7 sm:py-7 xl:grid-cols-[1.35fr_0.95fr] xl:px-8">
                    <div className="space-y-6">
                        <div className="flex flex-wrap items-center gap-3">
                            <Badge className="rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-violet-500 shadow-none">
                                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                                User Management
                            </Badge>
                            <Badge variant="outline" className="rounded-full px-3 py-1">
                                <UserCog className="mr-1.5 h-3.5 w-3.5" />
                                Admin and student account control
                            </Badge>
                        </div>

                        <div className="space-y-3">
                            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                                Manage Accounts
                            </h1>
                            <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                                Manage all registered users and handle access changes from one cleaner account management workspace.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                                    Access Signal
                                </p>
                                <div className="mt-2 flex flex-wrap items-end gap-3">
                                    <span className="text-5xl font-black leading-none tracking-[-0.06em] text-violet-500">
                                        {pagination.totalUsers}
                                    </span>
                                    <div className="mb-1 rounded-2xl border border-border/60 bg-background/70 px-3 py-2 text-sm text-muted-foreground backdrop-blur">
                                        {insights.activeTone}
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-3">
                                <HeroChip label="Visible" value={String(users.length)} tone="sky" />
                                <HeroChip label="Admins" value={String(userCounts.admin)} tone="violet" />
                                <HeroChip label="Students" value={String(userCounts.student)} tone="emerald" />
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                        <SummaryPanel
                            icon={Users}
                            label="Total Users"
                            value={String(pagination.totalUsers)}
                            helper="All registered admin and student accounts"
                            tone="sky"
                        />
                        <SummaryPanel
                            icon={ShieldCheck}
                            label="Admin Access"
                            value={String(userCounts.admin)}
                            helper="Accounts with elevated admin capabilities"
                            tone="violet"
                        />
                        <SummaryPanel
                            icon={Trophy}
                            label="Newest Visible"
                            value={insights.newestUser?.name || "N/A"}
                            helper={
                                insights.newestUser
                                    ? `${new Date(insights.newestUser.createdAt).toLocaleDateString()} joined`
                                    : "No visible users on this page"
                            }
                            tone="amber"
                        />
                    </div>
                </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
                <SnapshotCard
                    icon={Users}
                    label="Accounts"
                    value={String(pagination.totalUsers)}
                    helper="Total platform user records"
                    tone="sky"
                />
                <SnapshotCard
                    icon={Shield}
                    label="Admin Users"
                    value={String(userCounts.admin)}
                    helper="Accounts with management access"
                    tone="violet"
                />
                <SnapshotCard
                    icon={GraduationCap}
                    label="Student Users"
                    value={String(userCounts.student)}
                    helper="Enrolled learner accounts"
                    tone="emerald"
                />
            </section>

            <section className="rounded-[28px] border border-border/60 bg-card/80 p-5 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)] backdrop-blur-sm sm:p-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="space-y-1.5">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                            Explore Users
                        </p>
                        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                            Search, filter, sort, and create accounts from one control surface
                        </h2>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3 text-sm text-muted-foreground">
                            Showing {pageRange.start} to {pageRange.end} of {pagination.totalUsers}
                        </div>
                        <Button
                            onClick={() => setCreateDialogOpen(true)}
                            className="h-11 rounded-2xl gap-2"
                        >
                            <UserPlus className="h-4 w-4" />
                            Create User
                        </Button>
                    </div>
                </div>

                <div className="mt-5">
                    <UsersFilters
                        searchValue={search}
                        onSearchChange={handleSearchChange}
                        onSortChange={handleSortChange}
                        onRoleFilterChange={handleRoleFilterChange}
                        users={users}
                        roleFilter={roleFilter}
                        userCounts={userCounts}
                    />
                </div>
            </section>

            <section className="rounded-[28px] border border-border/60 bg-card/80 p-3 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)] sm:p-4">
                <div className="mb-3 flex flex-col gap-3 rounded-[22px] border border-border/60 bg-background/55 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                            Account List
                        </p>
                        <h2 className="mt-1 text-lg font-semibold tracking-tight">
                            Review account status and open management actions
                        </h2>
                    </div>
                    <div className="flex items-center gap-2 rounded-full border border-border/60 bg-background px-3 py-1.5 text-sm text-muted-foreground">
                        <Search className="h-4 w-4" />
                        Details, roles, and deletion actions available
                    </div>
                </div>

                <UsersTable
                    users={users}
                    onViewDetails={handleViewDetails}
                    onChangeRole={handleChangeRole}
                    onDelete={handleDelete}
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
                                Move across the full user directory
                            </h2>
                        </div>
                        <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3 text-sm text-muted-foreground">
                            Page {pagination.currentPage} of {pagination.totalPages}
                        </div>
                    </div>

                    <div className="mt-5">
                        <UsersPagination
                            currentPage={pagination.currentPage}
                            totalPages={pagination.totalPages}
                            totalUsers={pagination.totalUsers}
                            onPageChange={handlePageChange}
                            onLimitChange={handleLimitChange}
                            currentLimit={limit}
                        />
                    </div>
                </section>
            )}

            <UserDetailDialog
                open={detailDialogOpen}
                onOpenChange={handleDetailDialogClose}
                userData={userDetail}
                isLoading={detailLoading}
                onChangeRole={(userId) => {
                    const user = users.find((u) => u._id === userId);
                    if (user) {
                        handleDetailDialogClose();
                        handleChangeRole(userId, user);
                    }
                }}
                onDelete={(userId) => {
                    const user = users.find((u) => u._id === userId);
                    if (user) {
                        handleDetailDialogClose();
                        handleDelete(userId, user);
                    }
                }}
            />

            <UserRoleDialog
                open={roleDialogOpen}
                onOpenChange={setRoleDialogOpen}
                userId={selectedUserId}
                userName={selectedUser?.name || "Unknown User"}
                currentRole={selectedUser?.role || "student"}
                onSuccess={handleRoleUpdateSuccess}
            />

            <CreateUserDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onSuccess={handleCreateSuccess}
                onUserCreated={handleUserCreated}
            />

            <SendEmailDialog
                open={emailDialogOpen}
                onOpenChange={setEmailDialogOpen}
                userData={pendingEmailData}
                onSuccess={handleEmailSent}
                onSkip={handleEmailSkipped}
            />

            <ConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={handleConfirmDelete}
                title="Delete User"
                description={
                    selectedUser
                        ? `Are you sure you want to delete "${selectedUser.name || selectedUser.email}"? This action cannot be undone and will remove the user from both the system and authentication provider.`
                        : "Are you sure you want to delete this user?"
                }
                confirmText="Delete User"
                cancelText="Cancel"
                variant="destructive"
            />
        </div>
    );
}

function UsersHeroSkeleton() {
    return (
        <section className="rounded-[32px] border border-border/60 bg-card/80 p-6 shadow-[0_28px_80px_-40px_rgba(0,0,0,0.65)] sm:p-8">
            <div className="grid gap-8 xl:grid-cols-[1.35fr_0.95fr]">
                <div className="space-y-5">
                    <div className="h-8 w-40 animate-pulse rounded-full bg-muted" />
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
    );
}

function MetricSkeleton() {
    return <div className="h-40 animate-pulse rounded-[24px] border border-border/60 bg-muted" />;
}

function HeroChip({
    label,
    value,
    tone,
}: {
    label: string;
    value: string;
    tone: "sky" | "violet" | "emerald";
}) {
    const toneClass = {
        sky: "border-sky-500/20 bg-sky-500/10 text-sky-500",
        violet: "border-violet-500/20 bg-violet-500/10 text-violet-500",
        emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
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
    tone: "sky" | "violet" | "amber";
}) {
    const toneClass = {
        sky: "border-sky-500/20 bg-sky-500/10 text-sky-500",
        violet: "border-violet-500/20 bg-violet-500/10 text-violet-500",
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
    tone: "sky" | "violet" | "emerald";
}) {
    const toneClass = {
        sky: "text-sky-500",
        violet: "text-violet-500",
        emerald: "text-emerald-500",
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
