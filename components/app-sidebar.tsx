"use client"

import * as React from "react"
import { NavMain } from "@/components/nav-main"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { DashboardIcon, InventoryIcon, NextJsIcon, PanelRight, SettingIcon, SalesIcon } from "@/components/AppIcon"
import { useSidebar } from "@/components/ui/sidebar"

// This is sample data.
export const navData = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: DashboardIcon
    },
    {
      title: "Sales",
      url: "/sales",
      icon: SalesIcon
    },
    {
      title: "Inventory",
      url: "#",
      icon: InventoryIcon,
      items: [
        {
          title: "Items",
          url: "/inventory/items",
        },
        {
          title: "Item Categories",
          url: "/inventory/categories",
        },
        {
          title: "Item Units",
          url: "/inventory/units",
        },
        {
          title: "Stock Adjustments",
          url: "/inventory/stock",
        },
      ],
    },
    {
      title: "Settings",
      url: "/settings/taxes",
      icon: SettingIcon
    }
  ]

import { usePathname } from "next/navigation"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { state, toggleSidebar } = useSidebar()
  const pathname = usePathname()

  const findActiveMenu = (item: any, pathname: string) => {
    const isChildActive = item.items?.some((subItem: any) => {
      return pathname === subItem.url || pathname.startsWith(subItem.url + "/")
    })
    const isSelfActive = pathname === item.url
    
    const pathSegments = pathname.split('/').filter(Boolean)
    const currentModule = pathSegments[0] 
    
    const isModuleActive = (() => {
      if (item.url === "#") {
        const itemTitleLower = item.title.toLowerCase()
        return itemTitleLower === currentModule || 
               item.items?.some((subItem: any) => subItem.url.includes(`/${currentModule}/`))
      } else {
        const urlSegments = item.url.replace(/\/$/, '').split('/').filter(Boolean)
        const itemModule = urlSegments[0]
        return itemModule === currentModule && pathname.startsWith(`/${currentModule}/`)
      }
    })()
    
    return {
      isActive: isSelfActive || isChildActive || isModuleActive,
      isExpanded: isSelfActive || isChildActive || isModuleActive,
      isChildActive,
      isModuleActive
    }
  }

  const navMain = React.useMemo(() => {
    return navData.map((item) => {
      const activeState = findActiveMenu(item, pathname)
       
      return {
        ...item,
        isActive: activeState.isActive,
        isExpanded: activeState.isExpanded,
        items: item.items?.map(subItem => ({
           ...subItem,
           isActive: pathname === subItem.url || pathname.startsWith(subItem.url + "/")
        }))
      }
    })
  }, [pathname])
  
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        {state === "collapsed" ? (
          <div className="flex items-center justify-center h-full">
            <button
              onClick={toggleSidebar}
              className="p-1.5 rounded-lg hover:bg-sidebar-accent transition-colors relative group border cursor-e-resize"
            >
              <NextJsIcon className="size-6 group-hover:opacity-0 transition-opacity cursor-e-resize" />
              <PanelRight className="size-5 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-e-resize" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between px-2">
            <div className="text-2xl font-medium">Billing</div>
            <SidebarTrigger/>
          </div>
        )}
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}