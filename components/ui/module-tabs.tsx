"use client"

import React from "react";
import Link from "next/link";
import { twMerge } from "tailwind-merge";

export interface ModuleTab {
  label: string;
  href: string;
}

interface ModuleTabsProps {
  tabs: ModuleTab[];
  activeHref?: string;
  className?: string;
}

export const ModuleTabs: React.FC<ModuleTabsProps> = ({
  tabs,
  activeHref,
  className = ""
}) => {
  if (tabs.length <= 1) return null;

  return (
    <div className={twMerge(
      "border-b border-gray-200 bg-white",
      className
    )}>
      <div className="flex gap-1 px-6 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = activeHref === tab.href || 
            (activeHref && activeHref.startsWith(tab.href) && tab.href !== "/");
          
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={twMerge(
                "shrink-0 px-4 py-3 text-sm font-medium transition-colors duration-200",
                "whitespace-nowrap border-b-2",
                isActive
                  ? "text-blue-600 border-blue-600"
                  : "text-gray-600 border-transparent hover:text-gray-900 hover:border-gray-300"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
};
