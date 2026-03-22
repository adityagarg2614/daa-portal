"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

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
            router.push("/home");
            router.refresh();
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string } } };
            setError(axiosErr?.response?.data?.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    if (!isLoaded) return null;

    return (
        <main style={{ padding: 24, maxWidth: 520 }}>
            <h1>Complete Your Profile</h1>

            {rollNo ? (
                <p style={{ marginTop: 8, color: "#64748b" }}>
                    Detected roll number: <strong style={{ color: "#818cf8" }}>{rollNo}</strong>
                </p>
            ) : (
                <p style={{ marginTop: 8, color: "#f87171" }}>
                    ⚠️ Sign in with your IIITDMJ email to continue.
                </p>
            )}

            <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
                <label style={{ display: "block" }}>
                    Full Name
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Aditya Garg"
                        required
                        style={{ display: "block", width: "100%", padding: 10, marginTop: 6 }}
                    />
                </label>

                {error && (
                    <p style={{ color: "red", marginTop: 10 }}>{error}</p>
                )}

                <button
                    type="submit"
                    disabled={loading || !rollNo}
                    style={{ marginTop: 16, padding: 10 }}
                >
                    {loading ? "Saving..." : "Save & Continue"}
                </button>
            </form>
        </main>
    );
}