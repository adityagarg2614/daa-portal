import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
    "/",
    "/sign-in(.*)",
    "/sign-up(.*)",
]);

const isOnboardingRoute = createRouteMatcher(["/onboarding(.*)"]);

export default clerkMiddleware(async (auth, req) => {
    const { userId, sessionClaims } = await auth();

    // Allow public routes without auth
    if (isPublicRoute(req)) return;

    // Require sign-in for non-public routes
    if (!userId) {
        const signInUrl = new URL("/sign-in", req.url);
        signInUrl.searchParams.set("redirect_url", req.url);
        return NextResponse.redirect(signInUrl);
    }

    // Force onboarding if not complete
    const metadata = (sessionClaims?.metadata as any) || {};
    const onboardingComplete = metadata?.onboardingComplete === true;
    const rollNo = metadata?.rollNo;

    if (!onboardingComplete || !rollNo) {
        // avoid redirect loop if already on onboarding
        if (!isOnboardingRoute(req)) {
            return NextResponse.redirect(new URL("/onboarding", req.url));
        }
    }
});

export const config = {
    matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};