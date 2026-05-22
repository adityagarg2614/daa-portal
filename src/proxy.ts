import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { connectDB } from "./lib/db";

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

const isAdminRoute = createRouteMatcher([
    "/admin(.*)",
]);

const isStudentRoute = createRouteMatcher([
    "/home(.*)",
    "/assignment(.*)",
    "/submission(.*)",
    "/results(.*)",
    "/attendance(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
    const { userId, sessionClaims } = await auth();

    // Allow public routes
    if (isPublicRoute(req)) {
        return NextResponse.next();
    }

    // Redirect unauthenticated users
    if (!userId) {
        return NextResponse.redirect(new URL("/", req.url));
    }

    // Check if user is admin from metadata
    const metadata = (sessionClaims?.metadata as Record<string, unknown>) || {};
    const role = metadata?.role as string | undefined;
    const metadataEmail = metadata?.email as string | undefined;
    let isAdmin = role === "admin";
    let dbUser: {
        clerkId?: string;
        email?: string;
        name?: string;
        role?: string;
        rollNo?: string;
        batch?: string;
        save?: () => Promise<void>;
    } | null = null;

    if (userId) {
        try {
            const UserModel = (await import("@/models/User")).default;
            await connectDB();

            dbUser = await UserModel.findOne({
                $or: [
                    { clerkId: userId },
                    { clerkId: "pending_" + metadataEmail },
                    { email: metadataEmail }
                ]
            });

            // If not admin from metadata, check DB for pending admins
            if (dbUser?.role === "admin") {
                isAdmin = true;

                // Update Clerk metadata if not already set
                if (role !== "admin") {
                    const { clerkClient } = await import("@clerk/nextjs/server");
                    const client = await clerkClient();
                    await client.users.updateUser(userId, {
                        publicMetadata: {
                            ...metadata,
                            role: "admin",
                            onboardingComplete: true,
                        },
                    });
                }
            }
        } catch (error) {
            console.error("[Middleware] DB check failed:", error);
        }
    }

    // Force onboarding if incomplete (but skip for admins)
    const onboardingComplete = (metadata?.onboardingComplete as boolean) === true;
    const rollNo = metadata?.rollNo as string | undefined;
    const batch = metadata?.batch as string | undefined;
    const name = metadata?.name as string | undefined;
    const dbStudentProfileComplete = Boolean(
        dbUser?.role === "student" && dbUser?.rollNo && dbUser?.batch
    );
    const studentProfileComplete =
        (onboardingComplete && Boolean(rollNo) && Boolean(batch)) ||
        dbStudentProfileComplete;

    if (
        !isAdmin &&
        dbStudentProfileComplete &&
        (!onboardingComplete || !rollNo || !batch || !name)
    ) {
        try {
            const { clerkClient } = await import("@clerk/nextjs/server");
            const client = await clerkClient();
            await client.users.updateUser(userId, {
                publicMetadata: {
                    ...metadata,
                    name: dbUser?.name || name,
                    role: "student",
                    rollNo: dbUser?.rollNo,
                    batch: dbUser?.batch,
                    onboardingComplete: true,
                },
            });
        } catch (error) {
            console.error("[Middleware] Failed to self-heal student metadata:", error);
        }
    }

    if (!studentProfileComplete && !isOnboardingRoute(req) && !isAdmin) {
        return NextResponse.redirect(new URL("/onboarding", req.url));
    }

    // Redirect admins to admin dashboard (skip onboarding)
    if (isAdmin && !isAdminRoute(req) && !isOnboardingRoute(req) && !req.nextUrl.pathname.startsWith("/api")) {
        return NextResponse.redirect(new URL("/admin", req.url));
    }

    // Redirect onboarded users away from onboarding page
    if (isOnboardingRoute(req) && !req.nextUrl.pathname.startsWith("/api") && studentProfileComplete) {
        // Double-check with fresh data from Clerk to handle stale session tokens
        // This prevents a loop if the user was recently deleted from the DB but the token still has the old metadata
        try {
            const { clerkClient } = await import("@clerk/nextjs/server");
            const client = await clerkClient();
            const freshUser = await client.users.getUser(userId);

            if (
                freshUser.publicMetadata.onboardingComplete !== true ||
                !freshUser.publicMetadata.rollNo ||
                !freshUser.publicMetadata.batch
            ) {
                if (dbStudentProfileComplete) {
                    return NextResponse.redirect(new URL("/home", req.url));
                }

                // Token is stale, the user actually needs to re-onboard
                return NextResponse.next();
            }
        } catch (error) {
            console.error("[Middleware] Stale token check failed:", error);
        }

        return NextResponse.redirect(new URL("/home", req.url));
    }

    // Protect admin routes - redirect non-admins to home
    if (isAdminRoute(req) && !isAdmin) {
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
    if (isStudentRoute(req) && isAdmin) {
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
