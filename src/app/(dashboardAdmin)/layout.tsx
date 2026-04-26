
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
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

  const user = await currentUser();
  const metadata = user?.publicMetadata as Record<string, unknown>;
  const name = metadata?.name as string | undefined;

  return (
    <DashboardLayoutClient name={name}>
      {children}
    </DashboardLayoutClient>

  );
}
