"use client"

import { useId, useEffect, useRef } from "react";
import { Search, Bell, Settings, LogOut, User, Key, Building2 } from "lucide-react";
import {
  Input,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "./index";
import { useSession } from "@/hooks/useSession";
import { auth } from "@/lib/api/auth";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { showToast } from "@/lib/toast";

export function Header() {
  const triggerId = useId();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { user, company, branch } = useSession();
  
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
  const initials = user?.user_name ? user.user_name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : "U";

  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-6 w-full sticky top-0 z-10">
      <div className="flex items-center gap-4 flex-1">
        {/* Company Info Card */}
        <div className="hidden lg:flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-100 transition-colors">
          <Building2 className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">{company?.company_name || "Company"}</span>
        </div>

        {/* Branch Info Card */}
        <div className="hidden lg:flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-100 transition-colors">
          <span className="text-sm font-medium text-gray-600">{branch?.branch_name || "Branch"}</span>
        </div>

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
                <AvatarImage src={company?.logo_image_url} />
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