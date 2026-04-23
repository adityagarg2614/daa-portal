
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

    // User deleted from DB but Clerk session persist
    redirect("/onboarding");
  }

  // Check if user is student (admins should not access student dashboard)
  if (dbUser.role !== "student") {
    redirect("/admin"); // Redirect admins to admin dashboard
  }

  const user = await currentUser();
  const metadata = user?.publicMetadata as Record<string, unknown>;
  const name = metadata?.name as string | undefined;
  const rollNo = metadata?.rollNo as string | undefined;

  return (
    <DashboardLayoutClient name={name} rollNo={rollNo}>
      {children}
    </DashboardLayoutClient>
  );
}
