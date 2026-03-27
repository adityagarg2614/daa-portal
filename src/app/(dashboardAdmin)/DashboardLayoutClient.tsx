'use client'

import React from "react";
import Navbar from "@/components/Navbar";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebarAdmin } from "@/components/app-sidebar-admin";

export default function DashboardLayoutClient({
  children,
  name,
  rollNo,
}: {
  children: React.ReactNode;
  name?: string;
  rollNo?: string;
}) {
  return (
    <SidebarProvider>
      <AppSidebarAdmin />
      <SidebarInset>
        <Navbar name={name} />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
