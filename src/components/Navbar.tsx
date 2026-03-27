'use client'

import { SidebarTrigger } from "@/components/ui/sidebar";
import { useSidebar } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";

interface NavbarProps {
    name?: string;
    rollNo?: string;
}

export default function Navbar({ name, rollNo }: NavbarProps) {
    const { state } = useSidebar()
    const isCollapsed = state === "collapsed"

    return (
        <nav className="bg-background/40 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-6 h-12 flex items-center justify-between">
                <SidebarTrigger className={isCollapsed ? "-ml-2" : ""} />

                {name && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{name}</span>
                        {rollNo && (
                            <span className="px-2 py-0.5 text-xs font-bold uppercase rounded-md bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                                {rollNo.toUpperCase()}
                            </span>
                        )}
                    </div>
                )}

                <ThemeToggle />
            </div>
        </nav>
    );
}