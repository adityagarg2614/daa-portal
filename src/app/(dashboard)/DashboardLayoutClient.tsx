'use client'

import React from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function DashboardLayoutClient({
  children,
  name,
  rollNo,
}: {
  children: React.ReactNode;
  name?: string;
  rollNo?: string;
}) {
  const pathname = usePathname();
  const isFocusedWorkspace = /^\/assignment\/[^/]+$/.test(pathname);

  return (
    <SidebarProvider>
      {isFocusedWorkspace ? (
        <main className="flex min-h-svh w-full flex-col">
          <Navbar name={name} rollNo={rollNo} />
          <div className="flex flex-1 flex-col" key={pathname}>
            {children}
          </div>
        </main>
      ) : (
        <>
          <AppSidebar />
          <SidebarInset>
            <Navbar name={name} rollNo={rollNo} />
            <div className="flex flex-1 flex-col gap-4 p-4 pt-0" key={pathname}>
              {children}
            </div>
          </SidebarInset>
        </>
      )}
    </SidebarProvider>
  );
}
