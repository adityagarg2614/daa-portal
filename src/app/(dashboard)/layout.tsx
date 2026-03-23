'use client'

import { useUser } from "@clerk/nextjs";
import Navbar from "@/components/Navbar";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useUser();
  const metadata = user?.publicMetadata as Record<string, any>;
  const name = metadata?.name;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Navbar name={name} />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center gap-2 py-4">
            <SidebarTrigger />
          </div>
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
