"use client";

import { useState, useEffect, useCallback } from "react";
import { SectionHeader } from "@/components/ui/section-header";
import { StatsCard } from "@/components/ui/stats-card";
import { UsersTable } from "@/components/admin/users-table";
import { UsersFilters } from "@/components/admin/users-filters";
import { UsersPagination } from "@/components/admin/users-pagination";
import { UserDetailDialog } from "@/components/admin/user-detail-dialog";
import { UserRoleDialog } from "@/components/admin/user-role-dialog";
import { CreateUserDialog } from "@/components/admin/create-user-dialog";
import { SendEmailDialog } from "@/components/admin/send-email-dialog";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Users, Shield, GraduationCap, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "student">("all");
    const [sortBy, setSortBy] = useState("createdAt");
    const [order, setOrder] = useState("desc");
    const [limit, setLimit] = useState(20);

    // Dialog states
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [roleDialogOpen, setRoleDialogOpen] = useState(false);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    // Email dialog state
    const [emailDialogOpen, setEmailDialogOpen] = useState(false);
    const [pendingEmailData, setPendingEmailData] = useState<{
        name: string;
        email: string;
        password: string;
        role: "admin" | "student";
        rollNo?: string;
    } | null>(null);

    // User counts by role
    const [userCounts, setUserCounts] = useState({
        all: 0,
        admin: 0,
        student: 0,
    });

    // Fetch users
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
                setUserCounts({
                    all: data.data.pagination.totalUsers,
                    admin: 0,
                    student: 0,
                });
            } else {
                toast.error(data.message || "Failed to fetch users");
            }
        } catch (error) {
            console.error("Error fetching users:", error);
            toast.error("Failed to fetch users data");
        } finally {
            setLoading(false);
        }
    }, [pagination.currentPage, limit, search, roleFilter, sortBy, order]);

    // Fetch user counts for all roles
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
        fetchUsers();
    }, [fetchUsers]);

    useEffect(() => {
        fetchUserCounts();
    }, [fetchUserCounts, pagination.totalUsers]);

    // Fetch user detail
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

    // Handlers
    const handleViewDetails = (userId: string) => {
        setSelectedUserId(userId);
        fetchUserDetail(userId);
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
                fetchUsers();
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
        fetchUsers();
        setRoleDialogOpen(false);
    };

    const handleCreateSuccess = () => {
        fetchUsers();
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

    // Calculate stats
    const adminCount = userCounts.admin;
    const studentCount = userCounts.student;

    return (
        <div className="space-y-6 pb-8">
            {/* Header */}
            <SectionHeader
                title="User Management"
                description="View and manage all users (admins and students)"
                icon={Users}
                action={
                    <Button
                        onClick={() => setCreateDialogOpen(true)}
                        className="gap-2"
                    >
                        <UserPlus className="h-4 w-4" />
                        Create User
                    </Button>
                }
            />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatsCard
                    icon={Users}
                    title="Total Users"
                    value={pagination.totalUsers}
                    subtitle="All registered users"
                />
                <StatsCard
                    icon={Shield}
                    title="Admins"
                    value={adminCount}
                    subtitle="Users with admin access"
                />
                <StatsCard
                    icon={GraduationCap}
                    title="Students"
                    value={studentCount}
                    subtitle="Enrolled students"
                />
            </div>

            {/* Filters */}
            <UsersFilters
                onSearchChange={handleSearchChange}
                onSortChange={handleSortChange}
                onRoleFilterChange={handleRoleFilterChange}
                users={users}
                roleFilter={roleFilter}
                userCounts={userCounts}
            />

            {/* Table */}
            <UsersTable
                users={users}
                onViewDetails={handleViewDetails}
                onChangeRole={handleChangeRole}
                onDelete={handleDelete}
            />

            {/* Pagination */}
            {!loading && pagination.totalPages > 1 && (
                <UsersPagination
                    currentPage={pagination.currentPage}
                    totalPages={pagination.totalPages}
                    totalUsers={pagination.totalUsers}
                    onPageChange={handlePageChange}
                    onLimitChange={handleLimitChange}
                    currentLimit={limit}
                />
            )}

            {/* Detail Dialog */}
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

            {/* Role Dialog */}
            <UserRoleDialog
                open={roleDialogOpen}
                onOpenChange={setRoleDialogOpen}
                userId={selectedUserId}
                userName={selectedUser?.name || "Unknown User"}
                currentRole={selectedUser?.role || "student"}
                onSuccess={handleRoleUpdateSuccess}
            />

            {/* Create User Dialog */}
            <CreateUserDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onSuccess={handleCreateSuccess}
                onUserCreated={handleUserCreated}
            />

            {/* Send Welcome Email Dialog */}
            <SendEmailDialog
                open={emailDialogOpen}
                onOpenChange={setEmailDialogOpen}
                userData={pendingEmailData}
                onSuccess={handleEmailSent}
                onSkip={handleEmailSkipped}
            />

            {/* Delete Confirmation Dialog */}
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
