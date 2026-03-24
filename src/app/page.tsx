import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import LandingPage from "./(auth)/LandingPage";
import { connectDB } from "@/lib/db";
import UserModel from "@/models/User";

export default async function RootPage() {
    const { userId, sessionClaims } = await auth();

    if (userId) {
        await connectDB();
        const dbUser = await UserModel.findOne({ clerkId: userId });

        const metadata = (sessionClaims?.metadata as Record<string, unknown>) || {};
        const onboardingComplete = metadata?.onboardingComplete === true;
        const rollNo = metadata?.rollNo as string | undefined;
        const role = metadata?.role as string | undefined;

        if (!dbUser || !onboardingComplete || !rollNo) {
            if (dbUser && (!onboardingComplete || !rollNo)) {
                // Metadata missing but user exists, maybe sync? 
                // For now just redirect to onboarding
            } else if (!dbUser && onboardingComplete) {
                // Sync Clerk metadata to reflect that user is not onboarded
                const client = await clerkClient();
                await client.users.updateUser(userId, {
                    publicMetadata: { onboardingComplete: false }
                });
            }
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
