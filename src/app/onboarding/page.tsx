import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { normalizeBatch } from "@/lib/batch";
import { connectDB } from "@/lib/db";
import UserModel from "@/models/User";

export default async function OnboardingPage() {
    const { userId, sessionClaims } = await auth();

    if (!userId) {
        redirect("/");
    }

    await connectDB();

    const metadata = (sessionClaims?.metadata as Record<string, unknown>) || {};
    const metadataEmail = metadata?.email as string | undefined;
    const clerkUser = await currentUser();
    const primaryEmail = clerkUser?.emailAddresses.find(
        (email) => email.id === clerkUser.primaryEmailAddressId
    )?.emailAddress?.toLowerCase();

    const dbUser = await UserModel.findOne({
        $or: [
            { clerkId: userId },
            ...(primaryEmail
                ? [
                    { email: primaryEmail },
                    { clerkId: "pending_" + primaryEmail },
                ]
                : []),
            ...(metadataEmail
                ? [
                    { email: metadataEmail.toLowerCase() },
                    { clerkId: "pending_" + metadataEmail.toLowerCase() },
                ]
                : []),
        ],
    });

    if (dbUser && dbUser.clerkId.startsWith("pending_")) {
        dbUser.clerkId = userId;
        await dbUser.save();
    }

    if (dbUser?.role === "admin") {
        redirect("/admin");
    }

    if (dbUser?.role === "student" && dbUser.rollNo && dbUser.batch) {
        redirect("/home");
    }

    return (
        <OnboardingForm
            initialName={dbUser?.name || clerkUser?.fullName || ""}
            initialBatch={normalizeBatch(dbUser?.batch) ?? normalizeBatch(metadata?.batch) ?? "A"}
        />
    );
}
