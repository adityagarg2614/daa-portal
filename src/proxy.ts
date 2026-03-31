import { clerkClient, clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import UserModel from "@/models/User";

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

    // Check if user is admin from DB (even if Clerk metadata is not updated yet)
    let isAdmin = role === "admin";
    if (!isAdmin) {
        // Check DB for admin role
        try {
            await connectDB();

            // First try to find by actual clerkId
            let dbUser = await UserModel.findOne({ clerkId: userId });
            console.log("[Middleware] Initial DB lookup by userId:", userId, "Result:", dbUser ? "Found" : "Not found");

            // If not found, check if there's a pending admin record for this email
            if (!dbUser) {
                const { clerkClient } = await import("@clerk/nextjs/server");
                const client = await clerkClient();
                const clerkUser = await client.users.getUser(userId);
                const email = clerkUser.emailAddresses.find(
                    (e) => e.id === clerkUser.primaryEmailAddressId
                )?.emailAddress?.toLowerCase();

                console.log("[Middleware] Looking for pending admin with email:", email);

                if (email) {
                    // Check for pending admin record
                    dbUser = await UserModel.findOne({
                        $or: [
                            { email: email },
                            { clerkId: "pending_" + email }
                        ]
                    });

                    console.log("[Middleware] Pending admin lookup result:", dbUser ? "Found" : "Not found");

                    // If found and it's an admin, update the clerkId
                    if (dbUser && dbUser.role === "admin" && dbUser.clerkId.startsWith("pending_")) {
                        dbUser.clerkId = userId;
                        await dbUser.save();
                        console.log("[Middleware] ✅ Updated admin clerkId from pending to:", userId);
                    }
                }
            }

            if (dbUser?.role === "admin") {
                isAdmin = true;
                console.log("[Middleware] User is admin, updating Clerk metadata...");

                // Update Clerk metadata to reflect admin role
                try {
                    const client = await clerkClient();
                    await client.users.updateUser(userId, {
                        publicMetadata: {
                            ...metadata,
                            role: "admin",
                            onboardingComplete: true,
                        },
                    });
                    console.log("[Middleware] ✅ Updated Clerk metadata for admin:", userId);
                } catch (err) {
                    console.error("[Middleware] Failed to update Clerk metadata for admin:", err);
                }
            }
        } catch (err) {
            console.error("[Middleware] Failed to check DB for admin role:", err);
        }
    }

    if ((!onboardingComplete || !rollNo) && !isOnboardingRoute(req) && !isAdmin) {
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

    // Redirect admins to admin dashboard (skip onboarding)
    if (isAdmin && !isAdminRoute(req) && !isOnboardingRoute(req)) {
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