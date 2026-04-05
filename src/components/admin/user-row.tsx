"use client";

import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, UserCog, Trash2, Shield, User } from "lucide-react";
import { getInitials, getAvatarColor, getRoleVariant, formatDate } from "@/lib/admin/users-utils";
import { cn } from "@/lib/utils";

interface User {
    _id: string;
    name: string | null;
    email: string | null;
    role: "admin" | "student";
    rollNo: string | null;
    clerkId: string;
    createdAt: string;
}

interface UserRowProps {
    user: User;
    onViewDetails: (userId: string) => void;
    onChangeRole: (userId: string, user: User) => void;
    onDelete: (userId: string, user: User) => void;
}

export function UserRow({ user, onViewDetails, onChangeRole, onDelete }: UserRowProps) {
    const displayName = user.name || "Unnamed User";
    const initials = getInitials(displayName);
    const avatarColor = getAvatarColor(displayName);
    const roleVariant = getRoleVariant(user.role);

    return (
        <TableRow className="hover:bg-muted/50 transition-colors">
            <TableCell>
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white shrink-0",
                        avatarColor
                    )}>
                        {initials}
                    </div>
                    <div className="flex flex-col">
                        <span className="font-medium">{displayName}</span>
                        <span className="text-xs text-muted-foreground md:hidden">{user.email}</span>
                    </div>
                </div>
            </TableCell>

            <TableCell className="hidden md:table-cell">
                <span className="text-sm">{user.email || "N/A"}</span>
            </TableCell>

            <TableCell>
                <Badge variant={roleVariant} className="gap-1.5">
                    {user.role === "admin" ? (
                        <Shield className="h-3 w-3" />
                    ) : (
                        <User className="h-3 w-3" />
                    )}
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </Badge>
            </TableCell>

            <TableCell className="hidden md:table-cell">
                <span className="text-sm font-mono">
                    {user.rollNo || <span className="text-muted-foreground">—</span>}
                </span>
            </TableCell>

            <TableCell className="hidden lg:table-cell">
                <span className="text-sm text-muted-foreground">
                    {formatDate(user.createdAt)}
                </span>
            </TableCell>

            <TableCell className="text-right">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onViewDetails(user._id)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onChangeRole(user._id, user)}>
                            <UserCog className="mr-2 h-4 w-4" />
                            Change Role
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => onDelete(user._id, user)}
                            className="text-destructive focus:text-destructive focus:bg-destructive/10"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete User
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </TableCell>
        </TableRow>
    );
}
