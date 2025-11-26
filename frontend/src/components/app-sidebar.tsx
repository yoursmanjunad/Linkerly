"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  IconBookmark,
  IconChartBar,
  IconFolder,
  IconHelp,
  IconHome,
  IconLink,
  IconSettings,
} from "@tabler/icons-react"
import { Loader2 } from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  navMain: [
    {
      title: "Home",
      url: "/home",
      icon: IconHome,
      isActive: true,
    },
    {
      title: "URLs",
      url: "/urls",
      icon: IconLink,
      items: [
        {
          title: "All URLs",
          url: "/urls",
        },
        {
          title: "Create New",
          url: "/urls/create",
        },
      ],
    },
    {
      title: "Collections",
      url: "/collections",
      icon: IconFolder,
      items: [
        {
          title: "All Collections",
          url: "/collections",
        },
        {
          title: "Create New",
          url: "/collections/create",
        },
      ],
    },
    {
      title: "Bookmarks",
      url: "/bookmarks",
      icon: IconBookmark,
    },
    {
      title: "Analytics",
      url: "/analytics",
      icon: IconChartBar,
      items: [
        {
          title: "Overview",
          url: "/analytics",
        },
        {
          title: "URLs Performance",
          url: "/analytics/urls",
        },
        {
          title: "Collections Stats",
          url: "/analytics/collections",
        },
      ],
    },
  ],

  navSecondary: [
    {
      title: "Settings",
      url: "/settings",
      icon: IconSettings,
    },
    {
      title: "Get Help",
      url: "/help",
      icon: IconHelp,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const [user, setUser] = React.useState({
    name: "User",
    email: "user@example.com",
    avatar: "",
  })
  const [isLoading, setIsLoading] = React.useState(false)

  React.useEffect(() => {
    setIsLoading(false)
  }, [pathname])

  const handleNavigation = (url: string) => {
    if (pathname !== url) {
      setIsLoading(true)
    }
  }

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token")
        if (!token) return
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setUser({
            name: data.user.firstName || data.user.userName,
            email: data.user.email,
            avatar: data.user.profilePicUrl || "",
          })
        }
      } catch (e) {
        console.error(e)
      }
    }
    fetchUser()
  }, [])

  // Update active states based on current pathname
  const navMainWithActive = data.navMain.map(item => ({
    ...item,
    isActive: pathname.startsWith(item.url),
  }))

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link 
              href="/home" 
              onClick={() => handleNavigation("/home")}
              className="flex items-center gap-2 px-2 py-3 text-lg font-semibold w-full"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <IconLink className="h-5 w-5" />
              </div>
              <span className="group-data-[collapsible=icon]:hidden">Linkerly</span>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent>
        <NavMain items={navMainWithActive} onNavigate={handleNavigation} />
        <NavSecondary items={data.navSecondary} onNavigate={handleNavigation} className="mt-auto" />
      </SidebarContent>
      
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>

      {isLoading && (
        <div className="fixed inset-0 z-[9999] bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-300">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
            </div>
            <p className="text-sm font-medium text-muted-foreground animate-pulse">Loading...</p>
          </div>
        </div>
      )}
    </Sidebar>
  )
}