"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus, Minus, Trash2 } from "lucide-react";
import { sales } from "@/lib/api/sales";
import { items } from "@/lib/api/items";
import {
  Button,
  Spinner,
  UniFieldInput,
  UniFieldSelect,
  SelectItem,
  LeftIcon,
  ButtonGroup,
} from "@/components/index";
import { showToast } from "@/lib/toast";
import { PAYMENT_MODE_CHOICES } from "@/lib/utils/constants";

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
  payment_mode?: number;
  party?: {
    id: number;
    name: string;
  } | null;
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
  const [itemsList, setItemsList] = useState<ItemDropdown[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [itemSearch, setItemSearch] = useState("");
  const [newItemQty, setNewItemQty] = useState<string>("1");
  const [newItemRate, setNewItemRate] = useState<string>("");
  const [paymentMode, setPaymentMode] = useState<string>("1");
  const [paidAmount, setPaidAmount] = useState<string>("");
  const [notes, setNotes] = useState("");
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
      setPaymentMode((data?.payment_mode || 1).toString());
      setPaidAmount(toNumber(data?.paid_amount).toFixed(2));
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
        root: contentRef.current
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

  const filteredItems = useMemo(() => {
    const query = itemSearch.trim().toLowerCase();
    if (!query) return itemsList;

    return itemsList.filter((item) =>
      item.item_name.toLowerCase().includes(query) ||
      item.item_code.toLowerCase().includes(query),
    );
  }, [itemSearch, itemsList]);

  const netAmount = useMemo(() => {
    const originalTotal = toNumber(saleData?.total_amount || 0);
    const returnAmount = returnPreviewAmount;
    const exchangeAmount = newItemsTotal;

    return originalTotal + exchangeAmount - returnAmount;
  }, [saleData, returnPreviewAmount, newItemsTotal]);

  const normalizedPaidAmount = useMemo(() => {
    if (paymentMode === "3") {
      return Math.min(toNumber(paidAmount), netAmount);
    }
    return netAmount;
  }, [netAmount, paidAmount, paymentMode]);

  const remainingBalance = useMemo(() => {
    return Math.max(0, netAmount - normalizedPaidAmount);
  }, [netAmount, normalizedPaidAmount]);

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

    // Check if item already exists in newItems
    const existingIndex = newItems.findIndex((item) => item.item_id === selectedItem.id);

    if (existingIndex >= 0) {
      // Update existing item
      setNewItems((prev) => {
        const updated = [...prev];
        const existingItem = updated[existingIndex];
        const newQty = existingItem.item_quantity + qty;
        updated[existingIndex] = {
          ...existingItem,
          item_quantity: newQty,
          total_amount: newQty * existingItem.item_rate,
        };
        return updated;
      });
      // showToast.success("Item quantity updated");
    } else {
      // Add new item
      const line: NewItemLine = {
        item_id: selectedItem.id,
        item_name: selectedItem.item_name,
        item_code: selectedItem.item_code,
        item_rate: rate,
        item_quantity: qty,
        total_amount: qty * rate,
      };
      setNewItems((prev) => [...prev, line]);
    }

    setSelectedItemId("");
    setNewItemQty("1");
    setNewItemRate("");
    setItemSearch("");
  };

  const handleRemoveNewItem = (index: number) => {
    setNewItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItemQty = (index: number, delta: number) => {
    setNewItems((prev) => {
      const updated = [...prev];
      const item = updated[index];
      const newQty = Math.max(0, item.item_quantity + delta);
      if (newQty === 0) {
        // Remove item if quantity becomes 0
        return updated.filter((_, i) => i !== index);
      }
      updated[index] = {
        ...item,
        item_quantity: newQty,
        total_amount: newQty * item.item_rate,
      };
      return updated;
    });
  };

  const handleSaveAll = async () => {
    if (!saleData) return;
    if (isFullyReturned) {
      showToast.error("Sale is already fully returned");
      return;
    }
    if (paymentMode === "3" && toNumber(paidAmount) < 0) {
      showToast.error("Paid amount cannot be negative");
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

    const paymentChanged =
      Number(paymentMode) !== Number(saleData.payment_mode || 1) ||
      (paymentMode === "3" && normalizedPaidAmount !== toNumber(saleData.paid_amount));

    if (returnLines.length === 0 && addLines.length === 0 && !paymentChanged) {
      showToast.error("Please return items, add new items");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        return_notes: notes || undefined,
        update_notes: notes || undefined,
        payment_mode: Number(paymentMode),
        paid_amount: paymentMode === "3" ? normalizedPaidAmount : netAmount,
        return_transactions: returnLines,
        add_transactions: addLines,
      };

      const result = await editSale({ id: saleData.id, payLoad: payload }).unwrap() as { message?: string };
      showToast.success(result?.message || "Sales updated successfully");
      setNotes("");
      setNewItems([]);
      // await fetchSale();
      router.push('/sales');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Spinner className="h-6 w-6" />
          <p className="text-gray-600">Loading item data...</p>
        </div>
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
    <div className="bg-white flex flex-col h-full">
      <div className="px-6 py-2 border-b border-gray-200 bg-white z-20 flex-none">
        <div className="flex items-center gap-4">
          <button className="flex items-center border border-gray-200 rounded-lg p-2 hover:bg-gray-50 text-sm text-gray-600 hover:text-gray-900 hover:cursor-pointer" onClick={() => router.push("/sales")}>
            <LeftIcon className="size-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Sales {saleData.sales_code}</h1>
            <p className="text-sm text-gray-500">
              Total: {toNumber(saleData.total_amount).toFixed(2)} | Paid: {toNumber(saleData.paid_amount).toFixed(2)}
            </p>
            {isFullyReturned && <p className="text-sm text-red-600 mt-1">This sale is fully returned.</p>}
          </div>
        </div>
      </div>

      <div ref={contentRef} className="px-6 overflow-y-auto flex-1 custom-scrollbar">
        <div className="p-4 space-y-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-3">Return / Update</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="">
                    <th className="text-left p-2 w-1/5">Item</th>
                    <th className="text-right p-2 w-1/5">Sold Qty</th>
                    <th className="text-right p-2 w-1/5">Balance</th>
                    <th className="text-right p-2 w-1/5">Rate</th>
                    <th className="text-right p-2 w-1/5">Return Qty</th>
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
                        <td className="p-2 text-right">{balance}</td>
                        <td className="p-2 text-right">{toNumber(line.item_rate).toFixed(2)}</td>
                        <td className="p-2 text-right">
                          <UniFieldInput
                            type="number"
                            min={0}
                            className="w-32"
                            max={balance}
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

            <div className="mt-4 grid grid-cols-1 gap-2">
              <div className="flex">
                <p className="text-sm text-gray-600">Return Amount Preview: {returnPreviewAmount.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3">Add Items</h2>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-5">
                  <UniFieldSelect
                    label="Item"
                    placeholder="Select item"
                    value={selectedItemId}
                    onValueChange={(value) => {
                      setSelectedItemId(value);
                      const nextSelectedItem = itemsList.find((item) => item.id.toString() === value);
                      setNewItemQty("1");
                      setNewItemRate(nextSelectedItem?.selling_price?.toString() || "");
                    }}
                  >
                    {filteredItems.map((item) => (
                      <SelectItem key={item.id} value={item.id.toString()}>
                        {item.item_name} ({item.item_code})
                      </SelectItem>
                    ))}
                  </UniFieldSelect>
                </div>
                <div className="md:col-span-2">
                  <UniFieldInput
                    label="Qty"
                    type="number"
                    min={0}
                    step={0.01}
                    value={newItemQty}
                    onChange={(e) => setNewItemQty(e.target.value)}
                    disabled={isFullyReturned}
                    placeholder="0.00"
                  />
                </div>
                <div className="md:col-span-2">
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
                </div>
                <div className="md:col-span-3 flex items-end">
                  <Button
                    onClick={handleAddNewItem}
                    disabled={isFullyReturned || !selectedItem}
                    className="w-full"
                  >
                    Add Item
                  </Button>
                </div>
              </div>

              {newItems.length > 0 && (
                <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-2">Item</th>
                        <th className="text-center p-2">Qty</th>
                        <th className="text-right p-2">Rate</th>
                        <th className="text-right p-2">Total</th>
                        <th className="text-right p-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {newItems.map((line, index) => (
                        <tr key={`${line.item_id}-${index}`} className="border-t border-gray-100">
                          <td className="p-2">{line.item_name} ({line.item_code})</td>
                          <td className="p-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => handleUpdateItemQty(index, -1)}
                                disabled={isFullyReturned}
                                className="h-7 w-7"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-12 text-center">{line.item_quantity}</span>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => handleUpdateItemQty(index, 1)}
                                disabled={isFullyReturned}
                                className="h-7 w-7"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                          <td className="p-2 text-right">{line.item_rate.toFixed(2)}</td>
                          <td className="p-2 text-right">{line.total_amount.toFixed(2)}</td>
                          <td className="p-2 text-right">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleRemoveNewItem(index)}
                              disabled={isFullyReturned}
                              className="h-8 w-8"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3">Payment Details</h2>
              <div className="space-y-4">
                <ButtonGroup className="w-full">
                  {PAYMENT_MODE_CHOICES.map((option) => {
                    const isSelected = paymentMode === option.value.toString();

                    return (
                      <Button
                        key={option.value}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        onClick={() => setPaymentMode(option.value.toString())}
                        disabled={isFullyReturned}
                        className="flex-1"
                      >
                        {option.label}
                      </Button>
                    );
                  })}
                </ButtonGroup>

                {paymentMode === "3" && (
                  <UniFieldInput
                    label="Paid Amount"
                    type="number"
                    min={0}
                    step={0.01}
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    disabled={isFullyReturned}
                    placeholder="0.00"
                  />
                )}

                <UniFieldInput
                  label="Notes"
                  as="textarea"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes"
                  disabled={isFullyReturned}
                />
              </div>
            </div>
          </div>
        </div>
        <div ref={paginationSentinelRef} className="h-px w-full" />
        <footer className={`sticky z-50 transition-all duration-300 ease-in-out ${isFooterStuck ? "mx-6 bottom-5" : "mx-0 bottom-0"}`}>
          <div className={`flex items-center justify-between gap-x-2 p-3 bg-white/90 backdrop-blur-md transition-shadow duration-200 ${isFooterStuck ? "rounded-lg shadow-lg border border-gray-200/80" : "rounded-t-none shadow-none border-t-2 border-gray-100"}`}>
            <div className="flex items-center gap-2">
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
              
              {normalizedPaidAmount > 0 && (
              <div className="text-sm">
                <span className="text-gray-600">- Paid: </span>
                <span className="font-bold text-lg text-blue-600">₹{normalizedPaidAmount.toFixed(2)}</span>
              </div>
               )}

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
