"use client"

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { 
  SidebarContainer, 
  NavItem, 
  SidebarDropdown, 
  SidebarDropdownItem 
} from "@/components/ui/sidebar";
import SidebarHeader from "@/components/ui/sidebar-header";
import { DashboardIcon, InventoryIcon, SettingIcon, SalesIcon } from "@/components/AppIcon";

// Navigation data
const navData = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <DashboardIcon className="w-5 h-5" />
  },
  {
    label: "Sales",
    href: "/sales",
    icon: <SalesIcon className="w-5 h-5" />
  },
  {
    label: "Inventory",
    icon: <InventoryIcon className="w-5 h-5" />,
    children: [
      {
        label: "Items",
        href: "/inventory/items"
      },
      {
        label: "Item Categories", 
        href: "/inventory/categories"
      },
      {
        label: "Item Units",
        href: "/inventory/units"
      }
    ]
  },
  {
    label: "Settings",
    href: "/settings/taxes",
    icon: <SettingIcon className="w-5 h-5" />
  }
];

export function AppSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(new Set());

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const closeMobile = () => {
    setIsMobileOpen(false);
  };

  const toggleDropdown = (label: string) => {
    setOpenDropdowns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(label)) {
        newSet.delete(label);
      } else {
        newSet.add(label);
      }
      return newSet;
    });
  };

  const isActive = (href: string) => {
    if (href === "/settings/taxes" && pathname.startsWith("/settings/")) {
      return true;
    }
    return pathname === href;
  };

  const isDropdownActive = (children?: { href: string }[]) => {
    return children?.some(child => isActive(child.href));
  };

  const isDropdownOpen = (label: string, children?: { href: string }[]) => {
    return openDropdowns.has(label) || isDropdownActive(children);
  };

  const renderNavItems = (items: typeof navData) => {
    return items.map((item) => {
      if (item.children && item.children.length > 0) {
        return (
          <SidebarDropdown
            key={item.label}
            icon={item.icon}
            label={item.label}
            firstChildHref={item.children[0]?.href}
            isCollapsed={isCollapsed}
            isMobileOpen={isMobileOpen}
            activeTooltip={activeTooltip}
            setActiveTooltip={setActiveTooltip}
            isOpen={isDropdownOpen(item.label, item.children) || false}
            onToggle={() => toggleDropdown(item.label)}
            isActive={isDropdownActive(item.children)}
          >
            {item.children.map((child) => (
              <SidebarDropdownItem
                key={child.label}
                href={child.href}
                label={child.label}
                isActive={isActive(child.href)}
              />
            ))}
          </SidebarDropdown>
        );
      }

      return (
        <NavItem
          key={item.label}
          icon={item.icon}
          label={item.label}
          href={item.href || "#"}
          isCollapsed={isCollapsed}
          isMobileOpen={isMobileOpen}
          activeTooltip={activeTooltip}
          setActiveTooltip={setActiveTooltip}
          isActive={isActive(item.href || "#")}
        />
      );
    });
  };

  return (
    <SidebarContainer
      isCollapsed={isCollapsed}
      isMobileOpen={isMobileOpen}
      isResizing={false}
      sidebarRef={React.useRef(null)}
      header={
        <SidebarHeader
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          isMobileOpen={isMobileOpen}
          closeMobile={closeMobile}
        />
      }
      toggleSidebar={toggleSidebar}
      closeMobile={closeMobile}
    >
      {renderNavItems(navData)}
    </SidebarContainer>
  );
}
