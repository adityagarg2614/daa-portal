import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
    "/",
    "/sign-in(.*)",
    "/sign-up(.*)",
]);

const isOnboardingRoute = createRouteMatcher([
    "/onboarding(.*)",
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
    const onboardingComplete = metadata?.onboardingComplete === true;
    const rollNo = metadata?.rollNo;

    if ((!onboardingComplete || !rollNo) && !isOnboardingRoute(req)) {
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