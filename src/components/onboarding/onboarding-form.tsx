"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import styles from "@/app/onboarding/page.module.css";

type OnboardingFormProps = {
    initialName?: string;
    initialBatch?: "A" | "B";
};

export function OnboardingForm({
    initialName = "",
    initialBatch = "A",
}: OnboardingFormProps) {
    const router = useRouter();
    const { user, isLoaded } = useUser();
    const [name, setName] = useState(initialName);
    const [batch, setBatch] = useState<"A" | "B">(initialBatch);
    const [loading, setLoading] = useState(false);
    const [checkingProfile, setCheckingProfile] = useState(true);
    const [error, setError] = useState("");
    const isAdmin = (user?.publicMetadata?.role as string) === "admin";
    const derivedName = name || user?.fullName || "";
    const rollNo = useMemo(() => {
        const email = user?.primaryEmailAddress?.emailAddress ?? "";
        const match = email.match(/^([^@]+)@iiitdmj\.ac\.in$/i);
        return match ? match[1].toLowerCase() : "";
    }, [user]);

    useEffect(() => {
        if (!isLoaded) {
            return;
        }

        let cancelled = false;

        const checkExistingProfile = async () => {
            try {
                const response = await axios.get("/api/users/me");
                const existingUser = response.data?.user as {
                    role?: string;
                    name?: string;
                    rollNo?: string | null;
                    batch?: "A" | "B" | null;
                } | undefined;

                if (cancelled || !existingUser) {
                    return;
                }

                if (existingUser.name) {
                    setName(existingUser.name);
                }

                if (existingUser.batch === "A" || existingUser.batch === "B") {
                    setBatch(existingUser.batch);
                }

                if (existingUser.role === "admin") {
                    router.replace("/admin");
                    router.refresh();
                    return;
                }

                if (existingUser.role === "student" && existingUser.rollNo && existingUser.batch) {
                    router.replace("/home");
                    router.refresh();
                }
            } catch (profileError) {
                console.error("[OnboardingPage] Failed to check existing profile:", profileError);
            } finally {
                if (!cancelled) {
                    setCheckingProfile(false);
                }
            }
        };

        void checkExistingProfile();

        return () => {
            cancelled = true;
        };
    }, [isLoaded, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        const finalName = derivedName.trim();

        if (!finalName) {
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
                name: finalName,
                rollNo: isAdmin ? "" : rollNo,
                batch: isAdmin ? undefined : batch,
                isAdmin,
            });
            window.location.href = isAdmin ? "/admin" : "/home";
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string } } };
            setError(axiosErr?.response?.data?.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    if (!isLoaded || checkingProfile) {
        return null;
    }

    return (
        <div className={styles.root}>
            <div className={styles.bgGrid} aria-hidden="true" />
            <div className={`${styles.orb} ${styles.orb1}`} aria-hidden="true" />
            <div className={`${styles.orb} ${styles.orb2}`} aria-hidden="true" />

            <main className={styles.container}>
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
                        Sign in with your IIITDMJ email to continue.
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
                            value={derivedName}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Aditya Garg"
                            required
                            className={styles.input}
                        />
                    </div>

                    {!isAdmin && (
                        <div className="space-y-2">
                            <label className={styles.label}>
                                Batch
                            </label>
                            <select
                                value={batch}
                                onChange={(e) => setBatch(e.target.value as "A" | "B")}
                                className={styles.input}
                            >
                                <option value="A">Batch A</option>
                                <option value="B">Batch B</option>
                            </select>
                        </div>
                    )}

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
