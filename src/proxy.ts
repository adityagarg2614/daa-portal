import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
    "/",
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/setup-admin(.*)",
    "/api/admin/setup(.*)",
    "/api/admin/dashboard(.*)",
    "/api/admin/students(.*)",
    "/api/compile(.*)",
    "/api/admin/problems(.*)",
    "/api/admin/assignments(.*)",
    "/api/student/assignments(.*)",
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

const isStudentRoute = createRouteMatcher([
    "/home(.*)",
    "/dashboard(.*)",
    "/assignment(.*)",
    "/submission(.*)",
    "/results(.*)",
    "/attendance(.*)",
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

    // Force onboarding if incomplete (but skip for admins)
    const metadata = (sessionClaims?.metadata as Record<string, unknown>) || {};
    const onboardingComplete = (metadata?.onboardingComplete as boolean) === true;
    const rollNo = metadata?.rollNo as string | undefined;
    const role = metadata?.role as string | undefined;

    // Check if user is admin from metadata
    const isAdmin = role === "admin";

    if ((!onboardingComplete || !rollNo) && !isOnboardingRoute(req) && !isAdmin) {
        return NextResponse.redirect(new URL("/onboarding", req.url));
    }

    // Redirect admins to admin dashboard (skip onboarding)
    if (isAdmin && !isAdminRoute(req) && !isOnboardingRoute(req) && !req.nextUrl.pathname.startsWith("/api")) {
        return NextResponse.redirect(new URL("/admin", req.url));
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

    // Protect admin routes - redirect non-admins to home
    if (isAdminRoute(req) && role !== "admin") {
        return NextResponse.redirect(new URL("/home", req.url));
    }

    // Protect setup-admin page - block students
    const isSetupAdminRoute = req.nextUrl.pathname.startsWith("/setup-admin");
    if (isSetupAdminRoute && role === "student") {
        // Students can access the page but it will show "Access Denied" (handled in UI)
        // We allow them to see the page to understand why they're blocked
        return NextResponse.next();
    }

    // Redirect admins away from student routes
    if (isStudentRoute(req) && role === "admin") {
        return NextResponse.redirect(new URL("/admin", req.url));
    }

    return NextResponse.next();
});

export const config = {
    matcher: [
        "/((?!_next|.*\\..*).*)",
        "/(api|trpc)(.*)",
    ],
};