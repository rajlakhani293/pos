"use client"

import * as React from "react"
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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
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
          // Collapsed state: Use DropdownMenu for ALL items
          if (state === "collapsed") {
            return (
              <SidebarMenuItem key={item.title}>
                <NavCollapsedItem item={item} />
              </SidebarMenuItem>
            )
          }

          // Expanded state: Standard rendering
          if (!item.items?.length) {
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  isActive={item.isActive}
                  className="data-[active=true]:bg-blue-100 hover:data-[active=true]:bg-blue-50"
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
                    className="data-[active=true]:bg-blue-100 hover:data-[active=true]:bg-blue-50 cursor-pointer"
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
                          className="data-[active=true]:bg-blue-100 hover:data-[active=true]:bg-blue-50"
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
  const [isOpen, setIsOpen] = React.useState(false)
  const [isSingleItemOpen, setIsSingleItemOpen] = React.useState(false)
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const singleTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setIsOpen(true)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false)
    }, 500) 
  }

  const handleSingleItemMouseEnter = () => {
    if (singleTimeoutRef.current) {
      clearTimeout(singleTimeoutRef.current)
      singleTimeoutRef.current = null
    }
    setIsSingleItemOpen(true)
  }

  const handleSingleItemMouseLeave = () => {
    singleTimeoutRef.current = setTimeout(() => {
      setIsSingleItemOpen(false)
    }, 500) 
  }

  // For items without sub-items, show direct link instead of dropdown
  if (!item.items?.length) {
    return (
      <DropdownMenu open={isSingleItemOpen} onOpenChange={setIsSingleItemOpen} modal={false}>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton
            tooltip={undefined}
            isActive={item.isActive}
            onMouseEnter={handleSingleItemMouseEnter}
            onMouseLeave={handleSingleItemMouseLeave}
            className="data-[active=true]:bg-blue-100 hover:data-[active=true]:bg-blue-50 cursor-pointer"
          >
            <Link href={item.url} className="flex items-center justify-center w-full">
              {item.icon && <item.icon className="w-5! h-5!" />}
            </Link>
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="right"
          align="start"
          className="min-w-48"
          sideOffset={14}
          onMouseEnter={handleSingleItemMouseEnter}
          onMouseLeave={handleSingleItemMouseLeave}
        >
          <DropdownMenuItem asChild>
            <Link href={item.url} className={`w-full cursor-pointer ${item.isActive ? 'bg-blue-50' : ''}`}>
              {item.title}
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // For items with sub-items, show dropdown
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          tooltip={undefined}
          isActive={item.isActive || item.isExpanded}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="data-[active=true]:bg-blue-100 hover:data-[active=true]:bg-blue-50 cursor-pointer"
        >
          {item.icon && <item.icon className="w-5! h-5!" />}
          {item.items?.length ? <ChevronRightIcon className="ml-auto transition-transform duration-200" /> : null}
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="right"
        align="start"
        className="min-w-48"
        sideOffset={14}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {item.items?.length ? (
          <>
            <DropdownMenuLabel>{item.title}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {item.items.map((subItem) => (
              <DropdownMenuItem key={subItem.title} asChild>
                <Link href={subItem.url} className={`w-full cursor-pointer ${subItem.isActive ? 'bg-blue-50' : ''}`}>
                  {subItem.title}
                </Link>
              </DropdownMenuItem>
            ))}
          </>
        ) : (
          <DropdownMenuItem asChild>
            <Link href={item.url} className={`w-full cursor-pointer ${item.isActive ? 'bg-blue-50' : ''}`}>
              {item.title}
            </Link>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
