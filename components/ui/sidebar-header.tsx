"use client"

import React from "react";
import Link from "next/link";
import { IoMdClose } from "react-icons/io";
import { RiNextjsFill } from "react-icons/ri";
import { LuPanelLeft, LuPanelRight } from "react-icons/lu";

interface SidebarHeaderProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
  isMobileOpen: boolean;
  closeMobile?: () => void;
}

const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  closeMobile,
}) => {

  return (
    <div
      className={`flex items-center h-16 w-full shrink-0 transition-all duration-300 border-b border-gray-200 bg-white ${
       isCollapsed && !isMobileOpen ? "justify-center px-0" : "justify-between px-4"
      }`}
      style={{ overflow: "hidden" }}
    >
      {/* --- Expanded Mode: Logo --- */}
      {(!isCollapsed || isMobileOpen) && (
        <Link href="/dashboard" className="flex items-center overflow-hidden whitespace-nowrap">
          <img
            src="next.svg"
            alt="Next"
            className="h-5 object-contain transition-all duration-300"
            loading="lazy"
          />
        </Link>
      )}

      {(isCollapsed && !isMobileOpen) && (
        <div className="relative h-10 w-10 flex items-center justify-center">
         <RiNextjsFill className="size-8"/>

          <button
            type="button"
            onClick={() => {
              setIsCollapsed(!isCollapsed);
            }}
            className="flex p-2 h-10 w-10 rounded-lg items-center justify-center border cursor-w-resize"

          ><LuPanelRight className="size-8" /></button>
        </div>
      )}

      {(!isCollapsed && !isMobileOpen) && (
        <button
          type="button"
          onClick={() => {
            setIsCollapsed(!isCollapsed);
          }}
          className="flex p-2 h-10 w-10 rounded-lg items-center justify-center border cursor-w-resize"
        ><LuPanelLeft className="size-8" /></button>
      )}

      {isMobileOpen && (
        <button
          type="button"
          onClick={closeMobile}
          className="flex p-2 h-10 w-10 rounded-lg items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
        ><IoMdClose style={{ fontSize: 22 }} /></button>
      )}
    </div>
  );
};

export default SidebarHeader;
