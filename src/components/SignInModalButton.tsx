"use client";

import { useClerk } from "@clerk/nextjs";
import { ArrowRightIcon } from "lucide-react";

/**
 * Opens the Clerk sign-in modal on click.
 * Styled to match LandingPage btnPrimary by default.
 */
export function SignInModalButton({ className, style, children }: {
    className?: string;
    style?: React.CSSProperties;
    children?: React.ReactNode;
}) {
    const { openSignIn } = useClerk();

    const defaultStyle: React.CSSProperties = {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "12px 28px",
        borderRadius: "10px",
        fontSize: "0.95rem",
        fontWeight: 600,
        color: "#fff",
        background: "linear-gradient(135deg, #6366f1, #38bdf8)",
        boxShadow: "0 0 24px rgba(99,102,241,0.4)",
        border: "none",
        cursor: "pointer",
        letterSpacing: "-0.01em",
        transition: "opacity 0.2s, box-shadow 0.2s, transform 0.15s",
        ...style,
    };

    return (
        <button
            onClick={() => openSignIn()}
            className={className}
            style={className ? style : defaultStyle}
            onMouseEnter={(e) => {
                if (!className) {
                    (e.currentTarget as HTMLButtonElement).style.opacity = "0.9";
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 36px rgba(99,102,241,0.55)";
                    (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
                }
            }}
            onMouseLeave={(e) => {
                if (!className) {
                    (e.currentTarget as HTMLButtonElement).style.opacity = "1";
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 24px rgba(99,102,241,0.4)";
                    (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                }
            }}
        >
            {children ?? (
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    Get Started
                    <ArrowRightIcon size={16} />
                </span>
            )}
        </button>
    );
}

