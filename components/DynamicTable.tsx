"use client";

import { useState, useEffect, useRef } from "react";
import dayjs from "dayjs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  UniFieldInput,
} from "@/components/ui/unifield-input";
import {
  UniFieldSelect,
} from "@/components/ui/unifield-select";
import {
  SelectItem,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ArrowUpDownIcon, CalendarIcon, ChevronLeftIcon, ChevronRightIcon, CloseIcon, DeleteIcon, DownIcon, EditIcon, InfoIcon, MoreIcon, PlusIcon, RoundCloseIcon, SearchIcon, UpIcon } from "./AppIcon";
import { showToast } from "@/lib/toast";

const MAX_ICONS_TO_SHOW = 3;
const MAX_CHARS_PER_LINE = 35;

const dateRanges = [
  "Today",
  "Yesterday",
  "This Week",
  "Last Week",
  "This Month",
  "Last Month",
  "This Year",
  "Last Year",
  "Last 30 Days",
  "Last Quarter",
  "FY 2024-25",
  "FY 2023-24",
];

const TableCellContent = ({ value }: { value: any }) => {
  let text: string | null = null;

  if (typeof value === "string") {
    text = value;
  } else if (typeof value === "number" || typeof value === "boolean") {
    text = String(value);
  }

  if (text === null) {
    return <>{value}</>;
  }

  const trimmed = text.trim();

  if (trimmed.length <= MAX_CHARS_PER_LINE) {
    return (
      <span className="block max-w-[35ch] whitespace-normal wrap-break-word">
        {trimmed}
      </span>
    );
  }

  const hasSpace = /\s/.test(trimmed);

  if (hasSpace) {
    return (
      <span className="block max-w-[35ch] whitespace-normal wrap-break-word">
        {trimmed}
      </span>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="block max-w-[35ch] truncate whitespace-nowrap cursor-default">
            {trimmed}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{trimmed}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

interface Column {
  key: string;
  title: React.ReactNode;
  subtitle?: string;
  render?: (value: any, record: any, index: number) => React.ReactNode;
}

interface Action {
  key: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  labelText?: string;
  priority?: number;
  render?: (value: any, record: any, index: number) => React.ReactNode;
  onClick?: (e?: React.MouseEvent<HTMLButtonElement>) => void;
}

export interface FooterSummaryItem {
  label: string;
  value: string | number;
  prefix?: string;
  className?: string;
  tooltip?: React.ReactNode;
}


interface DynamicTableProps {
  data: any[];
  columns: Column[];
  selectedRows?: string[];
  onRowSelect?: (id: string | number) => void;
  sortConfig?: { key: string; direction: string };
  onSort?: (key: string) => void;
  rowActions?: (id: string, record: any) => Action[];
  onFilterChange?: (action: string, payload?: any) => void;
  currentPage?: number;
  itemsPerPage?: number;
  totalItems?: number;
  onPageChange?: (page: number, pageSize?: number) => void;
  showStatus?: boolean;
  statusChangeMutation?: (args: { ids: (string | number)[], status: number, module_id?: string, entity_id?: string }) => Promise<any>;
  showDelete?: boolean;
  showEdit?: boolean;
  deleteMutation?: (args: { ids: (string | number)[], module_id?: string, entity_id?: string }) => Promise<any>;
  onEdit?: (record: any) => void;
  triggerRefresh?: () => void;
  sortableFields?: string[];
  deleteModalTitle?: string;
  deleteModalDescription?: string;
  onRowClick?: (row: any) => void;
  footerSummary?: FooterSummaryItem[];
  hideActions?: boolean;
  isLoading?: boolean;

  tableTitle?: string;
  title?: string;
  searchTerm?: string;
  showSearch?: boolean;
  showDateRange?: boolean;
  selectedDateRange?: string | null | any;
  dateFilters?: { startDate: Date | null; endDate: Date | null };
  setAddEntityOpen?: (open: boolean) => void;
  secondaryActionButton?: React.ReactNode;
}

const DynamicTable = ({
  data,
  columns,
  selectedRows = [],
  onRowSelect = () => { },
  sortConfig = { key: "", direction: "ascending" },
  onSort = () => { },
  rowActions,
  currentPage = 1,
  itemsPerPage = 10,
  totalItems = 0,
  onFilterChange = () => { },
  onPageChange = () => { },
  showStatus = false,
  statusChangeMutation,
  showDelete = false,
  showEdit = true,
  deleteMutation,
  onEdit,
  triggerRefresh,
  sortableFields = [],
  deleteModalTitle,
  deleteModalDescription,
  onRowClick,
  footerSummary,
  hideActions = false,
  isLoading = false,

  // Integrated props
  tableTitle,
  title,
  searchTerm,
  showSearch = false,
  showDateRange = false,
  selectedDateRange,
  dateFilters,
  setAddEntityOpen,
  secondaryActionButton,
}: DynamicTableProps) => {
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [itemToDelete, setItemToDelete] = useState<string | number | null>(null);
  const paginationSentinelRef = useRef<HTMLDivElement | null>(null);
  const [isFooterStuck, setIsFooterStuck] = useState(false);
  const [isDateRangeModalOpen, setIsDateRangeModalOpen] = useState<boolean>(false);

  // Handle single item deletion
  const handleDeleteConfirm = async () => {
    if (itemToDelete && showDelete && deleteMutation) {
      try {
        const result = await deleteMutation({
          ids: [itemToDelete],
        });

        if ("data" in result && result.data.success === true) {
          showToast.success(result?.message || "Deleted Successfully");
          triggerRefresh?.();
        } else if ("error" in result) {
          const error = result.error as any;
          showToast.error(`Delete Failed: ${error.data?.message || error.message}`);
        }
      } catch (error) {
        const err = error as any;
        showToast.error(`Delete Failed: ${err.data?.message || "Network Error"}`);
      } finally {
        setDeleteModalOpen(false);
        setItemToDelete(null);
      }
    }
  };

  useEffect(() => {
    const sentinel = paginationSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setIsFooterStuck(!entry.isIntersecting);
      },
      {
        threshold: 0.01,
        rootMargin: "0px 0px -85px 0px"
      },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const onChange = async (action: string, payload?: any): Promise<boolean> => {
    switch (action) {
      case "selectRow":
        if (payload) {
          onRowSelect(payload);
        }
        return false;
      case "sort":
        if (payload && typeof payload === "string") {
          onSort(payload);
        }
        return false;
      case "statusChange":
        if (
          showStatus &&
          statusChangeMutation &&
          payload?.id !== undefined &&
          typeof payload.status === "number"
        ) {
          try {
            const newStatus = payload.status === 0 ? 1 : 0;
            const result = await statusChangeMutation({
              ids: [payload.id],
              status: newStatus,
            })

            if ("data" in result && result.data.success === true) {
              showToast.success(result?.message || "Status Updated");
              triggerRefresh?.();
              return true;
            }
          } catch (error) {
            const err = error as any;
            showToast.error(
              `Status Update Failed: ${err.status} - ${err.data?.message || err.message
              }`
            );
          }
        }
        return false;
      case "delete":
        if (showDelete && payload) {
          setItemToDelete(payload)
          setDeleteModalOpen(true);
        }
        return false;
      case "search":
      case "dateRange":
      case "customDate":
      case "toggleAdvancedFilter":
      case "itemsPerPage":
        onFilterChange(action, payload);
        return false;
      default:
        return false;
    }
  };

  const getRowActions = (id: string): Action[] => {
    const defaultActions: Action[] = [];
    const currentItem = data?.find((item) => String(item.id) === String(id));

    // Add Edit action if showEdit is true
    if (showEdit) {
      defaultActions.push({
        key: "edit",
        label: "Edit",
        labelText: "Edit",
        icon: <EditIcon className="size-4" />,
        onClick: (e) => {
          e?.stopPropagation();
          if (onEdit) {
            onEdit(currentItem);
          } else {
            console.log("Edit item:", id, currentItem);
          }
        },
        priority: 1
      });
    }

    if (showDelete) {
      defaultActions.push({
        key: "delete",
        label: "Delete",
        labelText: "Delete",
        icon: <DeleteIcon className="size-5 text-red-500" />,
        onClick: (e) => {
          e?.stopPropagation();
          setItemToDelete(id);
          setDeleteModalOpen(true);
        },
        priority: 2
      });
    }

    const customActions = rowActions ? rowActions(id, currentItem) : [];
    const allActions = [...defaultActions];


    customActions.forEach((customAction) => {
      if (!allActions.some((action) => action.key === customAction.key)) {
        allActions.push(customAction);
      }
    });

    return allActions.sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  const translateSelectedDateRange = (range: string | null): string => {
    if (!range) return "FY 25-26";
    return range;
  };

  return (
    <div className="w-full space-y-4">
      {/* Integrated Header/Filter Section */}
      <div className="w-full space-y-4 mb-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            {tableTitle && (
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                {tableTitle}
              </h2>
            )}

            {totalItems > 0 && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {totalItems}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-end">
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            {showSearch && (
              <div className="relative w-full sm:max-w-xs">
                <UniFieldInput
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => onChange("search", e.target.value)}
                  className="w-full pl-9 pr-9 h-9"
                  prefix={<SearchIcon className="h-4 w-4" />}
                />
                {searchTerm && (
                  <button
                    onClick={() => onChange("search", "")}
                    className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground hover:text-destructive"
                  >
                    <RoundCloseIcon className="size-4" />
                  </button>
                )}
              </div>
            )}

            <div className="flex gap-2">
              {showDateRange && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsDateRangeModalOpen(true)}
                    className="h-9 w-full sm:w-auto justify-between gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <span>{translateSelectedDateRange(selectedDateRange)}</span>
                    </div>
                    {selectedDateRange !== "FY 25-26" ? (
                      <div
                        className="h-4 w-4 bg-white text-muted-foreground hover:text-destructive cursor-pointer flex items-center justify-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          onChange("dateRange", "FY 25-26");
                        }}
                      >
                        <RoundCloseIcon className="size-5 hover:text-red-500" />
                      </div>
                    ) : (
                      <DownIcon className="size-5" />
                    )}
                  </Button>

                  <Dialog
                    open={isDateRangeModalOpen}
                    onOpenChange={setIsDateRangeModalOpen}
                  >
                    <DialogContent className="sm:max-w-[600px]">
                      <DialogHeader>
                        <DialogTitle>Select Date Range</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-6 py-4">
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium leading-none">
                            Quick Select
                          </h4>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {dateRanges.slice(0, 8).map((range) => (
                              <Button
                                key={range}
                                variant={
                                  selectedDateRange === range ? "default" : "outline"
                                }
                                size="sm"
                                onClick={() => {
                                  onChange("dateRange", range);
                                  setIsDateRangeModalOpen(false);
                                }}
                                className="w-full text-xs"
                              >
                                {range}
                              </Button>
                            ))}
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {dateRanges.slice(8, 10).map((range) => (
                              <Button
                                key={range}
                                variant={
                                  selectedDateRange === range ? "default" : "outline"
                                }
                                size="sm"
                                onClick={() => {
                                  onChange("dateRange", range);
                                  setIsDateRangeModalOpen(false);
                                }}
                                className="w-full text-xs"
                              >
                                {range}
                              </Button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="text-sm font-medium leading-none">
                            Financial Year
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {dateRanges.slice(10).map((range) => (
                              <Button
                                key={range}
                                variant={
                                  selectedDateRange === range ? "secondary" : "outline"
                                }
                                size="sm"
                                onClick={() => {
                                  onChange("dateRange", range);
                                  setIsDateRangeModalOpen(false);
                                }}
                                className={cn(
                                  "text-xs",
                                  selectedDateRange === range && "bg-green-100 text-green-900 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300"
                                )}
                              >
                                {range}
                              </Button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t">
                          <Button
                            variant={selectedDateRange === "Custom" ? "default" : "ghost"}
                            className="w-full justify-start dashed border-dashed border"
                            onClick={() => onChange("dateRange", "Custom")}
                          >
                            {selectedDateRange === "Custom" ? "✓ " : "+ "} Custom Range
                          </Button>

                          {selectedDateRange === "Custom" && (
                            <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
                              <div className="grid gap-1.5 w-full">
                                <label className="text-xs font-medium text-muted-foreground">Start Date</label>
                                <UniFieldInput
                                  type="date"
                                  value={dateFilters?.startDate ? dayjs(dateFilters.startDate).format('YYYY-MM-DD') : ''}
                                  onChange={(e) => {
                                    const start = e.target.value ? dayjs(e.target.value).startOf('day').toDate() : null;
                                    const end = dateFilters?.endDate;
                                    onChange("customDate", [start, end]);
                                  }}
                                />
                              </div>
                              <div className="grid gap-1.5 w-full">
                                <label className="text-xs font-medium text-muted-foreground">End Date</label>
                                <UniFieldInput
                                  type="date"
                                  value={dateFilters?.endDate ? dayjs(dateFilters.endDate).format('YYYY-MM-DD') : ''}
                                  onChange={(e) => {
                                    const end = e.target.value ? dayjs(e.target.value).endOf('day').toDate() : null;
                                    const start = dateFilters?.startDate;
                                    onChange("customDate", [start, end]);
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </>
              )}

              <div className="flex items-center gap-2">
                {title && setAddEntityOpen && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => setAddEntityOpen?.(true)}
                      className="gap-2"
                    >
                      <PlusIcon className="h-4 w-4" />
                      {title}
                    </Button>
                    {secondaryActionButton}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="w-full overflow-hidden border rounded-lg">
        <div className={`relative ${data?.length > 0 ? "max-h-[calc(100vh-300px)] overflow-y-auto" : "h-[calc(100vh-300px)]"}`}>
          <Table className={cn(data?.length === 0 && "h-full")}>
            <TableHeader className="sticky top-0 z-10 bg-muted/90 backdrop-blur-sm rounded-t-3xl">
              <TableRow className="hover:bg-muted/90 border-b">
                <TableHead className="w-16 text-center">
                  <div className="flex flex-col py-2">
                    <span className="font-medium">Sr No</span>
                  </div>
                </TableHead>
                {columns.map((col) => (
                  <TableHead
                    key={col.key}
                    onClick={
                      sortableFields.includes(col.key)
                        ? () => onChange("sort", col.key)
                        : undefined
                    }
                    className={cn(
                      "transition-colors",
                      sortableFields.includes(col.key)
                        ? "cursor-pointer hover:bg-muted/50 text-foreground"
                        : "cursor-default"
                    )}
                  >
                    <div className={cn("flex items-center gap-1", col.key === "sr_no" && "justify-center")}>
                      <div className="flex flex-col py-2">
                        <span className={cn(
                          "font-medium",
                          sortConfig.key === col.key && "text-primary"
                        )}>
                          {col.title}
                        </span>
                        {col.subtitle && (
                          <span className="text-[10px] leading-3 text-muted-foreground font-medium normal-case">
                            {col.subtitle}
                          </span>
                        )}
                      </div>
                      {sortableFields.includes(col.key) && (
                        sortConfig.key === col.key ? (
                          sortConfig.direction === "ascending" ? (
                            <UpIcon className="size-3" />
                          ) : (
                            <DownIcon className="size-3" />
                          )
                        ) : (
                          <ArrowUpDownIcon className="size-3" />
                        )
                      )}
                    </div>
                  </TableHead>
                ))}
                {!hideActions && (
                  <TableHead className="text-right px-4">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody className={cn(data?.length === 0 && "h-full")}>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + (hideActions ? 0 : 1) + 1}
                    className="h-24 text-center"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <span className="text-muted-foreground">Loading...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : data?.length > 0 ? (
                data.map((row, index) => {
                  const isDisabledRow = false; // Add logic if needed
                  const allActions = getRowActions(row.id);
                  const visibleActions = allActions.slice(0, MAX_ICONS_TO_SHOW);
                  const dropdownActions = allActions.slice(MAX_ICONS_TO_SHOW);

                  return (
                    <TableRow
                      key={row.id}
                      onClick={() => onRowClick?.(row)}
                      data-state={selectedRows.includes(String(row.id)) ? "selected" : undefined}
                      className={cn(
                        "group transition-all duration-200",
                        isDisabledRow && "opacity-60 cursor-not-allowed",
                        onRowClick && "cursor-pointer"
                      )}
                    >
                      <TableCell className="py-3 text-center">
                        <TableCellContent value={(currentPage - 1) * itemsPerPage + index + 1} />
                      </TableCell>
                      {columns.map((col) => {
                        const rawValue = col.render
                          ? col.render(
                            row[col.key],
                            {
                              row,
                              onChange: (action: string, payload?: any) =>
                                onChange(action, { ...payload, id: row.id }),
                            },
                            index
                          )
                          : row[col.key] ?? <span className="text-muted-foreground">-</span>;

                        return (
                          <TableCell
                            key={col.key}
                            className={cn("py-3", isDisabledRow && "text-muted-foreground")}
                          >
                            <TableCellContent value={rawValue} />
                          </TableCell>
                        );
                      })}
                      {!hideActions && (
                        <TableCell className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2 relative">
                            {visibleActions.map(({ key, icon, labelText, onClick, render }) => (
                              render ? (
                                <div key={key}>{render(labelText, { row, onChange, onClick }, index)}</div>
                              ) : (
                                <TooltipProvider key={key}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 border hover:cursor-pointer"
                                        disabled={isDisabledRow}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onClick?.();
                                        }}
                                      >
                                        {icon}
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>{labelText}</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )
                            ))}

                            {dropdownActions.length > 0 && !isDisabledRow && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreIcon className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {dropdownActions.map(({ key, label, icon, onClick }) => (
                                    <DropdownMenuItem
                                      key={key}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onClick?.();
                                      }}
                                    >
                                      <div className="flex items-center gap-2">
                                        {icon}
                                        {label}
                                      </div>
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              ) : (
                <TableRow className="h-full">
                  <TableCell
                    colSpan={columns.length + (hideActions ? 0 : 1) + 1}
                    className="h-full text-center align-middle"
                  >
                    No Data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div ref={paginationSentinelRef} className="h-px w-full" aria-hidden />

      {/* Footer / Pagination */}
      {totalItems > 20 && (
      <div
        className={cn(
          "sticky bottom-4 z-50 transition-all duration-300",
          isFooterStuck && "px-6"
        )}
      >
        <div className={cn(
          "flex flex-col sm:flex-row items-center justify-between gap-4 p-3 rounded-lg bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 border shadow-sm",
          isFooterStuck && "shadow-lg border-primary/20"
        )}>

          {/* Summary Items */}
          <div className="flex flex-wrap items-center gap-3">
            {footerSummary?.map((item, index) => (
              <TooltipProvider key={index}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={cn(
                      "inline-flex items-center gap-2 px-3 py-1.5 rounded-md border bg-muted/50 text-sm font-medium",
                      item.className
                    )}>
                      <span className="text-muted-foreground text-xs">{item.label}</span>
                      <span className="flex items-center gap-1">
                        {item.prefix} {item.value}
                        {item.tooltip && <InfoIcon className="h-3.5 w-3.5 text-muted-foreground" />}
                      </span>
                    </div>
                  </TooltipTrigger>
                  {item.tooltip && <TooltipContent>{item.tooltip}</TooltipContent>}
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center gap-4 ml-auto">
              <UniFieldSelect
                value={String(itemsPerPage)}
                onValueChange={(val) => onChange("itemsPerPage", Number(val))}
                placeholder="Rows per page"
                containerClassName="w-[130px] h-9"
              >
                <SelectItem value="20">20 / page</SelectItem>
                <SelectItem value="50">50 / page</SelectItem>
                <SelectItem value="100">100 / page</SelectItem>
              </UniFieldSelect>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>

              {getPageNumbers().map((page, i) => (
                page === '...' ? (
                  <span key={i} className="px-2 text-muted-foreground">...</span>
                ) : (
                  <Button
                    key={i}
                    variant={currentPage === page ? "default" : "ghost"}
                    size="sm"
                    className="h-9 w-9 bg-blue-600"
                    onClick={() => onPageChange(Number(page))}
                  >
                    {page}
                  </Button>
                )
              ))}

              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Delete Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{deleteModalTitle || "Confirm Delete"}</DialogTitle>
            <DialogDescription>
              {deleteModalDescription || "Are you sure you want to delete this item? This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DynamicTable;
