"use client";

import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from "@/components/ui/table";
import { UserRow } from "./user-row";

interface User {
    _id: string;
    name: string | null;
    email: string | null;
    role: "admin" | "student";
    rollNo: string | null;
    clerkId: string;
    createdAt: string;
}

interface UsersTableProps {
    users: User[];
    onViewDetails: (userId: string) => void;
    onChangeRole: (userId: string, user: User) => void;
    onDelete: (userId: string, user: User) => void;
}

export function UsersTable({ users, onViewDetails, onChangeRole, onDelete }: UsersTableProps) {
    return (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/50">
                        <TableHead className="h-12 font-semibold">User</TableHead>
                        <TableHead className="h-12 font-semibold">Email</TableHead>
                        <TableHead className="h-12 font-semibold">Role</TableHead>
                        <TableHead className="h-12 font-semibold hidden md:table-cell">Roll Number</TableHead>
                        <TableHead className="h-12 font-semibold hidden lg:table-cell">Created At</TableHead>
                        <TableHead className="h-12 font-semibold text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.length === 0 ? (
                        <TableRow className="hover:bg-transparent">
                            <TableCell colSpan={6} className="h-32 text-center">
                                <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                    <p className="text-sm">No users found</p>
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : (
                        users.map((user) => (
                            <UserRow
                                key={user._id}
                                user={user}
                                onViewDetails={onViewDetails}
                                onChangeRole={onChangeRole}
                                onDelete={onDelete}
                            />
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
