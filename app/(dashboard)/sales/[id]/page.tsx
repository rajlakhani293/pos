"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { sales } from "@/lib/api/sales";
import { items } from "@/lib/api/items";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { UniFieldInput } from "@/components/ui/unifield-input";
import { UniFieldSelect } from "@/components/ui/unifield-select";
import { SelectItem } from "@/components/ui/select";
import { showToast } from "@/lib/toast";

type SalesTransaction = {
  id: number;
  item_id: number;
  item?: number;
  item__item_name?: string;
  item_name?: string;
  item_description?: string;
  item_quantity: number | string;
  returned_quantity: number | string;
  item_rate: number | string;
  total_amount: number | string;
};

type SalesData = {
  id: number;
  sales_code: string;
  total_amount: number | string;
  paid_amount: number | string;
  outstanding_amount?: number | string;
  notes?: string;
  status?: number;
  transactions: SalesTransaction[];
};

type ItemDropdown = {
  id: number;
  item_name: string;
  item_code: string;
  selling_price?: number | string;
  current_stock?: number | string;
};

type NewItemLine = {
  item_id: number;
  item?: number;
  item_name: string;
  item_code: string;
  item_rate: number;
  item_quantity: number;
  total_amount: number;
};

const toNumber = (v: number | string | undefined | null) => Number(v || 0);

