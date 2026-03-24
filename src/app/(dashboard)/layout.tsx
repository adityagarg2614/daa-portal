
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
  const dbUser = await UserModel.findOne({ clerkId: userId });

  if (!dbUser) {
    // Sync Clerk metadata to reflect that user is not onboarded
    const client = await clerkClient();
    await client.users.updateUser(userId, {
      publicMetadata: { onboardingComplete: false }
    });

    // User deleted from DB but Clerk session persists
    redirect("/onboarding");
  }

  const user = await currentUser();
  const metadata = user?.publicMetadata as Record<string, any>;
  const name = metadata?.name;

  return (
    <DashboardLayoutClient name={name}>
      {children}
    </DashboardLayoutClient>
  );
}
