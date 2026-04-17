"use client";

import { useEffect, useMemo, useState } from "react";
import { useTableData } from "@/hooks/useTableData";
import DynamicTable from "@/components/DynamicTable";
import {
  Button,
  Input,
  Textarea,
  MonthYearPicker,
  Spinner,
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/index";
import dayjs from "dayjs";
import CustomDrawer from "@/components/CustomDrawer";
import { settings } from "@/lib/api/settings";
import { showToast } from "@/lib/toast";

const CustomerLedgerPage = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedParty, setSelectedParty] = useState<any>(null);
  const [creditSummary, setCreditSummary] = useState<any>(null);
  const [creditLoading, setCreditLoading] = useState(false);
  const [getPartyCreditDays] = settings.useGetPartyCreditDaysMutation();
  const [addPartyPayment, { isLoading: paymentSaving }] = settings.useAddPartyPaymentMutation();
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentNote, setPaymentNote] = useState<string>("");
  const [ledgerRefreshKey, setLedgerRefreshKey] = useState(0);

  const monthValue = selectedDate.getMonth() + 1;
  const yearValue = selectedDate.getFullYear();
  const toNumber = (value: number | string | undefined | null) => Number(value || 0);
  const formatMoney = (value: number | string | undefined | null) => `₹${toNumber(value).toFixed(2)}`;
  const formatSignedMoney = (value: number | string | undefined | null) => {
    const val = toNumber(value);
    const sign = val < 0 ? "-" : "";
    return `${sign}₹${Math.abs(val).toFixed(2)}`;
  };

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
      refreshKey: ledgerRefreshKey,
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
      const monthKey = `${yearValue}-${String(monthValue).padStart(2, "0")}`;
      const monthBlock = result?.data?.months?.find((m: any) => m?.month === monthKey);
      setCreditSummary(monthBlock || null);
    } finally {
      setCreditLoading(false);
    }
  };

  useEffect(() => {
    if (!drawerOpen || !selectedParty?.party_id) return;
    loadPartySummary(selectedParty.party_id);
  }, [drawerOpen, selectedParty?.party_id, monthValue, yearValue, ledgerRefreshKey]);

  const handleRowClick = (row: any) => {
    if (!row?.party_id) return;
    setSelectedParty(row);
    setCreditSummary(null);
    setPaymentAmount("");
    setPaymentNote("");
    setDrawerOpen(true);
  };

  const handleAddPayment = async () => {
    if (!selectedParty?.party_id) {
      showToast.error("Select a party first");
      return;
    }

    const amountNumber = Number(paymentAmount || 0);
    if (!amountNumber || amountNumber <= 0) {
      showToast.error("Enter a valid payment amount");
      return;
    }

    try {
      await addPartyPayment({
        party_id: selectedParty.party_id,
        amount: amountNumber,
        note: paymentNote?.trim() || undefined,
      }).unwrap();
      showToast.success("Payment recorded successfully");
      setPaymentAmount("");
      setPaymentNote("");
      setLedgerRefreshKey((prev) => prev + 1);
      await loadPartySummary(selectedParty.party_id);
    } catch (error: any) {
      showToast.error(error?.data?.message || "Failed to record payment");
    }
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
          <MonthYearPicker value={selectedDate} onChange={setSelectedDate} />
        }
      />

      <CustomDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Ledger History"
        subtitle={
          <>
            <div className="flex gap-2">
              <span className="font-medium">{selectedParty?.party__name || ""}</span>
              <span className="text-muted-foreground">-</span>
              <div className="font-medium text-left">{dayjs(selectedDate).format("MMM, YYYY")}</div>
            </div>
          </>
        }
        footer={false}
        width={700}
      >
        <div className="mb-4 rounded-lg border p-4 space-y-3">
          <div className="text-sm font-semibold">Add Payment</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Amount</div>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="Enter amount"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button
                className="w-full"
                onClick={handleAddPayment}
                disabled={paymentSaving}
              >
                {paymentSaving ? "Saving..." : "Add Payment"}
              </Button>
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Note</div>
            <Textarea
              rows={2}
              placeholder="Optional note"
              value={paymentNote}
              onChange={(e) => setPaymentNote(e.target.value)}
            />
          </div>
        </div>

        {creditLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Spinner />
          </div>
        ) : creditSummary && creditSummary?.days?.length > 0 ? (
          <div className="space-y-5">
            {/* Calculate totals from all days */}
            {(() => {
              const totalAmount = Number(creditSummary?.month_net || 0);
              return (
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border p-3">
                    <div className="text-xs text-muted-foreground">Total</div>
                    <div className={`text-base font-semibold ${totalAmount < 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {formatSignedMoney(totalAmount)}
                    </div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-xs text-muted-foreground">Transactions</div>
                    <div className="text-base font-semibold">
                      {creditSummary.days?.reduce((sum: number, day: any) => sum + (day.transactions?.length || 0), 0)}
                    </div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-xs text-muted-foreground">Days</div>
                    <div className="text-base font-semibold">{creditSummary.days?.length || 0}</div>
                  </div>
                </div>
              );
            })()}

            <div className="space-y-4">
              <Accordion type="single" collapsible className="w-full">
                {creditSummary.days?.map((day: any, dayIndex: number) => (
                  <AccordionItem key={`${day.date}-${dayIndex}`} value={`${day.date}-${dayIndex}`}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="font-medium text-left">{dayjs(day.date).format("DD MMM, YYYY")}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatSignedMoney(day.total_amount)} ({day.transactions?.length || 0} transactions)
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 pt-2">
                        <div className="space-y-2">
                          {day.transactions?.map((transaction: any, index: number) => (
                            (() => {
                              const amountValue = Number(transaction.amount || 0);
                              const isPayment = amountValue < 0;
                              const amountClass = isPayment ? "text-emerald-600" : "text-red-600";
                              const title = transaction.sales_code || (isPayment ? "Payment" : "Transaction");
                              return (
                            <div
                              key={`${day.date}-${transaction.sales_code}-${index}`}
                              className="rounded-lg border p-3 space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <div className="font-medium">
                                  {title}
                                </div>
                                <div className={`${amountClass} font-semibold`}>
                                  {formatSignedMoney(amountValue)}
                                </div>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {transaction.note || (isPayment ? "Payment received" : "Sales invoice")}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{dayjs(day.date).format("DD MMM, YYYY")}</span>
                                {transaction.sales_code && <span>• {transaction.sales_code}</span>}
                              </div>
                            </div>
                              );
                            })()
                          ))}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        ) : (
          <div className="flex h-40 items-center justify-center text-muted-foreground">
            No data available for selected period
          </div>
        )}
      </CustomDrawer>
    </>
  );
};

export default CustomerLedgerPage;
