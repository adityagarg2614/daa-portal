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
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Mail, Loader2, Send, CheckCircle2, X, Shield, User } from "lucide-react";
import { toast } from "sonner";

interface SendEmailDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    userData: {
        name: string;
        email: string;
        password: string;
        role: "admin" | "student";
        rollNo?: string;
    } | null;
    onSuccess?: () => void;
    onSkip?: () => void;
}

export function SendEmailDialog({
    open,
    onOpenChange,
    userData,
    onSuccess,
    onSkip,
}: SendEmailDialogProps) {
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState("");

    const handleSendEmail = async () => {
        if (!userData) return;

        try {
            setSending(true);
            setError("");

            const response = await fetch("/api/admin/email/welcome", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    to: userData.email,
                    name: userData.name,
                    password: userData.password,
                    role: userData.role,
                    rollNo: userData.rollNo,
                    loginUrl: `${window.location.origin}/sign-in`,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setSent(true);
                toast.success("Welcome email sent successfully!");
                onSuccess?.();
            } else {
                setError(data.message || "Failed to send email");
                toast.error(data.message || "Failed to send email");
            }
        } catch (err: any) {
            setError(err.message || "Failed to send email");
            toast.error("Failed to send email");
        } finally {
            setSending(false);
        }
    };

    const handleSkip = () => {
        onSkip?.();
        handleClose();
    };

    const handleClose = () => {
        onOpenChange(false);
        setSent(false);
        setError("");
    };

    if (!userData) return null;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5 text-primary" />
                        {sent ? "Email Sent!" : "Send Welcome Email"}
                    </DialogTitle>
                    <DialogDescription>
                        {sent
                            ? "The welcome email has been sent successfully."
                            : `Send account details to ${userData.name} at ${userData.email}`}
                    </DialogDescription>
                </DialogHeader>

                {sent ? (
                    <div className="space-y-4 py-4">
                        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border bg-green-500/10 p-6 text-center">
                            <CheckCircle2 className="h-12 w-12 text-green-600" />
                            <div>
                                <p className="font-semibold text-green-800">Email Sent Successfully!</p>
                                <p className="text-sm text-green-700 mt-1">
                                    {userData.name} will receive their account details shortly.
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 py-4">
                        {/* User Details Summary */}
                        <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Name</span>
                                <span className="font-medium">{userData.name}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Email</span>
                                <span className="font-medium">{userData.email}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Role</span>
                                <Badge variant={userData.role === "admin" ? "default" : "secondary"}>
                                    {userData.role === "admin" ? (
                                        <Shield className="mr-1 h-3 w-3" />
                                    ) : (
                                        <User className="mr-1 h-3 w-3" />
                                    )}
                                    {userData.role.charAt(0).toUpperCase() + userData.role.slice(1)}
                                </Badge>
                            </div>
                            {userData.rollNo && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Roll No</span>
                                    <span className="font-mono font-medium">{userData.rollNo}</span>
                                </div>
                            )}
                        </div>

                        {/* Password Display */}
                        <div className="rounded-lg border bg-yellow-500/10 p-4">
                            <p className="text-xs font-semibold text-yellow-800 uppercase tracking-wide mb-2">
                                🔐 Temporary Password
                            </p>
                            <p className="font-mono text-xl font-bold text-yellow-900 break-all">
                                {userData.password}
                            </p>
                            <p className="text-xs text-yellow-700 mt-2">
                                ⚠️ This password will be included in the email
                            </p>
                        </div>

                        {error && <Alert variant="destructive">{error}</Alert>}
                    </div>
                )}

                <DialogFooter className="gap-2 sm:gap-0">
                    {!sent ? (
                        <>
                            <Button
                                variant="outline"
                                onClick={handleSkip}
                                disabled={sending}
                            >
                                <X className="mr-2 h-4 w-4" />
                                Skip Email
                            </Button>
                            <Button
                                onClick={handleSendEmail}
                                disabled={sending}
                            >
                                {sending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Send className="mr-2 h-4 w-4" />
                                        Send Welcome Email
                                    </>
                                )}
                            </Button>
                        </>
                    ) : (
                        <Button onClick={handleClose}>
                            Done
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
