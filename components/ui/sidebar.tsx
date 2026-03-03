"use client"

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { twMerge } from "tailwind-merge";
import { BiChevronDown } from "react-icons/bi";
import { IoMdClose } from "react-icons/io";
import { IoMenu } from "react-icons/io5";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export type SidebarItemData = {
    label: string;
    href?: string;
    icon?: React.ReactNode;
    children?: SidebarItemData[];
};

type NavItemProps = {
    icon?: React.ReactNode;
    label: string;
    href?: string;
    isCollapsed: boolean;
    isMobileOpen: boolean;
    activeTooltip: string | null;
    setActiveTooltip: (v: string | null) => void;
    onLinkClick?: () => void;
    isActive?: boolean;
    showCollapsedTooltip?: boolean;
};

type SidebarDropdownProps = {
    icon?: React.ReactNode;
    label: string;
    children?: React.ReactNode;
    firstChildHref?: string;
    isCollapsed: boolean;
    isMobileOpen: boolean;
    activeTooltip: string | null;
    setActiveTooltip: (v: string | null) => void;
    isOpen: boolean;
    onToggle: () => void;
    isActive?: boolean;
};

interface SidebarDropdownItemProps {
    href: string;
    icon?: React.ReactNode;
    label: string;
    isActive?: boolean;
    onClick?: () => void;
}

interface SidebarSectionTitleProps {
    label: string;
    isCollapsed: boolean;
}

interface SidebarContainerProps {
    isCollapsed: boolean;
    isMobileOpen: boolean;
    isResizing: boolean;
    sidebarRef: React.RefObject<HTMLDivElement | null>;
    
    // Content props
    title?: string;
    logo?: React.ReactNode;
    children: React.ReactNode;
    header?: React.ReactNode;

    // callbacks
    toggleSidebar: () => void;
    closeMobile: () => void;
}

export const SidebarContainer: React.FC<SidebarContainerProps> = ({
    isCollapsed,
    isMobileOpen,
    isResizing,
    sidebarRef,
    title,
    logo,
    children,
    header,
    toggleSidebar,
    closeMobile,
}) => {
    return (
        <>
            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div className="fixed inset-0 bg-black/50 lg:hidden" onClick={closeMobile} />
            )}

            <aside
                ref={sidebarRef}
                className={twMerge(
                    `fixed left-2 top-2 bottom-2 border border-gray-200 flex flex-col rounded-2xl bg-white transition-all duration-300 ease-in-out shadow-sm h-full lg:relative lg:left-0 lg:top-0 lg:bottom-0`,
                    // default width for mobile
                    "w-[264px]",
                    // mobile slide-in / slide-out
                    isMobileOpen ? "translate-x-0 left-2 top-2 bottom-2 rounded-2xl shadow-xl h-auto" : "-translate-x-[calc(100%+8px)]",
                    "lg:translate-x-0 lg:shadow-[0_8px_30px_rgb(0,0,0,0.06)]",
                    // desktop widths
                    isCollapsed ? "lg:w-[72px]" : "lg:w-[264px]"
                )}
            >
                {/* Unified Sidebar Content */}
                <div
                    className={"flex-1 flex flex-col no-scrollbar overflow-y-auto overflow-x-hidden"}
                >
                    {header && (
                        <div className="shrink-0 transition-all duration-300 overflow-hidden rounded-t-2xl sticky top-0 z-10 bg-white">
                            {header}
                        </div>
                    )}
                    
                    {!header && (
                        <div
                            className={twMerge(
                                "flex items-center justify-between p-4 h-16 shrink-0 sticky top-0 z-10 bg-white",
                                isCollapsed && !isResizing ? "lg:justify-center" : ""
                            )}
                        >
                            <div
                                className={twMerge(
                                    "flex items-center gap-2 overflow-hidden whitespace-nowrap transition-all duration-300",
                                    isCollapsed ? "lg:w-0 lg:opacity-0" : "w-auto opacity-100"
                                )}
                            >
                                {logo && <div className="shrink-0">{logo}</div>}
                                {title && <h3 className="text-xl font-bold text-gray-800">{title}</h3>}
                            </div>
                            <button
                                onClick={toggleSidebar}
                                className="hidden lg:flex btn btn-circle btn-ghost items-center justify-center p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors"
                            >
                                <IoMenu size={20} />
                            </button>
                            <button
                                onClick={closeMobile}
                                className="lg:hidden btn btn-circle btn-ghost flex items-center justify-center p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors"
                            >
                                <IoMdClose size={20} />
                            </button>
                        </div>
                    )}

                    <div className="flex-1 p-2">
                        <ul className="flex flex-col">{children}</ul>
                    </div>
                </div>
            </aside>
        </>
    );
};

