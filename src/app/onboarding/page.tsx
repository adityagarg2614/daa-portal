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
    const router = useRouter();

    // Derive rollNo from college email on load
    useEffect(() => {
        if (!isLoaded || !user) return;

        const email = user.primaryEmailAddress?.emailAddress ?? "";
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

        if (!rollNo) {
            setError(
                "Could not derive roll number from your email. Make sure you signed in with your IIITDMJ college email (e.g. 22bcs010@iiitdmj.ac.in)."
            );
            return;
        }

        try {
            setLoading(true);
            await axios.post("/api/onboarding/complete", {
                name: name.trim(),
                rollNo,
            });
            // Force a full reload to ensure middleware catches the new session metadata
            window.location.href = "/home";
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
                <h1 className={styles.title}>Complete Your Profile</h1>
                <p className={styles.subtitle}>Let&apos;s get you set up for the Algo-Grade portal.</p>

                {rollNo ? (
                    <div className={styles.info}>
                        Detected roll number: <strong className={styles.rollHighlight}>{rollNo}</strong>
                    </div>
                ) : (
                    <div className={styles.errorText}>
                        ⚠️ Sign in with your IIITDMJ email to continue.
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
                        disabled={loading || !rollNo}
                        className={styles.button}
                    >
                        {loading ? "Saving..." : "Save & Continue"}
                    </button>
                </form>
            </main>
        </div>
    );
}