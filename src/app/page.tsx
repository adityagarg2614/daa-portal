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
        const role = metadata?.role as string | undefined;

        // Check if user is admin from DB or metadata
        const isAdmin = dbUser?.role === "admin" || role === "admin";

        // If admin, redirect to admin dashboard
        if (isAdmin) {
            // Update Clerk metadata if not already set (one-time update)
            if (role !== "admin") {
                try {
                    const client = await clerkClient();
                    await client.users.updateUser(userId, {
                        publicMetadata: {
                            ...metadata,
                            role: "admin",
                            onboardingComplete: true,
                        },
                    });
                } catch (err) {
                    console.error("[RootPage] Failed to update Clerk metadata:", err);
                }
            }
            return redirect("/admin");
        }

        // For students, check onboarding status
        const onboardingComplete = metadata?.onboardingComplete === true;
        const rollNo = metadata?.rollNo as string | undefined;

        if (!dbUser || !onboardingComplete || !rollNo) {
            return redirect("/onboarding");
        }

        return redirect("/home");
    }

    // Unauthenticated: show the landing page
    return <LandingPage />;
}
