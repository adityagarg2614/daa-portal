
import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import UserModel from "@/models/User";
import DashboardLayoutClient from "./DashboardLayoutClient";


export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  await connectDB();

  // First try to find by actual clerkId
  let dbUser = await UserModel.findOne({ clerkId: userId });

  // If not found, check if there's a pending admin record for this email
  if (!dbUser) {
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const email = clerkUser.emailAddresses.find(
      (e) => e.id === clerkUser.primaryEmailAddressId
    )?.emailAddress?.toLowerCase();

    if (email) {
      // Check for pending admin record
      dbUser = await UserModel.findOne({
        $or: [
          { email: email },
          { clerkId: "pending_" + email }
        ]
      });

      // If found and it's an admin, update the clerkId
      if (dbUser && dbUser.role === "admin" && dbUser.clerkId.startsWith("pending_")) {
        dbUser.clerkId = userId;
        await dbUser.save();
        console.log("[AdminLayout] ✅ Updated admin clerkId from pending to:", userId);
      }
    }
  }

  if (!dbUser) {
    // Sync Clerk metadata to reflect that user is not onboarded
    const client = await clerkClient();
    await client.users.updateUser(userId, {
      publicMetadata: { onboardingComplete: false }
    });

    // User deleted from DB but Clerk session persists
    redirect("/onboarding");
  }

  // Check if user is admin
  if (dbUser.role !== "admin") {
    redirect("/home"); // Redirect non-admins to student dashboard
  }

  const user = await currentUser();
  const metadata = user?.publicMetadata as Record<string, unknown>;
  const name = metadata?.name as string | undefined;
  const rollNo = metadata?.rollNo as string | undefined;

  return (
    <DashboardLayoutClient name={name}>
      {children}
    </DashboardLayoutClient>
  );
}
