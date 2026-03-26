"use client"

import { useClerk, useUser } from "@clerk/nextjs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LogOut, UserCircle } from "lucide-react"

export function NavUser() {
  const { user } = useUser()
  const { state } = useSidebar()
  const { openUserProfile, signOut } = useClerk()
  const isExpanded = state === "expanded"

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user?.imageUrl} alt={user?.fullName || undefined} />
                <AvatarFallback className="rounded-lg">
                  {user?.fullName?.charAt(0) || user?.username?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              {isExpanded && (
                <>
                  <div className="grid flex-1 text-left text-sm leading-tight overflow-hidden">
                    <span className="truncate font-medium">{user?.fullName || user?.username || "User"}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user?.primaryEmailAddress?.emailAddress || ""}
                    </span>
                  </div>
                </>
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side="right"
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user?.imageUrl} alt={user?.fullName || undefined} />
                  <AvatarFallback className="rounded-lg">
                    {user?.fullName?.charAt(0) || user?.username?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight overflow-hidden">
                  <span className="truncate font-medium">{user?.fullName || user?.username || "User"}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user?.primaryEmailAddress?.emailAddress || ""}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => openUserProfile()}
            >
              <UserCircle className="mr-2 h-4 w-4" />
              User Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer text-destructive focus:text-destructive"
              onClick={() => signOut()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
