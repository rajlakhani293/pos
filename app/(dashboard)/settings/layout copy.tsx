"use client"

import { usePathname, useRouter } from "next/navigation"
import React from "react"
import { cn } from "@/lib/utils"
import { PersonPlusIcon, TagIcon, TaxIcon } from "@/components/AppIcon"

const data = {
  navMain: [
    {
      title: "Tax",
      url: "/settings/taxes",
      icon: TaxIcon
    },
    {
      title: "Brands", 
      url: "/settings/brands",
      icon: TagIcon
    },
    {
      title: "Parties", 
      url: "/settings/parties",
      icon: PersonPlusIcon
    },
    {
      title: "Customer Ledger", 
      url: "/settings/ledger",
      icon: PersonPlusIcon
    },
  ]
}

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()

  const activeTab = React.useMemo(() => {
    const matches = data.navMain.filter((item) => pathname.startsWith(item.url))
    if (!matches.length) return data.navMain[0]?.url
    return matches.sort((a, b) => b.url.length - a.url.length)[0].url
  }, [pathname])

  return (
    <div className="flex h-full bg-white">
      {/* Left Navigation Tabs */}
      <div className="w-70 bg-gray-100">
       <div className="p-4">
         <div className="p-4">
          <h2 className="text-2xl font-semibold text-slate-900">Settings</h2>
          <p className="text-sm text-slate-500 mt-1">Manage your account</p>
        </div>
        
        <div className="px-4 pb-4">
          <div className="space-y-1">
            {data.navMain.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.url
              return (
                <button
                  key={item.url}
                  onClick={() => router.push(item.url)}
                  className={cn(
                    "w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                    isActive 
                      ? " text-slate-900" 
                      : "text-slate-600 hover:text-slate-900 bg-white"
                  )}
                >
                  <Icon className={cn(
                    "h-5 w-5 mr-3 transition-colors",
                    isActive ? "text-slate-900" : "text-slate-400"
                  )} />
                  <span>{item.title}</span>
                </button>
              )
            })}
          </div>
        </div>
       </div>
      </div>

      {/* Right Content Area */}
      <div className="flex-1 py-6 pr-6 bg-gray-100 h-full">
        <main className="rounded-2xl border-2 bg-white p-4 h-full">
          {children}
        </main>
      </div>
    </div>
  )
}
