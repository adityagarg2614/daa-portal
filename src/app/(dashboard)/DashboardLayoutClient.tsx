'use client'

import React from "react";
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
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Navbar name={name} rollNo={rollNo} />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