export const NavItem: React.FC<NavItemProps> = ({
    icon, label, isCollapsed, isMobileOpen, href = "#",
    setActiveTooltip, onLinkClick, isActive,
    showCollapsedTooltip = true
}) => {
    const handleClick = () => {
        setActiveTooltip(null);
        if (onLinkClick) onLinkClick();
    };

    const shouldShowTooltip = isCollapsed && !isMobileOpen && showCollapsedTooltip;

    return (
        <li
            className="relative sidebar-interactive"
        >
            {shouldShowTooltip ? (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Link
                            href={href}
                            onClick={handleClick}
                            aria-label={label}
                            className={twMerge(
                                `flex w-full items-center rounded-md px-3 py-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-200`,
                                "gap-3",
                                isCollapsed && !isMobileOpen ? "justify-center" : "",
                                isActive ? "bg-gray-100 text-gray-900 font-semibold" : ""
                            )}
                        >
                            <span className="shrink-0">{icon}</span>
                            {(!isCollapsed || isMobileOpen) && (
                                <span className={twMerge(
                                    "overflow-hidden whitespace-nowrap transition-all duration-300 text-sm font-medium",
                                    "w-auto opacity-100",
                                    isCollapsed ? "lg:w-0 lg:opacity-0" : "w-auto opacity-100"
                                )}>
                                    {label}
                                </span>
                            )}
                        </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                        <p>{label}</p>
                    </TooltipContent>
                </Tooltip>
            ) : (
                <Link
                    href={href}
                    onClick={handleClick}
                    aria-label={label}
                    className={twMerge(
                        `flex w-full items-center rounded-md px-3 py-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-200`,
                        "gap-3",
                        isCollapsed && !isMobileOpen ? "justify-center" : "",
                        isActive ? "bg-gray-100 text-gray-900 font-semibold" : ""
                    )}
                >
                    <span className="shrink-0">{icon}</span>
                    {(!isCollapsed || isMobileOpen) && (
                        <span className={twMerge(
                            "overflow-hidden whitespace-nowrap transition-all duration-300 text-sm font-medium",
                            "w-auto opacity-100",
                            isCollapsed ? "lg:w-0 lg:opacity-0" : "w-auto opacity-100"
                        )}>
                            {label}
                        </span>
                    )}
                </Link>
            )}
        </li>
    );
};

