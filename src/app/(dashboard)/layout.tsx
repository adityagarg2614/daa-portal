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
  const user = await currentUser();
  const primaryEmail = user?.emailAddresses.find(
    (email) => email.id === user.primaryEmailAddressId
  )?.emailAddress?.toLowerCase();

  let dbUser = await UserModel.findOne({ clerkId: userId });

  if (!dbUser && primaryEmail) {
    dbUser = await UserModel.findOne({
      $or: [
        { email: primaryEmail },
        { clerkId: "pending_" + primaryEmail },
      ],
    });

    if (dbUser && dbUser.clerkId.startsWith("pending_")) {
      dbUser.clerkId = userId;
      await dbUser.save();
    }
  }

  if (!dbUser) {
    redirect("/onboarding");
  }

  // Check if user is student (admins should not access student dashboard)
  if (dbUser.role !== "student") {
    redirect("/admin"); // Redirect admins to admin dashboard
  }

  const metadata = user?.publicMetadata as Record<string, unknown>;
  const name = metadata?.name as string | undefined;
  const rollNo = metadata?.rollNo as string | undefined;

  if (
    metadata?.onboardingComplete !== true ||
    metadata?.role !== "student" ||
    metadata?.rollNo !== dbUser.rollNo ||
    metadata?.batch !== dbUser.batch ||
    metadata?.name !== dbUser.name
  ) {
    try {
      const client = await clerkClient();
      await client.users.updateUser(userId, {
        publicMetadata: {
          name: dbUser.name,
          role: "student",
          rollNo: dbUser.rollNo,
          batch: dbUser.batch,
          onboardingComplete: true,
        }
      });
    } catch (error) {
      console.error("[DashboardLayout] Failed to sync Clerk metadata:", error);
    }
  }

  return (
    <DashboardLayoutClient name={dbUser.name || name} rollNo={dbUser.rollNo || rollNo}>
      {children}
    </DashboardLayoutClient>
  );
}
