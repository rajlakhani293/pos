"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import React from "react"
import { cn } from "@/lib/utils"
import { PersonPlusIcon, TagIcon, TaxIcon } from "@/components/AppIcon"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"

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
    <div className="flex h-full flex-col bg-white">
     <div className="border-b border-slate-200 px-8 py-6 flex flex-col gap-2">
       <div className="">
        <h2 className="text-2xl font-semibold text-slate-900">Settings</h2>
      </div>

      <div className="">
        <Tabs value={activeTab} orientation="horizontal" className="gap-0 w-full">
          <TabsList className="w-fit">
            {data.navMain.map((item) => {
              const Icon = item.icon
              return (
                <TabsTrigger
                  key={item.url}
                  value={item.url}
                  onClick={() => router.push(item.url)}
                  className={cn(
                    "justify-start px-3 py-1 text-sm font-medium text-slate-600",
                    "data-[state=active]:text-slate-900"
                  )}
                >
                  <Icon className="h-4 w-4 text-current" />
                  {item.title}
                </TabsTrigger>
              )
            })}
          </TabsList>
        </Tabs>
      </div>
     </div>

      <main className="flex-1 overflow-y-auto px-8 py-6">
        {children}
      </main>
    </div>
  )
}
