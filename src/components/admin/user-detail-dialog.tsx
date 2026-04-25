"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    User,
    Mail,
    Shield,
    GraduationCap,
    Calendar,
    Hash,
    Activity,
    TrendingUp,
    Award,
    UserCog,
    Trash2,
} from "lucide-react";
import { getInitials, getAvatarColor, getRoleVariant, formatDateTime } from "@/lib/admin/users-utils";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

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

interface UserDetailDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    userData: UserDetail | null;
    isLoading: boolean;
    onChangeRole?: (userId: string) => void;
    onDelete?: (userId: string) => void;
}

export function UserDetailDialog({
    open,
    onOpenChange,
    userData,
    isLoading,
    onChangeRole,
    onDelete,
}: UserDetailDialogProps) {
    if (!userData && !isLoading) return null;

    const displayName = userData?.name || "Unnamed User";
    const initials = getInitials(displayName);
    const avatarColor = getAvatarColor(displayName);
    const roleVariant = getRoleVariant(userData?.role || "student");

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                        {isLoading ? (
                            <Skeleton className="h-12 w-12 rounded-full" />
                        ) : (
                            <div className={cn(
                                "flex h-12 w-12 items-center justify-center rounded-full text-base font-semibold text-white",
                                avatarColor
                            )}>
                                {initials}
                            </div>
                        )}
                        <div>
                            {isLoading ? (
                                <Skeleton className="h-6 w-40" />
                            ) : (
                                <>
                                    <span>{displayName}</span>
                                    <Badge variant={roleVariant} className="ml-2">
                                        {userData?.role === "admin" ? (
                                            <Shield className="mr-1 h-3 w-3" />
                                        ) : (
                                            <GraduationCap className="mr-1 h-3 w-3" />
                                        )}
                                        {userData?.role
                                            ? userData.role.charAt(0).toUpperCase() + userData.role.slice(1)
                                            : "Unknown"}
                                    </Badge>
                                </>
                            )}
                        </div>
                    </DialogTitle>
                    <DialogDescription>
                        {isLoading ? <Skeleton className="h-4 w-60" /> : "User profile and activity details"}
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                    </div>
                ) : userData ? (
                    <div className="space-y-6">
                        {/* Basic Information */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                Basic Information
                            </h3>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="flex items-start gap-3 rounded-lg border p-4">
                                    <User className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Name</p>
                                        <p className="font-medium">{userData.name || "N/A"}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 rounded-lg border p-4">
                                    <Mail className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Email</p>
                                        <p className="font-medium">{userData.email || "N/A"}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 rounded-lg border p-4">
                                    <Hash className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Clerk ID</p>
                                        <p className="font-mono text-xs">{userData.clerkId}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 rounded-lg border p-4">
                                    <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Created At</p>
                                        <p className="font-medium">{formatDateTime(userData.createdAt)}</p>
                                    </div>
                                </div>
                                {userData.role === "student" && (
                                    <div className="flex items-start gap-3 rounded-lg border p-4">
                                        <GraduationCap className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Roll Number</p>
                                            <p className="font-mono font-medium">{userData.rollNo || "N/A"}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <Separator />

                        {/* Student Stats (if applicable) */}
                        {userData.role === "student" && (
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                    Activity & Performance
                                </h3>
                                <div className="grid gap-4 sm:grid-cols-3">
                                    <div className="rounded-lg border bg-muted/30 p-4 text-center">
                                        <Activity className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
                                        <p className="text-2xl font-bold">{userData.totalSubmissions || 0}</p>
                                        <p className="text-xs text-muted-foreground">Total Submissions</p>
                                    </div>
                                    <div className="rounded-lg border bg-muted/30 p-4 text-center">
                                        <TrendingUp className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
                                        <p className="text-2xl font-bold">{userData.totalScore || 0}</p>
                                        <p className="text-xs text-muted-foreground">Total Score</p>
                                    </div>
                                    <div className="rounded-lg border bg-muted/30 p-4 text-center">
                                        <Award className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
                                        <p className="text-2xl font-bold">{userData.averageScore || 0}%</p>
                                        <p className="text-xs text-muted-foreground">Average Score</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <Separator />

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                            {onChangeRole && (
                                <Button
                                    onClick={() => onChangeRole(userData._id)}
                                    variant="outline"
                                    className="gap-2"
                                >
                                    <UserCog className="h-4 w-4" />
                                    Change Role
                                </Button>
                            )}
                            {onDelete && (
                                <Button
                                    onClick={() => onDelete(userData._id)}
                                    variant="outline"
                                    className="gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Delete User
                                </Button>
                            )}
                        </div>
                    </div>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}
