"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, CheckCircle2, Copy, LogIn } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function AdminSetupPage() {
    const { isLoaded, user } = useUser();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [secret, setSecret] = useState("");

    // Check if logged in user is a student
    if (isLoaded && user) {
        const userRole = user.publicMetadata?.role as string;
        if (userRole === "student") {
            return (
                <div className="min-h-screen bg-background p-8">
                    <div className="max-w-2xl mx-auto">
                        <Card className="border-red-500/20 bg-red-500/5">
                            <CardHeader>
                                <CardTitle className="text-red-700 dark:text-red-500 flex items-center gap-2">
                                    <Users className="h-6 w-6" />
                                    Access Denied
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-red-700/80 dark:text-red-500/80">
                                    Student accounts cannot access the admin setup page.
                                </p>
                                <Button onClick={() => router.push("/home")} variant="outline">
                                    Go to Student Dashboard
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            );
        }

        // If already admin, redirect to admin dashboard
        if (userRole === "admin") {
            router.push("/admin");
            return (
                <div className="min-h-screen bg-background flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Redirecting to admin dashboard...</p>
                    </div>
                </div>
            );
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch("/api/admin/setup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${secret}`,
                },
                body: JSON.stringify({ email, name }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(data.message);
                if (data.note) {
                    toast.info(data.note);
                }
                setEmail("");
                setName("");

                // If user is logged in as admin, redirect to admin dashboard
                if (isLoaded && user) {
                    const userRole = user.publicMetadata?.role as string;
                    if (userRole === "admin") {
                        toast.success("Redirecting to admin dashboard...");
                        setTimeout(() => {
                            router.push("/admin");
                        }, 1500);
                    } else {
                        toast.success("Admin created! Please sign in again to activate admin access.");
                    }
                } else {
                    toast.success("Admin created! Please sign in with this email address.");
                }
            } else {
                toast.error(data.message || "Failed to create admin");
            }
        } catch (error) {
            console.error("Error creating admin:", error);
            toast.error("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const copyCurlCommand = () => {
        const curlCommand = `curl -X POST http://localhost:3000/api/admin/setup \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${secret}" \\
  -d '{"email":"${email || "your-email@example.com"}","name":"${name || "Admin User"}"}'`;

        navigator.clipboard.writeText(curlCommand);
        toast.success("cURL command copied to clipboard!");
    };

    if (!isLoaded) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
                        <Users className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Admin User Setup</h1>
                        <p className="text-sm text-muted-foreground">
                            Create admin users with any email domain
                        </p>
                    </div>
                </div>

                {user && (
                    <Card className="border-blue-500/20 bg-blue-500/5">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <LogIn className="h-5 w-5 text-blue-500" />
                                <div>
                                    <p className="font-medium text-blue-700 dark:text-blue-400">
                                        Logged in as: {user.emailAddresses[0]?.emailAddress}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        After creating the admin, you'll be redirected to onboarding.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {!user && (
                    <Card className="border-yellow-500/20 bg-yellow-500/5">
                        <CardContent className="pt-6">
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="h-5 w-5 text-yellow-500 mt-0.5" />
                                <div>
                                    <p className="font-medium text-yellow-700 dark:text-yellow-400">
                                        Not logged in?
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        You can still create an admin user. After creation, sign in with the email you provided.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Setup Instructions</CardTitle>
                        <CardDescription>
                            Follow these steps to create an admin user
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                            <div>
                                <p className="font-medium">Step 1: Set the setup secret</p>
                                <p className="text-sm text-muted-foreground">
                                    The secret is already configured from your <code className="bg-muted px-1 py-0.5 rounded">.env.local</code> file
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                            <div>
                                <p className="font-medium">Step 2: Create admin user</p>
                                <p className="text-sm text-muted-foreground">
                                    Use the form below or the cURL command to create an admin
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                            <div>
                                <p className="font-medium">Step 3: Login as admin</p>
                                <p className="text-sm text-muted-foreground">
                                    Sign in with the email you just registered. You'll be redirected to the admin dashboard.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Create Admin User</CardTitle>
                        <CardDescription>
                            Enter the details for the new admin user
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Setup Secret</label>
                                <Input
                                    type="password"
                                    placeholder="Enter ADMIN_SETUP_SECRET"
                                    value={secret}
                                    onChange={(e) => setSecret(e.target.value)}
                                    required
                                />
                                <p className="text-xs text-muted-foreground">
                                    Default: <code className="bg-muted px-1 py-0.5 rounded">admin-setup-secret-change-this-in-production</code>
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email</label>
                                <Input
                                    type="email"
                                    placeholder="admin@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                                <p className="text-xs text-muted-foreground">
                                    Any email domain is accepted for admin users
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Name</label>
                                <Input
                                    type="text"
                                    placeholder="Admin User"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>

                            <Button type="submit" disabled={loading} className="w-full">
                                {loading ? "Creating..." : "Create Admin User"}
                            </Button>
                        </form>

                        {secret && (
                            <div className="mt-6 space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium">Or use cURL</label>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={copyCurlCommand}
                                        className="gap-1"
                                    >
                                        <Copy className="h-3 w-3" />
                                        Copy
                                    </Button>
                                </div>
                                <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
                                    <code>{`curl -X POST http://localhost:3000/api/admin/setup \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${secret}" \\
  -d '{"email":"${email || "your-email@example.com"}","name":"${name || "Admin User"}"}'`}</code>
                                </pre>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-yellow-500/20 bg-yellow-500/5">
                    <CardHeader>
                        <CardTitle className="text-yellow-700 dark:text-yellow-500">
                            ⚠️ Security Notice
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-yellow-700/80 dark:text-yellow-500/80 space-y-2">
                        <p>
                            <strong>Change the setup secret in production!</strong>
                        </p>
                        <p>
                            Update <code className="bg-muted px-1 py-0.5 rounded">ADMIN_SETUP_SECRET</code> in your <code className="bg-muted px-1 py-0.5 rounded">.env.local</code> file to a strong random string.
                        </p>
                        <p>
                            This page should be removed or protected in production environments.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
