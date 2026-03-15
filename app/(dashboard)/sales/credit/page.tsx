"use client";

import React, { useMemo, useState, useEffect } from "react";
import dayjs from "dayjs";
import DynamicTable from "@/components/DynamicTable";
import { sales } from "@/lib/api/sales";
import { showToast } from "@/lib/toast";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

const PERIOD_OPTIONS = [
  { label: "This Month", value: "monthly" },
  { label: "This Year", value: "yearly" },
];

const PartyCreditPage = () => {
  const [period, setPeriod] = useState("monthly");
  const [selectedParty, setSelectedParty] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [expandedDayKey, setExpandedDayKey] = useState<string | null>(null);
  const [fetchSummary, { data: summaryData, isLoading: isSummaryLoading }] =
    sales.useGetPartyCreditSummaryMutation();
  const [fetchDays, { data: daysData, isLoading: isDaysLoading }] =
    sales.useGetPartyCreditDaysMutation();

  const items = (summaryData as any)?.data?.items || [];

  const loadSummary = async (selectedPeriod = period) => {
    try {
      await fetchSummary({ period: selectedPeriod }).unwrap();
    } catch (error: any) {
      showToast.error(error?.data?.message || "Failed to load credit summary");
    }
  };

  const loadDays = async (party: any) => {
    try {
      const result: any = await fetchDays({
        id: party.party_id,
        payLoad: { period },
      }).unwrap();
      setSelectedParty({
        ...party,
        days: result?.data?.days || [],
      });
      setExpandedDayKey(null);
      setDetailsOpen(true);
    } catch (error: any) {
      showToast.error(error?.data?.message || "Failed to load party details");
    }
  };

  const columns = useMemo(
    () => [
      {
        key: "party__name",
        title: "Party",
      },
      {
        key: "total_amount",
        title: "Total Amount",
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
          <span className="font-semibold text-red-600">
            {Number(value || 0).toFixed(2)}
          </span>
        ),
      },
    ],
    []
  );

  const dayColumns = useMemo(
    () => [
      {
        key: "label",
        title: "Date",
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
        render: (value: any) => Number(value || 0).toFixed(2),
      },
    ],
    []
  );

  const salesColumns = useMemo(
    () => [
      {
        key: "sales_code",
        title: "Sales Code",
      },
      {
        key: "created_at",
        title: "Time",
        render: (value: string) => dayjs(value).format("hh:mm A"),
      },
      {
        key: "total_amount",
        title: "Total",
        render: (value: any) => Number(value || 0).toFixed(2),
      },
      {
        key: "paid_amount",
        title: "Paid",
        render: (value: any) => Number(value || 0).toFixed(2),
      },
      {
        key: "due_amount",
        title: "Due",
        render: (value: any) => Number(value || 0).toFixed(2),
      },
    ],
    []
  );

  const handlePeriodChange = async (next: string) => {
    setPeriod(next);
    await loadSummary(next);
    setDetailsOpen(false);
  };

  useEffect(() => {
    loadSummary(period);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <DynamicTable
        tableTitle="Party Credit Summary"
        showSearch={false}
        data={items}
        columns={columns}
        isLoading={isSummaryLoading}
        showDelete={false}
        showEdit={false}
        hideActions={true}
        onRowClick={(row) => loadDays(row)}
        secondaryActionButton={
          <div className="flex items-center gap-2">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`px-3 py-1.5 rounded-md border text-sm ${period === opt.value ? "bg-primary text-primary-foreground" : "bg-white"}`}
                onClick={() => handlePeriodChange(opt.value)}
              >
                {opt.label}
              </button>
            ))}
            <button
              type="button"
              className="px-3 py-1.5 rounded-md border text-sm"
              onClick={() => loadSummary()}
            >
              Refresh
            </button>
          </div>
        }
      />

      <Drawer open={detailsOpen} onOpenChange={setDetailsOpen} direction="right">
        <DrawerContent className="w-full sm:max-w-4xl">
          <DrawerHeader className="flex items-start justify-between gap-3">
            <div>
              <DrawerTitle>{selectedParty?.party__name || "Party Details"}</DrawerTitle>
              <DrawerDescription>
                {period === "yearly" ? "Yearly" : "Monthly"} credit breakdown
              </DrawerDescription>
            </div>
            <DrawerClose asChild>
              <Button variant="outline" size="sm">Close</Button>
            </DrawerClose>
          </DrawerHeader>

          <div className="space-y-4">
            <div className="rounded-md border p-3 bg-muted/30">
              <div className="flex flex-wrap gap-6 text-sm">
                <div>
                  <div className="text-muted-foreground">Total Amount</div>
                  <div className="font-semibold">{Number(selectedParty?.total_amount || 0).toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Paid</div>
                  <div className="font-semibold">{Number(selectedParty?.total_paid || 0).toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Due</div>
                  <div className="font-semibold text-red-600">{Number(selectedParty?.due_amount || 0).toFixed(2)}</div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-semibold">Day Summary</div>
              <div className="rounded-md border overflow-hidden">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr>
                      {dayColumns.map((col) => (
                        <th key={col.key} className="px-4 py-2 text-left font-medium text-muted-foreground">
                          {col.title}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedParty?.days || []).map((day: any) => {
                      const isOpen = expandedDayKey === day.label;
                      return (
                        <React.Fragment key={day.label}>
                          <tr
                            className="cursor-pointer border-t hover:bg-muted/30"
                            onClick={() => setExpandedDayKey(isOpen ? null : day.label)}
                          >
                            {dayColumns.map((col) => (
                              <td key={col.key} className="px-4 py-2">
                                {col.render ? col.render(day[col.key], day, 0) : day[col.key]}
                              </td>
                            ))}
                          </tr>
                          {isOpen ? (
                            <tr className="border-t bg-white">
                              <td colSpan={dayColumns.length} className="px-4 py-3">
                                <div className="text-sm font-semibold mb-2">
                                  Sales on {day.label}
                                </div>
                                {day?.sales?.length ? (
                                  <div className="rounded-md border overflow-hidden">
                                    <table className="min-w-full text-sm">
                                      <thead className="bg-muted/40">
                                        <tr>
                                          {salesColumns.map((col) => (
                                            <th key={col.key} className="px-3 py-2 text-left font-medium text-muted-foreground">
                                              {col.title}
                                            </th>
                                          ))}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {day.sales.map((sale: any, idx: number) => (
                                          <tr key={`${sale.sales_code}-${idx}`} className="border-t">
                                            {salesColumns.map((col) => (
                                              <td key={col.key} className="px-3 py-2">
                                                {col.render ? col.render(sale[col.key], sale, idx) : sale[col.key]}
                                              </td>
                                            ))}
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : (
                                  <div className="text-xs text-muted-foreground">No sales found.</div>
                                )}
                              </td>
                            </tr>
                          ) : null}
                        </React.Fragment>
                      );
                    })}
                    {!isDaysLoading && (selectedParty?.days || []).length === 0 ? (
                      <tr>
                        <td colSpan={dayColumns.length} className="px-4 py-6 text-center text-muted-foreground">
                          No data found.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default PartyCreditPage;