export default function SalesDetailPage() {
  const router = useRouter();
  const params = useParams();
  const saleId = Number(params.id);

  const [getSaleById] = sales.useGetSaleByIdMutation();
  const [editSale] = sales.useEditSaleMutation();
  const [getItemsDropdown] = items.useGetItemsDropdownMutation();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saleData, setSaleData] = useState<SalesData | null>(null);
  const [returnQty, setReturnQty] = useState<Record<number, string>>({});
  const [returnNotes, setReturnNotes] = useState("");
  const [itemsList, setItemsList] = useState<ItemDropdown[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [newItemQty, setNewItemQty] = useState<string>("1");
  const [newItemRate, setNewItemRate] = useState<string>("");
  const [updateNotes, setUpdateNotes] = useState("");
  const [newItems, setNewItems] = useState<NewItemLine[]>([]);
  const [isFooterStuck, setIsFooterStuck] = useState(false);
  const paginationSentinelRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const fetchedSaleIdRef = useRef<number | null>(null);
  const itemsLoadedRef = useRef(false);


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
  }, [saleId, getSaleById]);

  useEffect(() => {
    if (!Number.isFinite(saleId)) return;
    if (fetchedSaleIdRef.current === saleId) return;
    fetchedSaleIdRef.current = saleId;
    fetchSale();
  }, [saleId, fetchSale]);

  const fetchItems = useCallback(async () => {
    try {
      const result = await getItemsDropdown({}).unwrap() as { data?: ItemDropdown[] };
      const list = Array.isArray(result?.data) ? result.data : [];
      setItemsList(list);
    } catch (error: unknown) {
      const errorData = (error as { data?: { message?: string } })?.data;
      showToast.error(errorData?.message || "Failed to load items");
    }
  }, [getItemsDropdown]);

  useEffect(() => {
    if (itemsLoadedRef.current) return;
    itemsLoadedRef.current = true;
    fetchItems();
  }, [fetchItems]);

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
        root: contentRef.current,
        rootMargin: "0px 0px -100px 0px",
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isLoading]);

  const returnPreviewAmount = useMemo(() => {
    if (!saleData) return 0;
    return saleData.transactions.reduce((sum, line) => {
      const qty = toNumber(returnQty[line.id]);
      return sum + qty * toNumber(line.item_rate);
    }, 0);
  }, [saleData, returnQty]);

  const newItemsTotal = useMemo(() => {
    return newItems.reduce((sum, line) => sum + line.total_amount, 0);
  }, [newItems]);

  const netAmount = useMemo(() => {
    const originalTotal = toNumber(saleData?.total_amount || 0);
    const returnAmount = returnPreviewAmount;
    const exchangeAmount = newItemsTotal;

    return originalTotal + exchangeAmount - returnAmount;
  }, [saleData, returnPreviewAmount, newItemsTotal]);

  const remainingBalance = useMemo(() => {
    const paidAmount = toNumber(saleData?.paid_amount || 0);
    return netAmount - paidAmount;
  }, [netAmount, saleData]);

  const isFullyReturned = (saleData?.status || 0) === 3;

  const selectedItem = useMemo(() => {
    const id = Number(selectedItemId);
    if (!id) return null;
    return itemsList.find((item) => item.id === id) || null;
  }, [itemsList, selectedItemId]);

  const itemLookup = useMemo(() => {
    return itemsList.reduce<Record<number, ItemDropdown>>((acc, item) => {
      acc[item.id] = item;
      return acc;
    }, {});
  }, [itemsList]);

  const handleAddNewItem = () => {
    if (!selectedItem) {
      showToast.error("Select an item");
      return;
    }
    const qty = Number(newItemQty || 1);
    const rate = Number(newItemRate || selectedItem.selling_price || 0);
    if (!qty || qty <= 0) {
      showToast.error("Quantity must be greater than 0");
      return;
    }
    if (rate < 0) {
      showToast.error("Rate cannot be negative");
      return;
    }

    const line: NewItemLine = {
      item_id: selectedItem.id,
      item_name: selectedItem.item_name,
      item_code: selectedItem.item_code,
      item_rate: rate,
      item_quantity: qty,
      total_amount: qty * rate,
    };

    setNewItems((prev) => [...prev, line]);
    setSelectedItemId("");
    setNewItemQty("1");
    setNewItemRate("");
  };

  const handleRemoveNewItem = (index: number) => {
    setNewItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveAll = async () => {
    if (!saleData) return;
    if (isFullyReturned) {
      showToast.error("Sale is already fully returned");
      return;
    }

    const returnLines = saleData.transactions
      .map((line) => {
        const qty = toNumber(returnQty[line.id]);
        const balanceQty = toNumber(line.item_quantity) - toNumber(line.returned_quantity);
        if (qty <= 0) return null;
        if (qty > balanceQty) {
          const itemLabel = line.item__item_name || itemLookup[line.item_id || line.item || 0]?.item_name || line.item_name || line.item_description || "Item";
          throw new Error(`${itemLabel}: return qty exceeds balance (${balanceQty})`);
        }
        return {
          sales_transaction_id: line.id,
          return_quantity: qty,
        };
      })
      .filter(Boolean) as { sales_transaction_id: number; return_quantity: number }[];

    const addLines = newItems.map((line) => ({
      item_id: line.item_id,
      item_quantity: line.item_quantity,
      item_rate: line.item_rate,
      item_description: `${line.item_name} (${line.item_code})`,
      discount_percentage: 0,
      discount_amount: 0,
      tax_amount: 0,
      total_amount: line.total_amount,
    }));

    if (returnLines.length === 0 && addLines.length === 0) {
      showToast.error("Add return qty or add new items");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        return_notes: returnNotes || undefined,
        update_notes: updateNotes || undefined,
        return_transactions: returnLines,
        add_transactions: addLines,
      };

      const result = await editSale({ id: saleData.id, payLoad: payload }).unwrap() as { message?: string };
      showToast.success(result?.message || "Sales updated successfully");
      setReturnNotes("");
      setUpdateNotes("");
      setNewItems([]);
      // await fetchSale();
      router.push('/sales');
    } finally {
      setIsSubmitting(false);
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
    <div className="bg-white flex flex-col h-full relative">
      <div  ref={contentRef} className="bg-white h-full overflow-y-auto custom-scrollbar">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Sales {saleData.sales_code}</h1>
            <p className="text-sm text-gray-500">
              Total: {toNumber(saleData.total_amount).toFixed(2)} | Paid: {toNumber(saleData.paid_amount).toFixed(2)}
            </p>
            {isFullyReturned && <p className="text-sm text-red-600 mt-1">This sale is fully returned.</p>}
          </div>
          <Button variant="outline" onClick={() => router.push("/sales")}>Back</Button>
        </div>

        <div className="p-4 space-y-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-3">Return / Update</h2>
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
                        <td className="p-2">{line.item__item_name || itemLookup[line.item_id || line.item || 0]?.item_name || line.item_name || line.item_description || "Item"}</td>
                        <td className="p-2 text-right">{sold}</td>
                        <td className="p-2 text-right">{returned}</td>
                        <td className="p-2 text-right">{balance}</td>
                        <td className="p-2 text-right">{toNumber(line.item_rate).toFixed(2)}</td>
                        <td className="p-2">
                          <UniFieldInput
                            type="number"
                            min={0}
                            placeholder="0.00"
                            step={0.01}
                            value={returnQty[line.id] || ""}
                            onChange={(e) => setReturnQty((prev) => ({ ...prev, [line.id]: e.target.value }))}
                            disabled={isFullyReturned || balance <= 0}
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
                disabled={isFullyReturned}
              />
              <div className="flex items-end justify-between gap-3">
                <p className="text-sm text-gray-600">Return Amount Preview: {returnPreviewAmount.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-3">Add Items</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <UniFieldSelect
                label="Item"
                placeholder="Select item"
                value={selectedItemId}
                onValueChange={setSelectedItemId}
              >
                {itemsList.map((item) => (
                  <SelectItem key={item.id} value={item.id.toString()}>
                    {item.item_name} ({item.item_code})
                  </SelectItem>
                ))}
              </UniFieldSelect>
              <UniFieldInput
                label="Qty"
                type="number"
                min={0}
                step={0.01}
                value={newItemQty}
                onChange={(e) => setNewItemQty(e.target.value)}
                disabled={isFullyReturned}
              />
              <UniFieldInput
                label="Rate"
                type="number"
                min={0}
                step={0.01}
                value={newItemRate}
                onChange={(e) => setNewItemRate(e.target.value)}
                placeholder={selectedItem?.selling_price?.toString() || "0.00"}
                disabled={isFullyReturned}
              />
              <div className="flex items-end">
                <Button
                  onClick={handleAddNewItem}
                  disabled={isFullyReturned}
                  className="w-full"
                >
                  Add Item
                </Button>
              </div>
            </div>

            {selectedItem && (
              <p className="mt-2 text-xs text-gray-500">
                Stock: {selectedItem.current_stock ?? 0}
              </p>
            )}

            {newItems.length > 0 && (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-2">Item</th>
                      <th className="text-right p-2">Qty</th>
                      <th className="text-right p-2">Rate</th>
                      <th className="text-right p-2">Total</th>
                      <th className="text-right p-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {newItems.map((line, index) => (
                      <tr key={`${line.item_id}-${index}`} className="border-t border-gray-100">
                        <td className="p-2">{line.item_name} ({line.item_code})</td>
                        <td className="p-2 text-right">{line.item_quantity}</td>
                        <td className="p-2 text-right">{line.item_rate.toFixed(2)}</td>
                        <td className="p-2 text-right">{line.total_amount.toFixed(2)}</td>
                        <td className="p-2 text-right">
                          <Button variant="outline" onClick={() => handleRemoveNewItem(index)}>
                            Remove
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <UniFieldInput
                label="Update Notes"
                type="text"
                value={updateNotes}
                onChange={(e) => setUpdateNotes(e.target.value)}
                placeholder="Optional notes"
                disabled={isFullyReturned}
              />
              <div />
            </div>
          </div>

          <div ref={paginationSentinelRef} className="h-px w-full" />
        </div>

        <footer className={`sticky z-50 transition-all duration-300 ease-in-out ${isFooterStuck ? "mx-6 bottom-5" : "mx-0 bottom-0"}`}>
          <div className={`flex items-center justify-between gap-x-2 p-3 bg-white/90 backdrop-blur-md transition-shadow duration-200 ${isFooterStuck ? "rounded-lg shadow-lg border border-gray-200/80" : "rounded-t-none shadow-none border-t-2 border-gray-100"}`}>
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <span className="text-gray-600">Original: </span>
                <span className="font-bold text-lg text-gray-900">₹{toNumber(saleData.total_amount).toFixed(2)}</span>
              </div>
              
              {newItemsTotal > 0 && (
                <div className="text-sm">
                  <span className="text-gray-600">+ New Items: </span>
                  <span className="font-bold text-lg text-green-600">₹{newItemsTotal.toFixed(2)}</span>
                </div>
              )}

              {returnPreviewAmount > 0 && (
                <div className="text-sm">
                  <span className="text-gray-600">- Return: </span>
                  <span className="font-bold text-lg text-red-600">₹{returnPreviewAmount.toFixed(2)}</span>
                </div>
              )}
              
              <div className="text-sm">
                <span className="text-gray-600">- Paid: </span>
                <span className="font-bold text-lg text-blue-600">₹{toNumber(saleData.paid_amount).toFixed(2)}</span>
              </div>
              
              <div className="text-sm">
                <span className="text-gray-600">= Balance: </span>
                <span className={`font-bold text-lg ${remainingBalance > 0 ? "text-orange-600" : remainingBalance < 0 ? "text-green-600" : "text-gray-900"}`}>
                  ₹{remainingBalance.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/sales')}
                disabled={isSubmitting}
                className="rounded-lg border px-4 py-1.5"
              >
                Back
              </Button>
              <Button
                onClick={handleSaveAll}
                disabled={isFullyReturned || isSubmitting}
                className="min-w-[120px] rounded-lg px-4 py-1.5 bg-black text-white"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Spinner />
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">Save Changes</span>
                )}
              </Button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
