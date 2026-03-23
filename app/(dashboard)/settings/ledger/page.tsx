"use client";

import { useEffect, useMemo, useState } from "react";
import { useTableData } from "@/hooks/useTableData";
import DynamicTable from "@/components/DynamicTable";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import dayjs from "dayjs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import CustomDrawer from "@/components/CustomDrawer";
import { Spinner } from "@/components/ui/spinner";
import { settings } from "@/lib/api/settings";

const CustomerLedgerPage = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerView, setPickerView] = useState<"month" | "year">("month");
  const [displayYear, setDisplayYear] = useState(selectedDate.getFullYear());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedParty, setSelectedParty] = useState<any>(null);
  const [creditSummary, setCreditSummary] = useState<any>(null);
  const [creditLoading, setCreditLoading] = useState(false);
  const [getPartyCreditDays] = settings.useGetPartyCreditDaysMutation();
  
  const monthValue = selectedDate.getMonth() + 1; 
  const yearValue = selectedDate.getFullYear();
  const decadeStart = Math.floor(displayYear / 10) * 10;
  const yearGrid = Array.from({ length: 12 }, (_, index) => decadeStart - 1 + index);
  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const toNumber = (value: number | string | undefined | null) => Number(value || 0);
  const formatMoney = (value: number | string | undefined | null) => `₹${toNumber(value).toFixed(2)}`;

  const {
    orders,
    totalItems,
    isLoading,
    currentPage,
    setCurrentPage,
    sortConfig,
    handleSort,
    sortableFields,
    handleFilterChange,
    searchTerm,
    itemsPerPage,
  } = useTableData({
    getMaster: settings.useGetLedgerTransactionsMutation,
    itemsPerPage: 20,
    extraOptions: {
      month: monthValue,
      year: yearValue,
    },
  });

  const columns = useMemo(
    () => [
      {
        key: "party__name",
        title: "Party",
      },
      {
        key: "party__phone_number",
        title: "Phone",
      },
      {
        key: "party__email",
        title: "Email",
      },
      {
        key: "total_amount",
        title: "Total",
        render: (value: any) => Number(value || 0).toFixed(2),
      },
      {
        key: "total_paid",
        title: "Paid",
        render: (value: any) => Number(value || 0).toFixed(2),
      },
      {
        key: "due_amount",
        title: "Due",
        render: (value: any) => (
          <span className="text-red-600 font-semibold">
            {Number(value || 0).toFixed(2)}
          </span>
        ),
      },
      {
        key: "party__current_balance",
        title: "Current Balance",
        render: (value: any) => Number(value || 0).toFixed(2),
      },
    ],
    []
  );

  const loadPartySummary = async (partyId: number) => {
    setCreditLoading(true);
    try {
      const result = await getPartyCreditDays({
        id: partyId,
        payLoad: { month: monthValue, year: yearValue },
      }).unwrap() as { data?: any };
      setCreditSummary(result?.data || null);
    } finally {
      setCreditLoading(false);
    }
  };

  useEffect(() => {
    if (!drawerOpen || !selectedParty?.party_id) return;
    loadPartySummary(selectedParty.party_id);
  }, [drawerOpen, selectedParty?.party_id, monthValue, yearValue]);

  const handleRowClick = (row: any) => {
    if (!row?.party_id) return;
    setSelectedParty(row);
    setCreditSummary(null);
    setDrawerOpen(true);
  };

  return (
    <>
      <DynamicTable
        tableTitle="Customer Ledger"
        showSearch={true}
        searchTerm={searchTerm}
        showDateRange={false}
        onFilterChange={handleFilterChange}
        data={orders}
        columns={columns}
        sortConfig={sortConfig}
        onSort={handleSort}
        sortableFields={sortableFields}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        totalItems={totalItems}
        onPageChange={setCurrentPage}
        showDelete={false}
        showEdit={false}
        isLoading={isLoading}
        onRowClick={handleRowClick}
        secondaryActionButton={
        <Popover
          open={isPickerOpen}
          onOpenChange={(open) => {
            setIsPickerOpen(open);
            if (open) {
              setDisplayYear(selectedDate.getFullYear());
              setPickerView("month");
            }
          }}
        >
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="h-9 justify-start gap-2 px-3 text-left font-normal"
            >
              <CalendarIcon className="h-4 w-4" />
              {format(selectedDate, "MMM yyyy")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-0" align="end">
            {pickerView === "month" ? (
              <div className="bg-background">
                <div className="flex items-center justify-between border-b border-border px-3 py-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDisplayYear((prev) => prev - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-sm font-semibold"
                    onClick={() => setPickerView("year")}
                  >
                    {displayYear}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDisplayYear((prev) => prev + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-2 p-3">
                  {monthLabels.map((label, index) => {
                    const isSelected =
                      selectedDate.getFullYear() === displayYear &&
                      selectedDate.getMonth() === index;

                    return (
                      <Button
                        key={label}
                        variant={isSelected ? "default" : "ghost"}
                        className="h-10 text-sm"
                        onClick={() => {
                          setSelectedDate(new Date(displayYear, index, 1));
                          setIsPickerOpen(false);
                        }}
                      >
                        {label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-background">
                <div className="flex items-center justify-between border-b border-border px-3 py-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDisplayYear((prev) => prev - 10)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-sm font-semibold">{decadeStart}-{decadeStart + 9}</div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDisplayYear((prev) => prev + 10)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-2 p-3">
                  {yearGrid.map((year) => {
                    const isOutside = year < decadeStart || year > decadeStart + 9;
                    const isSelected = year === selectedDate.getFullYear();

                    return (
                      <Button
                        key={year}
                        variant={isSelected ? "default" : "ghost"}
                        className={isOutside ? "h-10 text-sm text-muted-foreground" : "h-10 text-sm"}
                        disabled={isOutside}
                        onClick={() => {
                          setDisplayYear(year);
                          setPickerView("month");
                        }}
                      >
                        {year}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}
          </PopoverContent>
        </Popover>
        }
      />

      <CustomDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Ledger History"
        subtitle={selectedParty?.party__name ? selectedParty.party__name : undefined}
        footer={false}
        width={700}
      >
        {creditLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Spinner />
          </div>
        ) : creditSummary ? (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {dayjs(`${creditSummary.year}-${creditSummary.month}-01`).format("MMM YYYY")}
              </div>
              <div className="text-xs text-muted-foreground">
                {selectedParty?.party__phone_number || ""}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">Total</div>
                <div className="text-base font-semibold">{formatMoney(creditSummary.total_amount)}</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">Paid</div>
                <div className="text-base font-semibold">{formatMoney(creditSummary.total_paid)}</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">Due</div>
                <div className="text-base font-semibold text-red-600">{formatMoney(creditSummary.due_amount)}</div>
              </div>
            </div>

            <div className="space-y-4">
              {creditSummary.days?.length ? (
                creditSummary.days.map((day: any, dayIndex: number) => (
                  <div key={`${day.label}-${dayIndex}`} className="rounded-lg border p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{day.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatMoney(day.total_amount)} / {formatMoney(day.total_paid)}
                      </div>
                    </div>
                    <div className="space-y-2">
                      {day.entries?.length ? (
                        day.entries.map((entry: any, index: number) => (
                          <div
                            key={`${day.label}-${dayIndex}-${entry.reference_id ?? entry.sales_code ?? "entry"}-${entry.created_at ?? "na"}-${index}`}
                            className="rounded-md border p-2 text-sm"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="font-medium">
                                {entry.sales_code || entry.reference_type || "Entry"}
                              </div>
                              <div className={toNumber(entry.amount) >= 0 ? "text-green-600" : "text-blue-600"}>
                                {formatMoney(entry.amount)}
                              </div>
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              {entry.entry_type && <span>{entry.entry_type}</span>}
                              {entry.reference_id && <span>Ref #{entry.reference_id}</span>}
                              {entry.balance_after !== undefined && (
                                <span>Bal {formatMoney(entry.balance_after)}</span>
                              )}
                              {entry.created_at && (
                                <span>{dayjs(entry.created_at).format("DD MMM, hh:mm A")}</span>
                              )}
                            </div>
                            {entry.note && (
                              <div className="mt-1 text-xs text-muted-foreground">{entry.note}</div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-muted-foreground">No entries.</div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                  No history found for this month.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            Select a party to view history.
          </div>
        )}
      </CustomDrawer>
    </>
  );
};

export default CustomerLedgerPage;
