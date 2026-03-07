"use client"

import { useId, useEffect, useRef } from "react";
import { Search, Bell, Settings, LogOut, User, Key, Building2, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession } from "@/hooks/useSession";
import { auth } from "@/lib/api/auth";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { showToast } from "@/lib/toast";
import { useSidebar } from "@/components/ui/sidebar-context";

export function Header() {
  const triggerId = useId();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { user, shop } = useSession();
  const { setIsMobileOpen } = useSidebar();
  
  const [logout] = auth.useLogoutMutation();
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = async () => {
    if (user?.id) {
      try {
        // const refresh_token = Cookies.get("refresh_token");
        // await logout({ refresh_token }).unwrap();
        showToast.success("Logout successfully");
        Cookies.remove("token");
        router.push("/login");
      } catch (error: any) {
        showToast.error(error?.data?.message || "Logout failed");
      }
    }
  };

  const displayName = user?.user_name;
  const initials = user?.user_name ? user.user_name.split(' ').map(n => n[0]).join('').toUpperCase() : "U";

  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-6 w-full sticky top-0 z-10">
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="lg:hidden p-2 rounded-md border hover:bg-gray-100 cursor-pointer text-gray-500"
          aria-label="Open sidebar"
        >
          <Menu className="h-6 w-6" />
        </button>
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="Search..."
            className="w-full pl-9 h-9"
          />
          <kbd className="hidden sm:inline-flex absolute right-3 p-1 top-1/2 -translate-y-1/2 h-5 select-none items-center gap-1 rounded border bg-white font-mono text-xs font-medium text-slate-400 opacity-100 pointer-events-none uppercase">
            <span className="text-sm">⌘</span>S
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div
              id={triggerId}
              suppressHydrationWarning
              className="flex items-center gap-3 cursor-pointer p-1 hover:bg-gray-100 rounded-lg transition-colors group"
            >
              <Avatar className="h-9 w-9 border-2 border-white shadow-sm ring-1 ring-gray-100 group-hover:ring-blue-200 transition-all">
                <AvatarImage src={shop?.logo_image_url} />
                <AvatarFallback className="bg-blue-600 text-white font-bold text-xs" suppressHydrationWarning>{initials}</AvatarFallback>
              </Avatar>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 mt-2 p-1 border shadow-xl">
            <DropdownMenuLabel className="font-normal p-3" suppressHydrationWarning>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-bold text-gray-800">{displayName}</p>
                <p className="text-xs text-gray-500 font-medium truncate">{user?.email || "No email provided"}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-gray-100" />
            <div className="p-1 space-y-0.5">
              <DropdownMenuItem className="cursor-pointer rounded-md focus:bg-blue-50 focus:text-blue-700">
                <User className="mr-2 h-4 w-4" />
                <span className="font-medium">My Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer rounded-md focus:bg-blue-50 focus:text-blue-700">
                <Settings className="mr-2 h-4 w-4" />
                <span className="font-medium">Account Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer rounded-md focus:bg-blue-50 focus:text-blue-700">
                <Key className="mr-2 h-4 w-4" />
                <span className="font-medium">Change Password</span>
              </DropdownMenuItem>
            </div>
            <DropdownMenuSeparator className="bg-gray-100" />
            <div className="p-1">
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer rounded-md text-red-600 focus:text-red-700 focus:bg-red-50 font-semibold"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
