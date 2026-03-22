"use client";

import { useClerk } from "@clerk/nextjs";
import { ArrowRightIcon } from "lucide-react";

/**
 * A client-side button that opens the Clerk sign-in modal on click.
 * We use useClerk() instead of <SignInButton> to avoid Clerk's
 * strict single-child validation when the button contains nested elements.
 */
export function SignInModalButton({ className, children }: {
    className?: string;
    children?: React.ReactNode;
}) {
    const { openSignIn } = useClerk();

    return (
        <button
            onClick={() => openSignIn()}
            className={className}
        >
            {children ?? (
                <span className="flex items-center gap-2">
                    Get Started
                    <ArrowRightIcon className="size-4 group-hover:translate-x-1 transition-transform duration-200" />
                </span>
            )}
        </button>
    );
}
