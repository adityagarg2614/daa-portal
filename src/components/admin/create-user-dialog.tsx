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
import {
    UserPlus,
    Loader2,
    Eye,
    EyeOff,
    Copy,
    Check,
    ShieldCheck,
    GraduationCap,
    KeyRound,
    Mail,
    IdCard,
    Sparkles,
} from "lucide-react";
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
            <DialogContent className="max-h-[84vh] w-[95vw] max-w-[1280px] overflow-y-auto border-border/60 bg-card/95 p-0 shadow-[0_28px_90px_-42px_rgba(0,0,0,0.7)] backdrop-blur-xl">
                <DialogHeader className="border-b border-border/60 px-6 py-6 sm:px-7">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                            <Sparkles className="h-3.5 w-3.5" />
                            Access Setup
                        </div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-sm text-muted-foreground">
                            {role === "admin" ? (
                                <ShieldCheck className="h-3.5 w-3.5 text-sky-500" />
                            ) : (
                                <GraduationCap className="h-3.5 w-3.5 text-emerald-500" />
                            )}
                            {role === "admin" ? "Admin account" : "Student account"}
                        </div>
                    </div>
                    <DialogTitle className="mt-4 flex items-center gap-3 text-2xl tracking-tight sm:text-3xl">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                            <UserPlus className="h-5 w-5" />
                        </div>
                        Create new user
                    </DialogTitle>
                </DialogHeader>

                {createdPassword ? (
                    <div className="space-y-5 px-6 py-6 sm:px-7">
                        <Alert variant="success" className="border-emerald-500/20 bg-emerald-500/10">
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-500/20 bg-background/80 text-emerald-500">
                                        <Check className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-foreground">User created successfully</p>
                                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                            Save these credentials now. The temporary password will not be shown again.
                                        </p>
                                    </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-3">
                                    <SuccessStat
                                        icon={Mail}
                                        label="Account email"
                                        value={email.trim().toLowerCase()}
                                    />
                                    <SuccessStat
                                        icon={role === "admin" ? ShieldCheck : GraduationCap}
                                        label="Assigned role"
                                        value={role === "admin" ? "Admin" : "Student"}
                                    />
                                    <SuccessStat
                                        icon={IdCard}
                                        label="Roll number"
                                        value={role === "student" ? rollNo.trim() || "Pending" : "Not required"}
                                    />
                                </div>

                                <div className="rounded-[24px] border border-border/60 bg-background/80 p-4 sm:p-5">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                                                Temporary Password
                                            </p>
                                            <p className="mt-2 break-all font-mono text-lg font-bold tracking-tight text-foreground sm:text-xl">
                                                {createdPassword}
                                            </p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={copyPassword}
                                            className="gap-2 rounded-xl"
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

                        <DialogFooter className="border-t border-border/60 pt-5">
                            <Button onClick={() => handleOpenChange(false)} className="rounded-xl px-5">
                                Done
                            </Button>
                        </DialogFooter>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6 sm:px-7">
                        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(420px,0.85fr)] 2xl:grid-cols-[minmax(0,1.2fr)_minmax(440px,0.8fr)]">
                            <section className="space-y-5 rounded-[28px] border border-border/60 bg-background/55 p-5 sm:p-6">
                                <div className="space-y-1.5">
                                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                                        Identity Details
                                    </p>
                                    <h3 className="text-lg font-semibold tracking-tight">
                                        Basic account information
                                    </h3>
                                </div>

                                <div className="grid gap-4 lg:grid-cols-2">
                                    <FormField label="Full Name" required>
                                        <input
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="e.g. John Doe"
                                            className="w-full rounded-2xl border border-border/60 bg-card px-3.5 py-2.5 text-sm outline-none transition-all focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                                            required
                                        />
                                    </FormField>

                                    <FormField label="Role" required>
                                        <Select value={role} onValueChange={(val) => setRole(val as "admin" | "student")}>
                                            <SelectTrigger className="rounded-2xl border-border/60 bg-card">
                                                <SelectValue placeholder="Select role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="admin">Admin</SelectItem>
                                                <SelectItem value="student">Student</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FormField>
                                </div>

                                <FormField label="Email Address" required>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="e.g. john@example.com"
                                        className="w-full rounded-2xl border border-border/60 bg-card px-3.5 py-2.5 text-sm outline-none transition-all focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                                        required
                                    />
                                </FormField>

                                {role === "student" && (
                                    <FormField label="Roll Number" required>
                                        <input
                                            value={rollNo}
                                            onChange={(e) => setRollNo(e.target.value)}
                                            placeholder="e.g. 2024CS101"
                                            className="w-full rounded-2xl border border-border/60 bg-card px-3.5 py-2.5 text-sm outline-none transition-all focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                                            required
                                        />
                                    </FormField>
                                )}
                            </section>

                            <section className="space-y-5 rounded-[28px] border border-border/60 bg-card/80 p-5 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)] sm:p-6">
                                <div className="space-y-1.5">
                                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                                        Access Setup
                                    </p>
                                    <h3 className="text-lg font-semibold tracking-tight">
                                        Password and access preparation
                                    </h3>
                                </div>

                                <div className="grid gap-3">
                                    <RolePreviewCard
                                        active={role === "student"}
                                        icon={GraduationCap}
                                        label="Student"
                                        helper="Learner access with roll number tracking and assignment workflows."
                                        tone="emerald"
                                    />
                                    <RolePreviewCard
                                        active={role === "admin"}
                                        icon={ShieldCheck}
                                        label="Admin"
                                        helper="Management access for publishing, reviewing, and account operations."
                                        tone="sky"
                                    />
                                </div>

                                <FormField
                                    label="Password"
                                    hint="Choose between an automatically generated password or a manual one."
                                >
                                    <div className="space-y-3">
                                        <label className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/70 px-4 py-3 text-sm">
                                            <input
                                                type="checkbox"
                                                id="generate-password"
                                                checked={generatePassword}
                                                onChange={(e) => setGeneratePassword(e.target.checked)}
                                                className="h-4 w-4 rounded border-gray-300"
                                            />
                                            <span className="font-medium text-foreground">
                                                Auto-generate secure password
                                            </span>
                                        </label>

                                        {!generatePassword && (
                                            <div className="relative">
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    placeholder="Enter password"
                                                    className="w-full rounded-2xl border border-border/60 bg-background px-3.5 py-2.5 pr-10 text-sm outline-none transition-all focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
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
                            </section>
                        </div>

                        {error && <Alert variant="destructive">{error}</Alert>}

                        <DialogFooter className="border-t border-border/60 pt-5">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleOpenChange(false)}
                                disabled={loading}
                                className="rounded-xl"
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading} className="rounded-xl px-5">
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

function RolePreviewCard({
    active,
    icon: Icon,
    label,
    helper,
    tone,
}: {
    active: boolean;
    icon: typeof ShieldCheck;
    label: string;
    helper: string;
    tone: "sky" | "emerald";
}) {
    const toneClasses = {
        sky: active
            ? "border-sky-500/30 bg-sky-500/10"
            : "border-border/60 bg-background/60",
        emerald: active
            ? "border-emerald-500/30 bg-emerald-500/10"
            : "border-border/60 bg-background/60",
    }[tone];

    const iconClasses = {
        sky: active ? "text-sky-500" : "text-muted-foreground",
        emerald: active ? "text-emerald-500" : "text-muted-foreground",
    }[tone];

    return (
        <div className={`rounded-[22px] border p-4 transition-colors ${toneClasses}`}>
            <div className="flex items-start gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-2xl border border-border/60 bg-background ${iconClasses}`}>
                    <Icon className="h-5 w-5" />
                </div>
                <div>
                    <p className="font-medium text-foreground">{label}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{helper}</p>
                </div>
            </div>
        </div>
    );
}

function MiniInfoCard({
    icon: Icon,
    label,
    value,
}: {
    icon: typeof Mail;
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-[22px] border border-border/60 bg-background/70 p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
                <Icon className="h-4 w-4" />
                <p className="text-xs font-semibold uppercase tracking-[0.2em]">{label}</p>
            </div>
            <p className="mt-3 text-sm font-medium text-foreground">{value}</p>
        </div>
    );
}

function SuccessStat({
    icon: Icon,
    label,
    value,
}: {
    icon: typeof Mail;
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-[22px] border border-border/60 bg-background/70 p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
                <Icon className="h-4 w-4" />
                <p className="text-xs font-semibold uppercase tracking-[0.2em]">{label}</p>
            </div>
            <p className="mt-3 wrap-break-word text-sm font-medium text-foreground">{value}</p>
        </div>
    );
}
