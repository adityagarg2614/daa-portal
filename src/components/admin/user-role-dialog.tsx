"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { FormField } from "@/components/ui/form-field";
import { Alert } from "@/components/ui/alert";
import { UserCog, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface UserRoleDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    userId: string | null;
    userName: string;
    currentRole: "admin" | "student";
    onSuccess: () => void;
}

export function UserRoleDialog({
    open,
    onOpenChange,
    userId,
    userName,
    currentRole,
    onSuccess,
}: UserRoleDialogProps) {
    const [newRole, setNewRole] = useState<"admin" | "student">(currentRole);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async () => {
        if (!userId) return;

        if (newRole === currentRole) {
            setError("New role is the same as current role");
            return;
        }

        try {
            setLoading(true);
            setError("");

            const response = await fetch(`/api/admin/users/${userId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role: newRole }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success(data.message || "User role updated successfully");
                onSuccess();
                onOpenChange(false);
            } else {
                setError(data.message || "Failed to update user role");
            }
        } catch (err) {
            setError("Failed to update user role");
            console.error("Error updating user role:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenChange = (open: boolean) => {
        onOpenChange(open);
        if (!open) {
            setNewRole(currentRole);
            setError("");
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserCog className="h-5 w-5 text-primary" />
                        Change User Role
                    </DialogTitle>
                    <DialogDescription>
                        Update the role for <strong>{userName}</strong>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <FormField
                        label="New Role"
                        required
                        hint="Select the new role for this user"
                    >
                        <Select value={newRole} onValueChange={(val) => setNewRole(val as "admin" | "student")}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="student">Student</SelectItem>
                            </SelectContent>
                        </Select>
                    </FormField>

                    <div className="rounded-lg border bg-yellow-500/10 p-3 text-sm">
                        <div className="flex gap-2">
                            <AlertTriangle className="mt-0.5 h-4 w-4 text-yellow-600 shrink-0" />
                            <div className="text-yellow-800">
                                <p className="font-medium">Warning</p>
                                <p className="mt-1 text-yellow-700">
                                    {newRole === "admin"
                                        ? "Granting admin access will give this user full control over the system, including managing users, assignments, and problems."
                                        : "Removing admin access may limit this user's ability to manage the system. Ensure at least one admin account remains."}
                                </p>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <Alert variant="destructive">{error}</Alert>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => handleOpenChange(false)}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading || newRole === currentRole}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Updating...
                            </>
                        ) : (
                            "Update Role"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
