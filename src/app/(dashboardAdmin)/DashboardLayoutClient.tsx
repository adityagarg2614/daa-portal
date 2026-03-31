'use client'

import React from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebarAdmin } from "@/components/app-sidebar-admin";

export default function DashboardLayoutClient({
  children,
  name,
}: {
  children: React.ReactNode;
  name?: string;
}) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <AppSidebarAdmin />
      <SidebarInset>
        <Navbar name={name} />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0" key={pathname}>
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
