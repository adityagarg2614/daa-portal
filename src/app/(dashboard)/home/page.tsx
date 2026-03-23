'use client'

import React from "react";
import { useUser } from "@clerk/nextjs";
import Navbar from "@/components/Navbar";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";



export default function HomePage() {
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
