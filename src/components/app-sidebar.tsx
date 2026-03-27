"use client"

import * as React from "react"
import { useUser } from "@clerk/nextjs"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { TerminalSquareIcon, BotIcon, BookOpenIcon, Sparkles } from "lucide-react"
import Link from "next/link"

// This is sample data.
const data = {
  navMain: [
    {
      title: "Overview",
      url: "#",
      icon: (
        <TerminalSquareIcon
        />
      ),
      isActive: true,
      items: [
        {
          title: "Dashboard",
          url: "/home",
        },
      ],
    },
    {
      title: "Academic",
      url: "#",
      icon: (
        <BotIcon
        />
      ),
      items: [
        {
          title: "Assignments",
          url: "/assignment",
        },
        {
          title: "My Submissions",
          url: "/submission",
        },
        {
          title: "Results",
          url: "/results",
        },
        {
          title: "Attendance",
          url: "#",
        },
      ],
    },
    {
      title: "Updates",
      url: "#",
      icon: (
        <BookOpenIcon
        />
      ),
      items: [
        {
          title: "Announcements",
          url: "#",
        },
        {
          title: "Events",
          url: "#",
        },
        {
          title: "Notifications",
          url: "#",
        },
      ],
    },

  ],

}
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, isLoaded } = useUser()

  const metadata = user?.publicMetadata as Record<string, unknown>;
  const role = (metadata?.role as string) || "student";
  const homeUrl = role === "admin" ? "/admin" : "/home";

  // Filter or adjust navigation items based on role if needed
  const navigationItems = role === "admin"
    ? [
      {
        title: "Admin Control",
        url: "#",
        icon: <TerminalSquareIcon />,
        isActive: true,
        items: [
          { title: "Admin Dashboard", url: "/admin" },
          { title: "Manage Users", url: "/admin/users" },
        ],
      },
      ...data.navMain.filter(item => item.title !== "Overview")
    ]
    : data.navMain;

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href={homeUrl}>
                <div className="size-8 rounded-lg bg-linear-to-br from-indigo-500 via-purple-500 to-pink-500 p-1.5 text-white flex items-center justify-center shadow-lg">
                  <Sparkles className="size-5" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">Algo-Grade</span>
                  <span className="text-[10px] text-muted-foreground">Code Together</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navigationItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
