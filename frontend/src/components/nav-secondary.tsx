"use client"

import * as React from "react"
import { type Icon } from "@tabler/icons-react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

import { usePathname } from "next/navigation"
import Link from "next/link"

export function NavSecondary({
  items,
  onNavigate,
  ...props
}: {
  items: {
    title: string
    url: string
    icon: Icon
  }[]
  onNavigate: (url: string) => void
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const pathname = usePathname()

  const handleLinkClick = (url: string) => {
    if (pathname !== url) {
      onNavigate(url)
    }
  }

  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={pathname === item.url}>
                <Link 
                  href={item.url}
                  onClick={() => handleLinkClick(item.url)}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <item.icon />
                    <span>{item.title}</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
