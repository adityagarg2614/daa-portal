'use client'

import { Sparkles, LayoutDashboard, Bell } from "lucide-react";
import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";

interface NavbarProps {
    name?: string;
}

export default function Navbar({ name }: NavbarProps) {
    const { isLoaded } = useUser();
    const firstName = isLoaded && name ? name.split(' ')[0] : '...';

    return (
        <nav className="bg-background/40 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                {/* Logo Section */}
                <Link
                    href="/home"
                    className="flex items-center gap-3 group transition-all duration-300"
                >
                    <div className="size-10 rounded-xl bg-linear-to-br from-indigo-500 via-purple-500 to-pink-500 p-2 text-white flex items-center justify-center shadow-lg group-hover:shadow-indigo-500/25 group-hover:scale-110 transition-all">
                        <Sparkles className="size-6 animate-pulse" />
                    </div>

                    <div className="flex flex-col font-sans">
                        <span className="font-bold text-xl bg-linear-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent tracking-tight">
                            Algo-Grade
                        </span>
                        <span className="text-[10px] text-indigo-300/60 font-medium uppercase tracking-[0.2em] -mt-1 group-hover:text-indigo-300 transition-colors">
                            Code Together
                        </span>
                    </div>
                </Link>

                {/* Right Side Actions */}
                <div className="flex items-center gap-6">
                    {/* Greeting & Quick Actions */}
                    <div className="hidden md:flex items-center gap-4 pr-4 border-r border-white/10">
                        <div className="flex flex-col items-end mr-2">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none mb-1">Welcome back</span>
                            <span className="text-sm font-semibold text-white">Hey, {firstName}! </span>
                        </div>

                        <button className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-white transition-all">
                            <Bell className="size-5" />
                        </button>
                    </div>

                    <div className="flex items-center gap-3 pl-2">
                        <UserButton
                            appearance={{
                                elements: {
                                    userButtonAvatarBox: "size-9 border-2 border-indigo-500/50 hover:border-indigo-400 transition-all shadow-lg"
                                }
                            }}
                        />
                    </div>
                </div>
            </div>
        </nav>
    );
}