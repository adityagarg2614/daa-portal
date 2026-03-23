import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
    "/",
    "/sign-in(.*)",
    "/sign-up(.*)",
]);

const isOnboardingRoute = createRouteMatcher([
    "/onboarding(.*)",
    "/api/onboarding(.*)",
]);

const isIgnoredRoute = createRouteMatcher([
    "/api/inngest(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
    // Let Inngest pass through untouched
    if (isIgnoredRoute(req)) {
        return NextResponse.next();
    }

    const { userId, sessionClaims } = await auth();

    // Allow public routes
    if (isPublicRoute(req)) {
        return NextResponse.next();
    }

    // Redirect unauthenticated users
    if (!userId) {
        return NextResponse.redirect(new URL("/", req.url));
    }

    // Force onboarding if incomplete
    const metadata = (sessionClaims?.metadata as Record<string, any>) || {};
    let onboardingComplete = metadata?.onboardingComplete === true;
    let rollNo = metadata?.rollNo;

    if ((!onboardingComplete || !rollNo) && !isOnboardingRoute(req)) {
        // Fallback: Check Clerk directly if the session token is stale
        // This makes sure the redirect after onboarding works on the first try
        try {
            const { clerkClient } = await import("@clerk/nextjs/server");
            const client = await clerkClient();
            const freshUser = await client.users.getUser(userId);

            if (freshUser.publicMetadata.onboardingComplete === true && freshUser.publicMetadata.rollNo) {
                return NextResponse.next();
            }
        } catch (error) {
            console.error("[Middleware] Fallback metadata check failed:", error);
        }

        return NextResponse.redirect(new URL("/onboarding", req.url));
    }

    return NextResponse.next();
});

export const config = {
    matcher: [
        "/((?!_next|.*\\..*).*)",
        "/(api|trpc)(.*)",
    ],
};