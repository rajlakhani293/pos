"use client";

import { useState } from "react";
import { IoMenu } from "react-icons/io5";
import { IoMdClose, IoIosArrowBack } from "react-icons/io";
import { useRouter } from "next/navigation";
import { twMerge } from "tailwind-merge";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { RiNextjsFill } from "react-icons/ri";
import { PersonPlusIcon, TagIcon, TaxIcon } from "@/components/AppIcon";

const settingsMenu = {
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
    }
  ]
};

// Memoize the menu to prevent re-renders
const MemoizedSettingsMenu = settingsMenu;

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSettingsSidebarCollapsed, setIsSettingsSidebarCollapsed] = useState(false);
  const [isSettingsMobileOpen, setIsSettingsMobileOpen] = useState(false);

  return (
    <>
      <div className="relative flex w-screen h-screen overflow-hidden bg-gray-50 p-2">
        {/* Backdrop blur overlay for mobile sidebar */}
        {isSettingsMobileOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-xs z-40"
            onClick={() => setIsSettingsMobileOpen(false)}
          />
        )}

        <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
            <div className="flex items-center gap-3">
              {/* Mobile menu button */}
              <button
                type="button"
                onClick={() => {
                  setIsSettingsSidebarCollapsed(false);
                  setIsSettingsMobileOpen(true);
                }}
                className="lg:hidden h-9 w-9 inline-flex items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer"
                aria-label="Open settings menu"
              >
                <IoMenu size={18} />
              </button>

              <div className="hidden lg:flex items-center gap-3">
                <RiNextjsFill className="size-8"/>
                <div className="h-8 w-px bg-gray-300"></div>
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="h-9 w-9 inline-flex items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer"
                  aria-label="Go back to dashboard"
                >
                  <IoIosArrowBack size={18} />
                </button>
              </div>

              {/* Company name and Settings title */}
              <div className="flex flex-col">
                <h2 className="text-xl font-semibold text-gray-900">All Settings</h2>
                <span className="text-xs font-medium text-gray-600">Company Name</span>
              </div>
            </div>

            <div className="flex items-center cursor-pointer">
              {/* Close button */}
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer"
              >
                <IoMdClose size={18} />
                Close
              </button>
            </div>
          </div>

          <div className="flex flex-1 min-h-0 bg-gray-50 p-2 gap-2 flex-row">
            <aside
              className={twMerge(
                "flex shrink-0 flex-col rounded-2xl border border-gray-200 bg-white transition-all duration-300 z-50",
                "fixed left-2 top-2 bottom-2 w-[260px] lg:relative lg:left-0 lg:top-0 lg:bottom-0",
                // Mobile: hidden by default, visible when open
                "-translate-x-[calc(100%+8px)] lg:translate-x-0",
                isSettingsMobileOpen && "translate-x-0",
                // Desktop: always visible
                "lg:flex",
                isSettingsSidebarCollapsed ? "overflow-visible" : "overflow-hidden",
                isSettingsSidebarCollapsed ? "w-[72px]" : "w-[250px]"
              )}
            >
              <div
                className={twMerge(
                  "p-3 border-b border-gray-200 flex items-center bg-white",
                  isSettingsSidebarCollapsed ? "justify-center" : "justify-between"
                )}
              >
                {!isSettingsSidebarCollapsed && (
                  <div className="w-full flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Menu</h3>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setIsSettingsMobileOpen(false)}
                  className="lg:hidden h-8 w-8 inline-flex items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer"
                  aria-label="Close settings menu"
                >
                  <IoMdClose size={16} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto overflow-x-visible p-2 no-scrollbar bg-white">
                <div className="space-y-1">
                  {MemoizedSettingsMenu.navMain.map((item) => {
                    const isActive = pathname === item.url;
                    const IconComponent = item.icon;
                    
                    return (
                      <Link
                        key={item.url}
                        href={item.url}
                        onClick={() => setIsSettingsMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          isActive 
                            ? "bg-blue-100" 
                          : " hover:bg-gray-100"
                        )}
                      >
                        {IconComponent && <IconComponent className="h-4 w-4" />}
                        {!isSettingsSidebarCollapsed && item.title}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </aside>

            <section className="flex-1 min-w-0 flex flex-col bg-white border border-gray-200 rounded-2xl h-full overflow-y-auto no-scrollbar p-6">
              {children}
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
