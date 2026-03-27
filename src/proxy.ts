import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
    "/",
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/api/admin/problems(.*)",
    "/api/student/assignments(.*)",
    "/api/admin/assignments(.*)",
    "/api/student/submissions(.*)",
]);

const isOnboardingRoute = createRouteMatcher([
    "/onboarding(.*)",
    "/api/onboarding(.*)",
]);

const isIgnoredRoute = createRouteMatcher([
    "/api/inngest(.*)",
]);

const isAdminRoute = createRouteMatcher([
    "/admin(.*)",
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

    // Redirect onboarded users away from onboarding page
    if (isOnboardingRoute(req) && !req.nextUrl.pathname.startsWith("/api") && onboardingComplete && rollNo) {
        // Double-check with fresh data from Clerk to handle stale session tokens
        // This prevents a loop if the user was recently deleted from the DB but the token still has the old metadata
        try {
            const { clerkClient } = await import("@clerk/nextjs/server");
            const client = await clerkClient();
            const freshUser = await client.users.getUser(userId);

            if (freshUser.publicMetadata.onboardingComplete !== true || !freshUser.publicMetadata.rollNo) {
                // Token is stale, the user actually needs to re-onboard
                return NextResponse.next();
            }
        } catch (error) {
            console.error("[Middleware] Stale token check failed:", error);
        }

        return NextResponse.redirect(new URL("/home", req.url));
    }

    // Protect admin routes
    // const role = metadata?.role;
    // if (isAdminRoute(req) && role !== "admin") {
    //     return NextResponse.redirect(new URL("/home", req.url));
    // }

    return NextResponse.next();
});

export const config = {
    matcher: [
        "/((?!_next|.*\\..*).*)",
        "/(api|trpc)(.*)",
    ],
};