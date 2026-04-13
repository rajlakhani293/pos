"use client";

import { useEffect, useState } from "react";
import CustomDrawer from "@/components/CustomDrawer";
import { Spinner } from "@/components/ui/spinner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MonthYearPicker } from "@/components/date-picker";
import dayjs from "dayjs";
import { settings } from "@/lib/api/settings";

type DueHistoryDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  party: any | null;
};

const toNumber = (value: number | string | undefined | null) => Number(value || 0);
const formatSignedMoney = (value: number | string | undefined | null) => {
  const val = toNumber(value);
  const sign = val < 0 ? "-" : "";
  return `${sign}₹${Math.abs(val).toFixed(2)}`;
};

export const DueHistoryDrawer = ({ isOpen, onClose, party }: DueHistoryDrawerProps) => {
  const [creditSummary, setCreditSummary] = useState<any>(null);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [creditLoading, setCreditLoading] = useState(false);
  const [getPartyCreditDays] = settings.useGetPartyCreditDaysMutation();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const monthValue = selectedDate.getMonth() + 1;
  const yearValue = selectedDate.getFullYear();

  const loadPartySummary = async (partyId: number) => {
    setCreditLoading(true);
    try {
      const result = await getPartyCreditDays({
        id: partyId,
        payLoad: { month: monthValue, year: yearValue },
      }).unwrap() as { data?: any };
      setCreditSummary(result?.data?.month || null);
      setPaymentHistory(result?.data?.payments || []);
    } finally {
      setCreditLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !party?.id) return;
    loadPartySummary(party.id);
  }, [isOpen, party?.id, monthValue, yearValue]);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedDate(new Date());
    setCreditSummary(null);
  }, [isOpen]);


  return (
    <CustomDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Due History"
      subtitle={
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{party?.name}</span>
          <div className="text-sm font-semibold text-muted-foreground">
            {dayjs(`${creditSummary?.month}-01`).format("MMM YYYY")}
          </div>
        </div>
      }
      headerRight={<MonthYearPicker value={selectedDate} onChange={setSelectedDate} />}
      footer={false}
      width={700}
    >
      {creditLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner />
        </div>
      ) : creditSummary ? (
        <div className="space-y-5">
          <div className="space-y-4">
           
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">Opening Balance</div>
                <div className="text-base font-semibold">{formatSignedMoney(creditSummary.opening_balance)}</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">Month Due</div>
                <div className="text-base font-semibold text-red-600">{formatSignedMoney(creditSummary.month_due_total)}</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">Month Paid</div>
                <div className="text-base font-semibold text-emerald-600">{formatSignedMoney(creditSummary.month_paid_total)}</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">Closing Balance</div>
                <div className={`text-base font-semibold ${Number(creditSummary.closing_balance) < 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {formatSignedMoney(creditSummary.closing_balance)}
                </div>
              </div>
            </div>

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

            {paymentHistory.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-semibold">Payment History</div>
                <div className="space-y-2">
                  {paymentHistory.map((payment: any) => (
                    <div key={payment.id} className="rounded-lg border p-3 flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="text-sm font-medium">
                          {dayjs(payment.date).format("DD MMM, YYYY")}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {payment.note || "Payment received"}
                        </div>
                      </div>
                      <div className="text-emerald-600 font-semibold">
                        {formatSignedMoney(-Math.abs(Number(payment.amount || 0)))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex h-40 items-center justify-center text-muted-foreground">
          No data available for selected period
        </div>
      )}
    </CustomDrawer>
  );
};
