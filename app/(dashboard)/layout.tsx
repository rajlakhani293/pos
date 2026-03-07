"use client";

import { Header } from "@/components/header";
import React, { useState, useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar-context";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { AppSidebar, navData } from "@/components/app-sidebar";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { ModuleTabs, ModuleTab } from "@/components/ui/module-tabs";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isSettingsPage = pathname?.startsWith("/settings");
  
  // Check if URL ends with "create" or a number (for edit pages)
  const shouldHideModuleTabs = pathname?.endsWith("/create") || 
    /\d+$/.test(pathname || "") || // Ends with a number
    pathname?.match(/\/\d+\/(edit|update)/); // Contains number followed by edit/update
  
  const getCurrentModuleTabs = (): ModuleTab[] => {
    const activeNavItem = navData.find(item => {
      if (item.children && item.children.length > 0) {
        return item.children.some(child => pathname.startsWith(child.href));
      }
      return pathname.startsWith(item.href || '');
    });

    if (activeNavItem?.children && activeNavItem.children.length > 1) {
      return activeNavItem.children.map(child => ({
        label: child.label,
        href: child.href
      }));
    }

    return [];
  };
  
  // Pages that should not have padding
  const noPaddingPages = {
    "/sales/create": pathname?.startsWith("/sales/create"),
    "/inventory/items/create": pathname?.startsWith("/inventory/items/create"),
    "/inventory/items/": pathname?.startsWith("/inventory/items/") && /\d+$/.test(pathname || ""),
  };
  
  const shouldHaveNoPadding = Object.values(noPaddingPages).some(Boolean);
  
  if (isSettingsPage) {
    return <>{children}</>;
  }
  
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

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

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden p-2 gap-1 bg-gray-50">

        <aside className="h-full shrink-0">
          <AppSidebar />
        </aside>

        <div className="flex flex-col flex-1 min-w-0 rounded-2xl bg-white border border-gray-200 overflow-hidden">
          <Header />
          {!shouldHideModuleTabs && (
            <ModuleTabs
              tabs={getCurrentModuleTabs()}
              activeHref={pathname}
            />
          )}
          <main
            className={cn(
              "flex-1 overflow-y-auto shadow-md bg-white",
              !shouldHaveNoPadding && "p-4 lg:p-6",
            )}
          >
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
                <p className="text-sm leading-relaxed text-slate-500">
                  We're having trouble reaching the server.
                </p>
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
    </SidebarProvider>
  );
}