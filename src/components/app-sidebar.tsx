"use client"
import { usePathname } from "next/navigation"

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
import { GalleryVerticalEndIcon, AudioLinesIcon, TerminalIcon, TerminalSquareIcon, BotIcon, BookOpenIcon, Settings2Icon, FrameIcon, PieChartIcon, MapIcon } from "lucide-react"
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
  const pathname = usePathname()

  const userData = {
    name: isLoaded ? (user?.fullName || user?.username || "User") : "Loading...",
    email: isLoaded ? (user?.primaryEmailAddress?.emailAddress || "") : "",
    avatar: isLoaded ? (user?.imageUrl || "/avatars/shadcn.jpg") : "/avatars/shadcn.jpg",
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/home">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <GalleryVerticalEndIcon className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">DAA Portal</span>
                  <span className="">v1.0.0</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
