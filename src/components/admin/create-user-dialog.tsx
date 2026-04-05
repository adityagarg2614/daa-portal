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
import { UserPlus, Loader2, Eye, EyeOff, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface CreateUserDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    onUserCreated?: (userData: {
        name: string;
        email: string;
        password: string;
        role: "admin" | "student";
        rollNo?: string;
    }) => void;
}

export function CreateUserDialog({
    open,
    onOpenChange,
    onSuccess,
    onUserCreated,
}: CreateUserDialogProps) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<"admin" | "student">("student");
    const [rollNo, setRollNo] = useState("");
    const [password, setPassword] = useState("");
    const [generatePassword, setGeneratePassword] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [createdPassword, setCreatedPassword] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setCreatedPassword("");

        // Validation
        if (!name.trim() || !email.trim() || !role) {
            setError("Name, email, and role are required");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError("Invalid email format");
            return;
        }

        if (role === "student" && !rollNo.trim()) {
            setError("Roll number is required for students");
            return;
        }

        const finalPassword = generatePassword ? "" : password;
        if (!generatePassword && !password) {
            setError("Password is required");
            return;
        }

        try {
            setLoading(true);

            const response = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name.trim(),
                    email: email.trim().toLowerCase(),
                    role,
                    rollNo: role === "student" ? rollNo.trim() : undefined,
                    password: finalPassword,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setCreatedPassword(data.data.password);
                toast.success(data.message || "User created successfully");
                onSuccess();

                // Emit user created event for email dialog
                if (onUserCreated) {
                    onUserCreated({
                        name: name.trim(),
                        email: email.trim().toLowerCase(),
                        password: data.data.password,
                        role,
                        rollNo: role === "student" ? rollNo.trim() : undefined,
                    });
                }

                // Reset form
                setName("");
                setEmail("");
                setRole("student");
                setRollNo("");
                setPassword("");
                setGeneratePassword(true);
            } else {
                setError(data.message || "Failed to create user");
            }
        } catch (err) {
            setError("Failed to create user");
            console.error("Error creating user:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenChange = (open: boolean) => {
        onOpenChange(open);
        if (!open) {
            setName("");
            setEmail("");
            setRole("student");
            setRollNo("");
            setPassword("");
            setGeneratePassword(true);
            setError("");
            setCreatedPassword("");
            setCopied(false);
        }
    };

    const copyPassword = () => {
        navigator.clipboard.writeText(createdPassword);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success("Password copied to clipboard");
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-primary" />
                        Create New User
                    </DialogTitle>
                    <DialogDescription>
                        Add a new user to the system. They will receive login credentials.
                    </DialogDescription>
                </DialogHeader>

                {createdPassword ? (
                    <div className="space-y-4 py-4">
                        <Alert variant="success">
                            <div className="space-y-3">
                                <div>
                                    <p className="font-medium">User Created Successfully!</p>
                                    <p className="text-sm mt-1">
                                        Save these credentials. They will not be shown again.
                                    </p>
                                </div>
                                <div className="rounded-lg border bg-muted p-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-muted-foreground">Temporary Password</p>
                                            <p className="font-mono text-lg font-bold">{createdPassword}</p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={copyPassword}
                                            className="gap-2"
                                        >
                                            {copied ? (
                                                <>
                                                    <Check className="h-4 w-4" />
                                                    Copied
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="h-4 w-4" />
                                                    Copy
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Alert>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <FormField label="Full Name" required>
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. John Doe"
                                className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 transition-all"
                                required
                            />
                        </FormField>

                        <FormField label="Email Address" required>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="e.g. john@example.com"
                                className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 transition-all"
                                required
                            />
                        </FormField>

                        <FormField label="Role" required>
                            <Select value={role} onValueChange={(val) => setRole(val as "admin" | "student")}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="student">Student</SelectItem>
                                </SelectContent>
                            </Select>
                        </FormField>

                        {role === "student" && (
                            <FormField label="Roll Number" required>
                                <input
                                    value={rollNo}
                                    onChange={(e) => setRollNo(e.target.value)}
                                    placeholder="e.g. 2024CS101"
                                    className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 transition-all"
                                    required
                                />
                            </FormField>
                        )}

                        <FormField
                            label="Password"
                            hint="Leave unchecked to auto-generate a secure password"
                        >
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="generate-password"
                                        checked={generatePassword}
                                        onChange={(e) => setGeneratePassword(e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300"
                                    />
                                    <label htmlFor="generate-password" className="text-sm">
                                        Auto-generate secure password
                                    </label>
                                </div>

                                {!generatePassword && (
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Enter password"
                                            className="w-full rounded-xl border px-3 py-2 pr-10 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </FormField>

                        {error && <Alert variant="destructive">{error}</Alert>}

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleOpenChange(false)}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="mr-2 h-4 w-4" />
                                        Create User
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