export const SidebarDropdown: React.FC<SidebarDropdownProps> = ({
    icon, label, children,
    firstChildHref,
    isCollapsed, isMobileOpen,
    activeTooltip, setActiveTooltip, isOpen, onToggle,
    isActive = false
}) => {
    const router = useRouter();

    const [hasClicked, setHasClicked] = useState(false);
    const isActiveTooltip = activeTooltip === label;
    const showExpanded = !isCollapsed || isMobileOpen;

    const contentRef = useRef<HTMLDivElement | null>(null);
    const [contentHeight, setContentHeight] = useState<number>(0);
    const [renderExpanded, setRenderExpanded] = useState<boolean>(showExpanded && isOpen);
    const [shouldAnimateOpen, setShouldAnimateOpen] = useState(false);

    // 1. Ref for the list item to measure position
    const liRef = useRef<HTMLLIElement>(null);
    const popupRef = useRef<HTMLUListElement>(null);
    // 2. State to determine vertical alignment ('top' or 'bottom')
    const [popupPlacement, setPopupPlacement] = useState<'top' | 'bottom'>('top');

    // 3. Smart Positioning Logic
    useEffect(() => {
        // Only run this calculation when the tooltip is active and elements exist
        if (isActiveTooltip && liRef.current && popupRef.current) {
            
            // Get dimensions
            const triggerRect = liRef.current.getBoundingClientRect();
            const popupHeight = popupRef.current.offsetHeight; // Actual height of the dropdown
            const viewportHeight = window.innerHeight;

            // Calculate available space below the trigger's top edge
            // (We use top edge because 'top-0' aligns with the top of the trigger)
            const spaceBelow = viewportHeight - triggerRect.top;
            
            // Logic: If the popup is taller than the space available below, flip it to the bottom.
            // We add a small buffer (e.g., 20px) to prevent it from touching the screen edge.
            if (spaceBelow < (popupHeight + 20)) {
                setPopupPlacement('bottom');
            } else {
                setPopupPlacement('top');
            }
        }
    }, [isActiveTooltip]); // Re-run whenever it opens

    const handleToggle = (e: React.MouseEvent) => {
        if (isCollapsed && !isMobileOpen) {
            if (firstChildHref) {
                e.preventDefault();
                setActiveTooltip(null);
                setHasClicked(false);
                router.push(firstChildHref);
                return;
            }

            // Check if this specific dropdown is currently open (via hover or click)
            if (activeTooltip === label) {
                // SCENARIO: The popup is OPEN
                
                if (!hasClicked) {
                    // Case 1: Opened via Hover, this is the FIRST click.
                    // Action: Don't close. Just mark it as clicked.
                    e.preventDefault();
                    setHasClicked(true);
                } else {
                    // Case 2: Opened via Hover and already clicked ONCE.
                    // Action: This is the second click, so Close it.
                    setActiveTooltip(null);
                    setHasClicked(false);
                }
            } else {
                // SCENARIO: The popup is CLOSED (e.g., clicked without hovering first)
                e.preventDefault();
                setActiveTooltip(label);
                setHasClicked(true); // Mark as clicked immediately
            }
        } else {
            onToggle();
        }
    };

    // const handleToggle = (e: React.MouseEvent) => {
    //     if (isCollapsed && !isMobileOpen) {
    //         if (activeTooltip !== label) {
    //             e.preventDefault();
    //             setActiveTooltip(label);
    //         } else {
    //             setActiveTooltip(null);
    //         }
    //     } else {
    //         onToggle();
    //     }
    // };

    useEffect(() => {
        const update = () => {
            if (contentRef.current) {
                setContentHeight(contentRef.current.scrollHeight);
            }
        };
        update();
        const ro = new ResizeObserver(update);
        if (contentRef.current) ro.observe(contentRef.current);
        window.addEventListener("resize", update);
        return () => {
            ro.disconnect();
            window.removeEventListener("resize", update);
        };
    }, [children]);

    useEffect(() => {
        if (showExpanded) {
            setRenderExpanded(true);
        } else {
            const t = setTimeout(() => setRenderExpanded(false), 320);
            return () => clearTimeout(t);
        }
    }, [showExpanded]);

    useEffect(() => {
        if (showExpanded && isOpen) {
            setRenderExpanded(true);
            setShouldAnimateOpen(false);
            const t = setTimeout(() => setShouldAnimateOpen(true), 20);
            return () => clearTimeout(t);
        }
    }, [showExpanded, isOpen]);

    // New changes

    useEffect(() => {
        if (activeTooltip !== label) {
            setHasClicked(false);
        }
    }, [activeTooltip, label]);

    return (
        <li 
        
            ref={liRef}
            className="relative group sidebar-interactive"
        >
            {isCollapsed && !isMobileOpen ? (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            onClick={handleToggle}
                            aria-label={label}
                            className={twMerge(
                                `flex w-full items-center rounded-md px-3 py-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-200`,
                                // Mobile: Always spread apart
                                "justify-between gap-3",
                                isCollapsed && !isMobileOpen ? "justify-center" : "",
                                isActiveTooltip ? "bg-gray-50 text-gray-900" : "",
                                isActive ? "bg-gray-100 text-gray-900 font-semibold" : ""
                            )}
                        >
                            <div className={twMerge("flex items-center", icon ? "gap-3" : "")}>
                                {icon ? <span className="shrink-0">{icon}</span> : null}
                                {(!isCollapsed || isMobileOpen) && (
                                <span className={twMerge(
                                    "text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-300",
                                    "w-auto opacity-100",
                                    isCollapsed ? "lg:w-0 lg:opacity-0" : "lg:w-auto lg:opacity-100"
                                )}>
                                    {label}
                                </span>
                                )}
                            </div>

                            <div className={twMerge(
                                "transition-transform duration-300 ease-in-out",
                                isOpen ? "rotate-180" : "",
                                isCollapsed ? "hidden" : "block"
                            )}>
                                <BiChevronDown style={{ fontSize: 16}} />
                            </div>
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                        <p>{label}</p>
                    </TooltipContent>
                </Tooltip>
            ) : (
                <button
                    onClick={handleToggle}
                    aria-label={label}
                    className={twMerge(
                        `flex w-full items-center rounded-md px-3 py-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-200`,
                        // Mobile: Always spread apart
                        "justify-between gap-3",
                        isCollapsed && !isMobileOpen ? "justify-center" : "",
                        isActiveTooltip ? "bg-gray-50 text-gray-900" : "",
                        isActive ? "bg-gray-100 text-gray-900 font-semibold" : ""
                    )}
                >
                    <div className={twMerge("flex items-center", icon ? "gap-3" : "")}>
                        {icon ? <span className="shrink-0">{icon}</span> : null}
                        {(!isCollapsed || isMobileOpen) && (
                        <span className={twMerge(
                            "text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-300",
                            "w-auto opacity-100",
                            isCollapsed ? "lg:w-0 lg:opacity-0" : "lg:w-auto lg:opacity-100"
                        )}>
                            {label}
                        </span>
                        )}
                    </div>

                    <div className={twMerge(
                        "transition-transform duration-300 ease-in-out",
                        isOpen ? "rotate-180" : "",
                        isCollapsed ? "hidden" : "block"
                    )}>
                        <BiChevronDown style={{ fontSize: 16}} />
                    </div>
                </button>
            )}

            {renderExpanded && (
                <div
                    className="relative overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out"
                    style={{
                        maxHeight: (showExpanded && isOpen && shouldAnimateOpen) ? `${contentHeight}px` : "0px",
                        opacity: (showExpanded && isOpen && shouldAnimateOpen) ? 1 : 0
                    }}
                >
                    <div className="absolute left-[22px] top-0 bottom-0 w-px bg-gray-200" />
                    <ul>
                        <div ref={contentRef} className="pl-8 mt-1 space-y-1 pb-1">
                            {children}
                        </div>
                    </ul>
                </div>
            )}
        </li>
    );
};

