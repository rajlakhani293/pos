"use client";

import { Header } from "@/components/header";
import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { AppSidebar, navData } from "@/components/app-sidebar";
import {
  SidebarProvider,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  Spinner,
  ModuleTabs,
} from "@/components/index";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isSettingsPage = pathname?.startsWith("/settings");

  const noPaddingPages = {
    "/sales/create": pathname?.startsWith("/sales/create"),
    "/sales/": pathname?.startsWith("/sales/") && /\d+$/.test(pathname || ""),
    "/inventory/items/create": pathname?.startsWith("/inventory/items/create"),
    "/inventory/items/": pathname?.startsWith("/inventory/items/") && /\d+$/.test(pathname || ""),
    isSettingsPage,
  };

  const shouldHaveNoPadding = Object.values(noPaddingPages).some(Boolean);

  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getModuleTabs = (pathname: string) => {
    // Hide tabs if URL ends with "create" or a number
    const urlParts = pathname.split('/');
    const lastPart = urlParts[urlParts.length - 1];
    if (lastPart === 'create' || /^\d+$/.test(lastPart)) {
      return [];
    }

    const currentModule = navData.find(item => {
      if (item.items) {
        const matches = item.items.filter(subItem => pathname.startsWith(subItem.url));
        if (!matches.length) return false;
        const best = matches.sort((a, b) => b.url.length - a.url.length)[0];
        return Boolean(best);
      }
      return pathname.startsWith(item.url);
    });

    if (currentModule?.items) {
      return currentModule.items.map(item => ({
        label: item.title,
        href: item.url
      }));
    }

    return [];
  };

  return (
    <>
      <div className="flex h-screen w-full overflow-hidden">
        <aside className="h-full shrink-0">
          <SidebarProvider>
            <AppSidebar />
          </SidebarProvider>
        </aside>

        <div className="flex flex-col flex-1 min-w-0">
          <Header />
          <ModuleTabs
            tabs={getModuleTabs(pathname)}
            activeHref={pathname}
          />
          <main className={`flex-1 overflow-y-auto bg-white h-full w-full ${shouldHaveNoPadding ? "" : "p-6"}`}>
            {children}
          </main>
        </div>
      </div>
      {/* Network Error Dialog */}
      <Dialog open={isOffline}>
        <DialogContent showCloseButton={false} className="p-0 gap-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-white p-6">
            <div className="flex flex-col items-center text-center space-y-4">

              <div className="">
                <DialogTitle className="text-xl font-medium tracking-tight text-slate-900">
                  Connection Lost
                </DialogTitle>
                <DialogDescription className="text-sm leading-relaxed text-slate-500">
                  We're having trouble reaching the server. Please check your internet connection and try again.
                </DialogDescription>
              </div>

              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-gray-100" />
                <Spinner className="size-12 text-slate-800 animate-spin-slow" />
              </div>

            </div>
          </div>

          <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-center">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                Attempting to reconnect
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
