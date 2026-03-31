"use client";

import { SectionHeader } from "@/components/ui/section-header";
import { Users, UserPlus, Info } from "lucide-react";
import { CreateAdminForm } from "@/components/admin/create-admin-form";
import { AdminsList } from "@/components/admin/admins-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CreateAdminPage() {
    const handleSuccess = () => {
        // Optionally refresh the admins list
        console.log("Admin created successfully");
    };

    return (
        <div className="space-y-6 pb-8">
            {/* Header */}
            <SectionHeader
                title="Create Admin User"
                description="Add new administrators to the platform"
                icon={UserPlus}
            />

            {/* Info Card */}
            <Card className="border-blue-500/20 bg-blue-500/5">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <CardTitle className="text-base">Admin Access Information</CardTitle>
                            <CardDescription>
                                New admins will have full access to all administrative features
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <ul className="grid sm:grid-cols-2 gap-3 text-sm">
                        <li className="flex items-start gap-2">
                            <span className="text-blue-600 dark:text-blue-400 mt-0.5">✓</span>
                            <span className="text-muted-foreground">
                                Create and manage assignments
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-600 dark:text-blue-400 mt-0.5">✓</span>
                            <span className="text-muted-foreground">
                                Create and manage problem banks
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-600 dark:text-blue-400 mt-0.5">✓</span>
                            <span className="text-muted-foreground">
                                View all student submissions and analytics
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-600 dark:text-blue-400 mt-0.5">✓</span>
                            <span className="text-muted-foreground">
                                Manage other admin users (like this page!)
                            </span>
                        </li>
                    </ul>
                </CardContent>
            </Card>

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Create Admin Form */}
                <CreateAdminForm onSuccess={handleSuccess} />

                {/* Admins List */}
                <AdminsList />
            </div>
        </div>
    );
}