export const SidebarDropdownItem: React.FC<SidebarDropdownItemProps> = ({
    href,
    icon,
    label,
    isActive = false,
    onClick,
}) => {
    return (
        <li>
            <Link
                href={href}
                onClick={onClick}
                className={twMerge(
                    `flex items-center rounded-md px-3 py-2 text-sm transition-colors`,
                    icon ? "gap-3" : "",
                    isActive
                        ? "bg-blue-100 text-blue-900 font-medium"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
            >
                {icon && <span className="shrink-0">{icon}</span>}
                <span className="overflow-hidden whitespace-nowrap transition-all duration-300">
                    {label}
                </span>
            </Link>
        </li>
    );
};

export const SidebarSectionTitle: React.FC<SidebarSectionTitleProps> = ({
    label,
    isCollapsed
}) => {
    return (
        <li className="px-3 py-2">
            <div className={twMerge(
                "text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap transition-all duration-300",
                isCollapsed ? "lg:opacity-0 lg:w-0" : "opacity-100 w-auto"
            )}>
                {label}
            </div>
            <div className={twMerge(
                "mt-1 border-t border-gray-200 transition-all duration-300",
                isCollapsed ? "lg:opacity-0 lg:w-0" : "opacity-100 w-auto"
            )} />
        </li>
    );
};
