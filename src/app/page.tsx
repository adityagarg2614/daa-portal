import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import LandingPage from "./(auth)/LandingPage";

export default async function RootPage() {
    const { userId, sessionClaims } = await auth();

    if (userId) {
        const metadata = (sessionClaims?.metadata as Record<string, unknown>) || {};
        const onboardingComplete = metadata?.onboardingComplete === true;
        const rollNo = metadata?.rollNo as string | undefined;
        const role = metadata?.role as string | undefined;

        if (!onboardingComplete || !rollNo) {
            redirect("/onboarding");
        }

        // Route to the correct dashboard based on role
        if (role === "admin") {
            redirect("/admin");
        }

        redirect("/home");
    }

    // Unauthenticated: show the landing page
    return <LandingPage />;
}
