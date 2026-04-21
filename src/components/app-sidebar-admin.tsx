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
import { TerminalSquareIcon, BotIcon, BookOpenIcon, Sparkles, Users, Megaphone } from "lucide-react"
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
          url: "/admin",
        },
      ],
    },
    {
      title: "Management",
      url: "#",
      icon: (
        <BotIcon
        />
      ),
      items: [
        {
          title: "Users",
          url: "/admin/users",
        },
        {
          title: "Students",
          url: "/admin/students",
        },
        {
          title: "Create Admin",
          url: "/admin/create-admin",
        },
        {
          title: "Assignments",
          url: "/admin/assignments",
        },
        {
          title: "Create Assignment",
          url: "/admin/assignments/create",
        },
        {
          title: "Problem Bank",
          url: "/admin/problems",
        },
        {
          title: "Create Problem",
          url: "/admin/problems/create",
        },
      ],
    },
    {
      title: "Updates",
      url: "#",
      icon: (
        <Megaphone
        />
      ),
      items: [
        {
          title: "Announcements",
          url: "/admin/announcements",
        },
      ],
    },

  ],

}
export function AppSidebarAdmin({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
          { title: "Manage Attendance", url: "/admin/handle-attendance" },
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
