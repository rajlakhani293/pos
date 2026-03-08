"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { sales } from "@/lib/api/sales";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { UniFieldInput } from "@/components/ui/unifield-input";
import { showToast } from "@/lib/toast";

type SalesTransaction = {
  id: number;
  item_id: number;
  item__item_name: string;
  item_quantity: number | string;
  returned_quantity: number | string;
  item_rate: number | string;
  total_amount: number | string;
};

type SalesReturnLine = {
  id: number;
  item_name: string;
  return_quantity: number | string;
  item_rate: number | string;
  total_amount: number | string;
};

type SalesReturnRecord = {
  id: number;
  return_code: string;
  return_date: string;
  total_return_amount: number | string;
  notes?: string;
  transactions: SalesReturnLine[];
};

type SalesData = {
  id: number;
  sales_code: string;
  total_amount: number | string;
  paid_amount: number | string;
  outstanding_amount?: number | string;
  is_reverted: boolean;
  notes?: string;
  transactions: SalesTransaction[];
  returns: SalesReturnRecord[];
};

const toNumber = (v: number | string | undefined | null) => Number(v || 0);

export default function SalesDetailPage() {
  const router = useRouter();
  const params = useParams();
  const saleId = Number(params.id);

  const [getSaleById] = sales.useGetSaleByIdMutation();
  const [createSaleReturn] = sales.useCreateSaleReturnMutation();
  const [revertSale] = sales.useRevertSaleMutation();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);
  const [isSubmittingRevert, setIsSubmittingRevert] = useState(false);
  const [saleData, setSaleData] = useState<SalesData | null>(null);
  const [returnQty, setReturnQty] = useState<Record<number, string>>({});
  const [returnNotes, setReturnNotes] = useState("");
  const [revertNotes, setRevertNotes] = useState("");

  const fetchSale = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getSaleById({ id: saleId }).unwrap() as { data: SalesData };
      const data = result?.data;
      setSaleData(data || null);

      const qtyMap: Record<number, string> = {};
      (data?.transactions || []).forEach((line) => {
        qtyMap[line.id] = "";
      });
      setReturnQty(qtyMap);
    } catch (error: unknown) {
      const errorData = (error as { data?: { message?: string } })?.data;
      showToast.error(errorData?.message || "Failed to load sales details");
    } finally {
      setIsLoading(false);
    }
  }, [getSaleById, saleId]);

  useEffect(() => {
    if (!Number.isFinite(saleId)) return;
    fetchSale();
  }, [saleId, fetchSale]);

  const returnPreviewAmount = useMemo(() => {
    if (!saleData) return 0;
    return saleData.transactions.reduce((sum, line) => {
      const qty = toNumber(returnQty[line.id]);
      return sum + qty * toNumber(line.item_rate);
    }, 0);
  }, [saleData, returnQty]);

  const handleSubmitReturn = async () => {
    if (!saleData) return;
    if (saleData.is_reverted) {
      showToast.error("Sale already reverted");
      return;
    }

    const lines = saleData.transactions
      .map((line) => {
        const qty = toNumber(returnQty[line.id]);
        const balanceQty = toNumber(line.item_quantity) - toNumber(line.returned_quantity);
        if (qty <= 0) return null;
        if (qty > balanceQty) {
          throw new Error(`${line.item__item_name}: return qty exceeds balance (${balanceQty})`);
        }
        return {
          sales_transaction_id: line.id,
          return_quantity: qty,
        };
      })
      .filter(Boolean);

    if (lines.length === 0) {
      showToast.error("Enter return quantity for at least one item");
      return;
    }

    setIsSubmittingReturn(true);
    try {
      const result = await createSaleReturn({
        id: saleData.id,
        payLoad: {
          notes: returnNotes || undefined,
          transactions: lines,
        },
      }).unwrap() as { message?: string };

      showToast.success(result?.message || "Sales return created successfully");
      setReturnNotes("");
      await fetchSale();
    } catch (error: unknown) {
      const message = error instanceof Error
        ? error.message
        : (error as { data?: { message?: string } })?.data?.message;
      showToast.error(message || "Failed to create sales return");
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  const handleRevertSale = async () => {
    if (!saleData) return;
    if (saleData.is_reverted) {
      showToast.error("Sale already reverted");
      return;
    }

    const ok = window.confirm("Revert full sale? This will return all remaining quantities to stock.");
    if (!ok) return;

    setIsSubmittingRevert(true);
    try {
      const result = await revertSale({
        id: saleData.id,
        payLoad: {
          notes: revertNotes || undefined,
        },
      }).unwrap() as { message?: string };

      showToast.success(result?.message || "Sales reverted successfully");
      setRevertNotes("");
      await fetchSale();
    } catch (error: unknown) {
      const errorData = (error as { data?: { message?: string } })?.data;
      showToast.error(errorData?.message || "Failed to revert sale");
    } finally {
      setIsSubmittingRevert(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!saleData) {
    return (
      <div className="p-4">
        <p className="text-gray-600">Sale not found.</p>
      </div>
    );
  }

  return (
    <div className="bg-white h-full overflow-y-auto custom-scrollbar">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Sales {saleData.sales_code}</h1>
          <p className="text-sm text-gray-500">
            Total: {toNumber(saleData.total_amount).toFixed(2)} | Paid: {toNumber(saleData.paid_amount).toFixed(2)}
          </p>
          {saleData.is_reverted && <p className="text-sm text-red-600 mt-1">This sale is fully reverted.</p>}
        </div>
        <Button variant="outline" onClick={() => router.push("/sales")}>Back</Button>
      </div>

      <div className="p-4 space-y-4">
        <div className="border border-gray-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">Partial Return</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-2">Item</th>
                  <th className="text-right p-2">Sold Qty</th>
                  <th className="text-right p-2">Returned</th>
                  <th className="text-right p-2">Balance</th>
                  <th className="text-right p-2">Rate</th>
                  <th className="text-right p-2 w-32">Return Qty</th>
                </tr>
              </thead>
              <tbody>
                {saleData.transactions.map((line) => {
                  const sold = toNumber(line.item_quantity);
                  const returned = toNumber(line.returned_quantity);
                  const balance = sold - returned;
                  return (
                    <tr key={line.id} className="border-t border-gray-100">
                      <td className="p-2">{line.item__item_name}</td>
                      <td className="p-2 text-right">{sold}</td>
                      <td className="p-2 text-right">{returned}</td>
                      <td className="p-2 text-right">{balance}</td>
                      <td className="p-2 text-right">{toNumber(line.item_rate).toFixed(2)}</td>
                      <td className="p-2">
                        <UniFieldInput
                          type="number"
                          min={0}
                          step={0.01}
                          value={returnQty[line.id] || ""}
                          onChange={(e) => setReturnQty((prev) => ({ ...prev, [line.id]: e.target.value }))}
                          disabled={saleData.is_reverted || balance <= 0}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <UniFieldInput
              label="Return Notes"
              type="text"
              value={returnNotes}
              onChange={(e) => setReturnNotes(e.target.value)}
              placeholder="Optional notes"
            />
            <div className="flex items-end justify-between gap-3">
              <p className="text-sm text-gray-600">Return Amount Preview: {returnPreviewAmount.toFixed(2)}</p>
              <Button onClick={handleSubmitReturn} disabled={isSubmittingReturn || saleData.is_reverted}>
                {isSubmittingReturn ? "Saving..." : "Create Return"}
              </Button>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">Full Revert</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <UniFieldInput
              label="Revert Notes"
              type="text"
              value={revertNotes}
              onChange={(e) => setRevertNotes(e.target.value)}
              placeholder="Optional notes for full revert"
            />
            <div className="flex items-end justify-end">
              <Button
                onClick={handleRevertSale}
                disabled={isSubmittingRevert || saleData.is_reverted}
                variant="destructive"
              >
                {isSubmittingRevert ? "Reverting..." : "Revert Full Sale"}
              </Button>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">Return History</h2>
          {saleData.returns?.length ? (
            <div className="space-y-3">
              {saleData.returns.map((entry) => (
                <div key={entry.id} className="border border-gray-100 rounded p-3">
                  <p className="font-medium">{entry.return_code}</p>
                  <p className="text-sm text-gray-600">
                    Amount: {toNumber(entry.total_return_amount).toFixed(2)}
                  </p>
                  {entry.notes ? <p className="text-sm text-gray-500">{entry.notes}</p> : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No returns yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
