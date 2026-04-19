"use client"

import { usePathname, useRouter } from "next/navigation"
import React from "react"
import { cn } from "@/lib/utils"
import { BranchIcon, BuildingIcon, CreditCardIcon, PersonPlusIcon, TagIcon, TaxIcon } from "@/components/AppIcon"

const data = {
  navMain: [
    {
      title: "Companies",
      url: "/settings/companies",
      icon: BuildingIcon
    },
    {
      title: "Branches",
      url: "/settings/branches",
      icon: BranchIcon
    },
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
    // {
    //   title: "Customer Ledger",
    //   url: "/settings/ledger",
    //   icon: PersonPlusIcon
    // },
    {
      title: "Payments",
      url: "/settings/payments",
      icon: CreditCardIcon
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
      <div className="w-64 shrink-0">
        <div className="p-4 h-full space-y-4">
          <div className="">
            <h2 className="text-2xl font-semibold text-slate-900">Settings</h2>
          </div>

          <div className="">
            <div className="space-y-1">
              {data.navMain.map((item) => {
                const Icon = item.icon
                const isActive = activeTab === item.url
                return (
                  <button
                    key={item.url}
                    onClick={() => router.push(item.url)}
                    className={cn(
                      "w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 border cursor-pointer",
                      isActive
                        ? " text-blue-600 border-blue-500 bg-blue-50 hover:bg-blue-100 hover:text-blue-700"
                        : " bg-white hover:bg-gray-100/60"
                    )}
                  >
                    <Icon className={cn(
                      "h-5 w-5 mr-3 transition-colors",
                      isActive ? "text-blue-500" : ""
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
      <div className="flex-1 py-6 pr-6 h-full">
        <main className="rounded-2xl border bg-gray-100/5 p-6 h-full overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
