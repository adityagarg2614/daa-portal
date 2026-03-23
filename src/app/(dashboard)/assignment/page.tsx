'use client'

import Navbar from "@/components/Navbar";
import { useUser } from "@clerk/nextjs";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";


export default function AssignmentPage() {
    return (
        <>
            <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                <div className="aspect-video rounded-xl bg-muted/50" />
                <div className="aspect-video rounded-xl bg-muted/50" />
                <div className="aspect-video rounded-xl bg-muted/50" />
            </div>
            <div className="min-h-screen flex-1 rounded-xl bg-muted/50 md:min-h-min" />
        </>
    )
}