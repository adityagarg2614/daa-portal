'use client'

import Navbar from "@/components/Navbar";
import { useUser } from "@clerk/nextjs";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";


export default function AssignmentPage() {
    const { user } = useUser();
    const metadata = user?.publicMetadata as Record<string, any>;
    const name = metadata?.name;
    const rollNo = metadata?.rollNo;
    const role = metadata?.role;
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <Navbar name={name} />
                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    <div className="flex items-center gap-2 py-4">
                        <SidebarTrigger />
                    </div>
                    <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                        <div className="aspect-video rounded-xl bg-muted/50" />
                        <div className="aspect-video rounded-xl bg-muted/50" />
                        <div className="aspect-video rounded-xl bg-muted/50" />
                    </div>
                    <div className="min-h-screen flex-1 rounded-xl bg-muted/50 md:min-h-min" />
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}