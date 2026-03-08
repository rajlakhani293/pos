"use client"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { ChevronRightIcon } from "./AppIcon"
import { useSidebar } from "@/components/ui/sidebar"
import Link from "next/link"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: any
    isActive?: boolean
    isExpanded?: boolean
    items?: {
      title: string
      url: string
      isActive?: boolean
    }[]
  }[]
}) {
  const { state } = useSidebar()

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items?.map((item) => {
          if (state === "collapsed") {
            return (
              <SidebarMenuItem key={item.title}>
                <NavCollapsedItem item={item} />
              </SidebarMenuItem>
            )
          }

          if (!item.items?.length) {
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  isActive={item.isActive}
                  className="data-[active=true]:bg-blue-100 hover:data-[active=true]:bg-blue-50 py-3 h-10"
                >
                  <Link href={item.url}>
                    {item.icon && <item.icon className="w-5! h-5!" />}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          }

          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={item.isExpanded}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={item.isActive}
                    className="data-[active=true]:bg-blue-100 hover:data-[active=true]:bg-blue-50 cursor-pointer py-3 h-10"
                  >
                    {item.icon && <item.icon className="w-5! h-5!" />}
                    <span>{item.title}</span>
                    <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 cursor-pointer" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={subItem.isActive}
                          className="data-[active=true]:bg-blue-100 hover:data-[active=true]:bg-blue-50 h-9"
                        >
                          <Link href={subItem.url}>
                            <span>{subItem.title}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
// Update NavCollapsedItem type as well
function NavCollapsedItem({
  item,
}: {
  item: {
    title: string
    url: string
    icon?: any
    isActive?: boolean
    isExpanded?: boolean
    items?: {
      title: string
      url: string
      isActive?: boolean
    }[]
  }
}) {

  if (!item.items?.length) {
    return (
      <Link href={item.url} className="flex items-center justify-center w-full">
      <SidebarMenuButton
        tooltip={item.title}
        isActive={item.isActive}
        className="data-[active=true]:bg-blue-100 hover:data-[active=true]:bg-blue-50 cursor-pointer py-3 h-12"
      >
          {item.icon && <item.icon className="w-5! h-5!" />}
      </SidebarMenuButton>
        </Link>
    )
  }

  return (
    <SidebarMenuButton
      asChild
      tooltip={item.title}
      isActive={item.isActive || item.isExpanded}
      className="data-[active=true]:bg-blue-100 hover:data-[active=true]:bg-blue-50 cursor-pointer py-3 h-12"
    >
      <Link href={item.items?.[0]?.url || item.url} className="flex items-center justify-center w-full">
        {item.icon && <item.icon className="w-5! h-5!" />}
        {item.items?.length ? <ChevronRightIcon className="ml-auto transition-transform duration-200" /> : null}
      </Link>
    </SidebarMenuButton>
  )
}