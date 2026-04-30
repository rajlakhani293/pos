"use client"

import { useId, useEffect, useRef, useState } from "react";
import { Search, Bell, Settings, LogOut, User, Key, Building2, MapPin, ChevronRight, Check, Globe } from "lucide-react";
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
import { settings } from "@/lib/api/settings";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { showToast } from "@/lib/toast";

const BranchSwitcher = () => {
  const { branch, branchList } = useSession();
  const [switchBranch] = settings.useSwitchBranchMutation();

  const handleSwitch = async (branchItem: any) => {
    if (branch?.id === branchItem.id) return;

    try {
      const res: any = await switchBranch({ id: branchItem.id }).unwrap();
      if (res.success && res.data?.access) {
        Cookies.set("token", res.data.access);
        window.location.reload();
      }
    } catch (e) {
      showToast.error("Failed to switch branch");
    }
  };

  // Only show branch info if company has multiple branches
  if (!branchList || branchList.length < 2) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 p-2 rounded-lg transition-colors group hover:bg-gray-100">
          <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="text-left hidden md:block">
            <p className="text-sm font-semibold text-gray-800 leading-tight">
              {branch?.branch_name || "Main Branch"}
            </p>
            <p className="text-[10px] text-gray-500 font-medium">Current Location</p>
          </div>
          <ChevronRight className="w-3 h-3 text-gray-400 transition-transform" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 p-1 border shadow-lg">
        <DropdownMenuLabel className="font-normal p-2 px-3">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Select Branch</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-gray-200" />
        <div className="max-h-[250px] overflow-y-auto p-1">
          {branchList.map((branchItem: any) => {
            const isActive = branch?.id === branchItem.id;
            return (
              <DropdownMenuItem
                key={branchItem.id}
                onClick={() => handleSwitch(branchItem)}
                className={`cursor-pointer rounded-md text-sm transition-colors ${isActive
                  ? "bg-indigo-100 text-indigo-700"
                  : "text-gray-700 hover:bg-gray-100"
                  }`}
              >
                <span className="font-medium truncate flex-1">{branchItem.branch_name}</span>
                {isActive && <Check className="w-3 h-3" />}
              </DropdownMenuItem>
            )
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

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
      <div className="flex items-center gap-1 flex-1">
        {/* Company Info Card */}
        <button className="flex items-center gap-2 p-2 rounded-lg transition-colors group hover:bg-gray-100">
          <Avatar className="h-8 w-8 border-2 border-white shadow-sm ring-1 ring-gray-100">
            <AvatarImage src={company?.logo_image} />
            <AvatarFallback className="bg-indigo-50 text-indigo-600">
              <Building2 className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-800 leading-tight">
              {company?.company_name || "Company"}
            </p>
            <p className="text-[10px] text-gray-500 font-medium">Company</p>
          </div>
        </button>

        <div className="h-8 w-px bg-gray-200 mx-2 md:block"></div>

        <BranchSwitcher />

        {/* <div className="relative w-full sm:max-w-[200px]">
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
        </div> */}
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
                <AvatarImage src={user?.profile_image} />
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
              <DropdownMenuItem
                className="cursor-pointer rounded-md focus:bg-blue-50 focus:text-blue-700"
                onClick={() => router.push('/settings/users')}
              >
                <User className="mr-2 h-4 w-4" />
                <span className="font-medium">My Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer rounded-md focus:bg-blue-50 focus:text-blue-700"
                onClick={() => router.push('/settings/users?openPasswordModal=true')}
              >
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