"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { UserPlus, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface CreateAdminFormProps {
    onSuccess?: () => void;
}

export function CreateAdminForm({ onSuccess }: CreateAdminFormProps) {
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [designation, setDesignation] = useState("professor");
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; name?: string }>({});

    const validateForm = () => {
        const newErrors: { email?: string; name?: string } = {};

        // Email validation
        if (!email.trim()) {
            newErrors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = "Please enter a valid email address";
        }

        // Name validation
        if (!name.trim()) {
            newErrors.name = "Name is required";
        } else if (name.trim().length < 2) {
            newErrors.name = "Name must be at least 2 characters";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            const response = await fetch("/api/admin/setup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: email.toLowerCase().trim(),
                    name: name.trim(),
                    designation,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success("Admin user created successfully!", {
                    description: `${data.user.name} (${data.user.email}) can now access the admin dashboard.`,
                });

                // Clear form
                setEmail("");
                setName("");
                setDesignation("professor");

                // Callback to parent
                onSuccess?.();
            } else {
                toast.error("Failed to create admin", {
                    description: data.message || "Something went wrong",
                });
            }
        } catch (error) {
            console.error("Error creating admin:", error);
            toast.error("Network error", {
                description: "Please check your connection and try again",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <UserPlus className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <CardTitle>Create Admin User</CardTitle>
                        <CardDescription>
                            Add a new admin with full dashboard access
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="email">
                            Email Address *
                        </label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="professor@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                            className={errors.email ? "border-red-500" : ""}
                        />
                        {errors.email && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                {errors.email}
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            Any email domain is accepted. The user will be able to sign in with this email.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="name">
                            Full Name *
                        </label>
                        <Input
                            id="name"
                            type="text"
                            placeholder="Dr. John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={loading}
                            className={errors.name ? "border-red-500" : ""}
                        />
                        {errors.name && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                {errors.name}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="designation">
                            Role Designation
                        </label>
                        <Select value={designation} onValueChange={setDesignation} disabled={loading}>
                            <SelectTrigger id="designation">
                                <SelectValue placeholder="Select designation" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="professor">Professor</SelectItem>
                                <SelectItem value="assistant-professor">Assistant Professor</SelectItem>
                                <SelectItem value="associate-professor">Associate Professor</SelectItem>
                                <SelectItem value="hod">Head of Department</SelectItem>
                                <SelectItem value="admin">Admin Staff</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            This is for your reference only and doesn't affect permissions.
                        </p>
                    </div>

                    <Button type="submit" disabled={loading} className="w-full">
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Creating Admin...
                            </>
                        ) : (
                            <>
                                <UserPlus className="h-4 w-4 mr-2" />
                                Create Admin User
                            </>
                        )}
                    </Button>
                </form>

                <div className="mt-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                        <div className="text-sm text-blue-800 dark:text-blue-200">
                            <p className="font-medium mb-1">What happens next?</p>
                            <ul className="space-y-1 text-xs opacity-90">
                                <li>• The new admin will receive an email invitation</li>
                                <li>• They can sign in immediately with their email</li>
                                <li>• They'll have full access to all admin features</li>
                                <li>• No roll number required for admin accounts</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
