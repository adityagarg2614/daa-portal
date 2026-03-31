import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import LandingPage from "./(auth)/LandingPage";
import { connectDB } from "@/lib/db";
import UserModel from "@/models/User";

export default async function RootPage() {
    const { userId, sessionClaims } = await auth();

    if (userId) {
        await connectDB();

        console.log("[RootPage] User signed in:", userId);

        // First try to find by actual clerkId
        let dbUser = await UserModel.findOne({ clerkId: userId });
        console.log("[RootPage] Initial DB lookup:", dbUser ? "Found" : "Not found");

        // If not found, check if there's a pending admin record for this email
        if (!dbUser) {
            const client = await clerkClient();
            const clerkUser = await client.users.getUser(userId);
            const email = clerkUser.emailAddresses.find(
                (e) => e.id === clerkUser.primaryEmailAddressId
            )?.emailAddress?.toLowerCase();

            console.log("[RootPage] Looking for pending admin with email:", email);

            if (email) {
                // Check for pending admin record
                dbUser = await UserModel.findOne({
                    $or: [
                        { email: email },
                        { clerkId: "pending_" + email }
                    ]
                });

                console.log("[RootPage] Pending admin lookup:", dbUser ? "Found" : "Not found");

                // If found and it's an admin, update the clerkId
                if (dbUser && dbUser.role === "admin" && dbUser.clerkId.startsWith("pending_")) {
                    dbUser.clerkId = userId;
                    await dbUser.save();
                    console.log("[RootPage] ✅ Updated admin clerkId from pending to:", userId);
                }
            }
        }

        const metadata = (sessionClaims?.metadata as Record<string, unknown>) || {};
        const onboardingComplete = metadata?.onboardingComplete === true;
        const rollNo = metadata?.rollNo as string | undefined;
        const role = metadata?.role as string | undefined;

        console.log("[RootPage] Metadata:", { onboardingComplete, rollNo, role });
        console.log("[RootPage] DB User role:", dbUser?.role);

        // Check if user is admin from DB (even if Clerk metadata is not updated yet)
        const isAdminFromDB = dbUser?.role === "admin";
        const isAdminFromMetadata = role === "admin";
        const isAdmin = isAdminFromDB || isAdminFromMetadata;

        // If user is admin in DB but not in Clerk metadata, update Clerk
        if (isAdminFromDB && !isAdminFromMetadata) {
            const client = await clerkClient();
            await client.users.updateUser(userId, {
                publicMetadata: {
                    ...metadata,
                    role: "admin",
                    onboardingComplete: true,
                },
            });
            console.log("[RootPage] ✅ Updated Clerk metadata for admin:", userId);
            // Redirect to admin dashboard
            redirect("/admin");
        }

        // Admins bypass onboarding - redirect directly to admin dashboard
        if (isAdmin) {
            console.log("[RootPage] Redirecting admin to /admin");
            redirect("/admin");
        }

        // For students, check onboarding status
        if (!dbUser || !onboardingComplete || !rollNo) {
            console.log("[RootPage] Redirecting to onboarding (student flow)");
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

        console.log("[RootPage] Redirecting to /home");
        redirect("/home");
    }

    // Unauthenticated: show the landing page
    return <LandingPage />;
}
