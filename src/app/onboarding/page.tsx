"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import styles from "./page.module.css";

export default function OnboardingPage() {
    const { user, isLoaded } = useUser();
    const [name, setName] = useState("");
    const [rollNo, setRollNo] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [isAdmin, setIsAdmin] = useState(false);
    const router = useRouter();

    // Check if user is admin and derive rollNo from college email on load
    useEffect(() => {
        if (!isLoaded || !user) return;

        const email = user.primaryEmailAddress?.emailAddress ?? "";

        // Check if user is already marked as admin in Clerk metadata
        const userRole = user.publicMetadata?.role as string;
        if (userRole === "admin") {
            setIsAdmin(true);
            return;
        }

        // Expected format: 22bcs010@iiitdmj.ac.in  →  rollNo = "22bcs010"
        const match = email.match(/^([^@]+)@iiitdmj\.ac\.in$/i);
        if (match) {
            setRollNo(match[1].toLowerCase());
        }

        // Pre-fill name from Clerk profile if available
        const fullName = user.fullName ?? "";
        if (fullName) setName(fullName);
    }, [isLoaded, user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!name.trim()) {
            setError("Please enter your full name");
            return;
        }

        if (!isAdmin && !rollNo) {
            setError(
                "Could not derive roll number from your email. Make sure you signed in with your IIITDMJ college email (e.g. 22bcs010@iiitdmj.ac.in)."
            );
            return;
        }

        try {
            setLoading(true);
            await axios.post("/api/onboarding/complete", {
                name: name.trim(),
                rollNo: isAdmin ? "" : rollNo,
                isAdmin,
            });
            // Force a full reload to ensure middleware catches the new session metadata
            window.location.href = isAdmin ? "/admin" : "/home";
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string } } };
            setError(axiosErr?.response?.data?.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    if (!isLoaded) return null;

    return (
        <div className={styles.root}>
            {/* Background elements consistent with Landing Page */}
            <div className={styles.bgGrid} aria-hidden="true" />
            <div className={`${styles.orb} ${styles.orb1}`} aria-hidden="true" />
            <div className={`${styles.orb} ${styles.orb2}`} aria-hidden="true" />

            <main className={`${styles.container}`}>
                <h1 className={styles.title}>
                    {isAdmin ? "Admin Access Detected" : "Complete Your Profile"}
                </h1>
                <p className={styles.subtitle}>
                    {isAdmin
                        ? "Welcome! Confirm your details to access the admin dashboard."
                        : "Let's get you set up for the Algo-Grade portal."}
                </p>

                {!isAdmin && rollNo ? (
                    <div className={styles.info}>
                        Detected roll number: <strong className={styles.rollHighlight}>{rollNo}</strong>
                    </div>
                ) : !isAdmin && (
                    <div className={styles.errorText}>
                        ⚠️ Sign in with your IIITDMJ email to continue.
                    </div>
                )}

                {isAdmin && (
                    <div className={styles.info}>
                        <span className="text-green-600 dark:text-green-400">✓</span> Admin access will be granted to your account
                    </div>
                )}

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className="space-y-2">
                        <label className={styles.label}>
                            Full Name
                        </label>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Aditya Garg"
                            required
                            className={styles.input}
                        />
                    </div>

                    {error && (
                        <p className={`${styles.errorText} mt-4`}>{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading || (!isAdmin && !rollNo)}
                        className={styles.button}
                    >
                        {loading ? "Saving..." : (isAdmin ? "Continue to Admin Dashboard" : "Save & Continue")}
                    </button>
                </form>
            </main>
        </div>
    );
}
