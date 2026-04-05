"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, Mail, Calendar } from "lucide-react";
import { getInitials } from "@/lib/admin/students-utils";

interface AdminUser {
    _id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
}

export function AdminsList() {
    const [admins, setAdmins] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAdmins();
    }, []);

    const fetchAdmins = async () => {
        try {
            // We'll create a simple endpoint for this or reuse students endpoint with filter
            const response = await fetch("/api/admin/students?limit=100");
            const data = await response.json();

            if (data.success) {
                // Filter only admins from the results
                const adminUsers = data.data.students.filter((s: any) => s.role === "admin");
                setAdmins(adminUsers);
            }
        } catch (error) {
            console.error("Error fetching admins:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        <CardTitle>Admin Users</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center gap-3 p-3 rounded-lg border animate-pulse">
                                <div className="h-10 w-10 rounded-full bg-muted" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-32 bg-muted rounded" />
                                    <div className="h-3 w-48 bg-muted rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <CardTitle>Admin Users</CardTitle>
                            <CardDescription>
                                {admins.length} {admins.length === 1 ? "admin" : "admins"} with dashboard access
                            </CardDescription>
                        </div>
                    </div>
                    <Badge variant="secondary" className="text-sm">
                        <UserCheck className="h-3 w-3 mr-1" />
                        {admins.length}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                {admins.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">No admin users found</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {admins.map((admin) => (
                            <div
                                key={admin._id}
                                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                            >
                                <Avatar className="h-10 w-10">
                                    <AvatarFallback className="bg-linear-to-br from-indigo-500 to-purple-600 text-white text-sm font-semibold">
                                        {getInitials(admin.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium text-sm truncate">{admin.name || "Admin User"}</p>
                                        <Badge variant="outline" className="text-xs">
                                            Admin
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                        <span className="flex items-center gap-1">
                                            <Mail className="h-3 w-3" />
                                            {admin.email}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-xs text-muted-foreground text-right hidden sm:block">
                                    <div className="flex items-center gap-1 justify-end">
                                        <Calendar className="h-3 w-3" />
                                        {new Date(admin.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
