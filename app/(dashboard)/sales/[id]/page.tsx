"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus, Minus, Search, ShoppingCart, Trash2 } from "lucide-react";
import { sales } from "@/lib/api/sales";
import { items } from "@/lib/api/items";
import {
  Button,
  Spinner,
  UniFieldInput,
} from "@/components/index";
import { LeftIcon } from "@/components/AppIcon";
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
  const [returnNotes, setReturnNotes] = useState("");
  const [itemsList, setItemsList] = useState<ItemDropdown[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [itemSearch, setItemSearch] = useState("");
  const [newItemQty, setNewItemQty] = useState<string>("1");
  const [newItemRate, setNewItemRate] = useState<string>("");
  const [paymentMode, setPaymentMode] = useState<string>("1");
  const [paidAmount, setPaidAmount] = useState<string>("0");
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

  const canUsePartialPayment = Boolean(saleData?.party?.id);

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

  const handleSelectItem = (itemId: number) => {
    const nextSelectedItem = itemsList.find((item) => item.id === itemId);
    setSelectedItemId(itemId.toString());
    setNewItemQty("1");
    setNewItemRate(nextSelectedItem?.selling_price?.toString() || "");
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
    if (paymentMode === "3" && !canUsePartialPayment) {
      showToast.error("Select a party on the sale before using partial payment");
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
    const notesChanged = Boolean(returnNotes.trim() || updateNotes.trim());

    if (returnLines.length === 0 && addLines.length === 0 && !paymentChanged && !notesChanged) {
      showToast.error("Add a return, add items, update payment, or enter notes");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        return_notes: returnNotes || undefined,
        update_notes: updateNotes || undefined,
        payment_mode: Number(paymentMode),
        paid_amount: paymentMode === "3" ? normalizedPaidAmount : netAmount,
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
                  <tr>
                    <th className="text-left p-2">Item</th>
                    <th className="text-right p-2">Sold Qty</th>
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
                        <td className="p-2 text-right">{balance}</td>
                        <td className="p-2 text-right">{toNumber(line.item_rate).toFixed(2)}</td>
                        <td className="p-2">
                          <UniFieldInput
                            type="number"
                            min={0}
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
              <UniFieldInput
                label="Return Notes"
                as="textarea"
                rows={3}
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                placeholder="Optional notes"
                disabled={isFullyReturned}
                className="w-78"
              />
              <div className="flex">
                <p className="text-sm text-gray-600">Return Amount Preview: {returnPreviewAmount.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-3">Add Items</h2>
            <div className="grid gap-4 lg:grid-cols-[1.45fr_0.95fr]">
              <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Browse Items</p>
                    <p className="text-xs text-gray-500">Pick an item, then adjust quantity and rate on the right.</p>
                  </div>
                  <div className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-600 border border-gray-200">
                    {filteredItems.length} items
                  </div>
                </div>

                <div className="relative mt-3">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={itemSearch}
                    onChange={(e) => setItemSearch(e.target.value)}
                    placeholder="Search by item name or code"
                    className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-gray-400"
                    disabled={isFullyReturned}
                  />
                </div>

                <div className="mt-3 grid max-h-[360px] gap-3 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredItems.map((item) => {
                    const isSelected = selectedItemId === item.id.toString();
                    const isQueued = newItems.some((line) => line.item_id === item.id);

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectItem(item.id)}
                        disabled={isFullyReturned}
                        className={`rounded-xl border p-3 text-left transition-all ${
                          isSelected
                            ? "border-black bg-white shadow-sm"
                            : "border-gray-200 bg-white hover:border-gray-400 hover:shadow-sm"
                        } ${isFullyReturned ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-gray-900">{item.item_name}</p>
                            <p className="mt-1 text-xs text-gray-500">{item.item_code}</p>
                          </div>
                          {isQueued && (
                            <span className="rounded-full bg-green-100 px-2 py-1 text-[10px] font-semibold text-green-700">
                              Added
                            </span>
                          )}
                        </div>
                        <div className="mt-4 flex items-center justify-between text-sm">
                          <span className="font-semibold text-gray-900">₹{toNumber(item.selling_price).toFixed(2)}</span>
                          <span className="text-xs text-gray-500">Stock {toNumber(item.current_stock).toFixed(2)}</span>
                        </div>
                      </button>
                    );
                  })}

                  {filteredItems.length === 0 && (
                    <div className="col-span-full rounded-xl border border-dashed border-gray-300 bg-white px-4 py-8 text-center text-sm text-gray-500">
                      No matching items found.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="flex size-10 items-center justify-center rounded-full bg-gray-100 text-gray-700">
                    <ShoppingCart className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Selected Item</p>
                    <p className="text-xs text-gray-500">Control quantity and selling rate before adding.</p>
                  </div>
                </div>

                {selectedItem ? (
                  <div className="mt-4 space-y-4">
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-gray-900">{selectedItem.item_name}</p>
                          <p className="mt-1 text-xs text-gray-500">{selectedItem.item_code}</p>
                        </div>
                        <div className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-600 border border-gray-200">
                          Stock {toNumber(selectedItem.current_stock).toFixed(2)}
                        </div>
                      </div>
                      <p className="mt-4 text-sm text-gray-600">
                        Default price: <span className="font-semibold text-gray-900">₹{toNumber(selectedItem.selling_price).toFixed(2)}</span>
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                      <UniFieldInput
                        label="Rate"
                        type="number"
                        min={0}
                        step={0.01}
                        value={newItemRate}
                        onChange={(e) => setNewItemRate(e.target.value)}
                        placeholder={selectedItem.selling_price?.toString() || "0.00"}
                        disabled={isFullyReturned}
                      />
                    </div>

                    <div className="rounded-xl bg-gray-900 px-4 py-3 text-white">
                      <p className="text-xs uppercase tracking-[0.18em] text-gray-300">Line Preview</p>
                      <p className="mt-2 text-2xl font-semibold">
                        ₹{(toNumber(newItemQty || 0) * toNumber(newItemRate || selectedItem.selling_price || 0)).toFixed(2)}
                      </p>
                    </div>

                    <Button
                      onClick={handleAddNewItem}
                      disabled={isFullyReturned}
                      className="w-full rounded-lg"
                    >
                      Add Item
                    </Button>
                  </div>
                ) : (
                  <div className="mt-4 rounded-xl border border-dashed border-gray-300 px-4 py-10 text-center text-sm text-gray-500">
                    Choose an item from the catalog to start adding it here.
                  </div>
                )}
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

            <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
              <UniFieldInput
                label="Update Notes"
                as="textarea"
                rows={3}
                value={updateNotes}
                onChange={(e) => setUpdateNotes(e.target.value)}
                placeholder="Optional notes"
                disabled={isFullyReturned}
                className="w-78"
              />
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Items Added</span>
                  <span className="font-semibold text-gray-900">{newItems.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Added Value</span>
                  <span className="font-semibold text-green-600">₹{newItemsTotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Return Preview</span>
                  <span className="font-semibold text-red-600">₹{returnPreviewAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
              <div className="space-y-4">
                <div>
                  <p className="text-lg font-semibold text-gray-900">Payment Details</p>
                  <p className="text-sm text-gray-500">Update how this edited sale should be settled after returns and added items.</p>
                </div>

                <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                  {PAYMENT_MODE_CHOICES.map((option) => {
                    const isSelected = paymentMode === option.value.toString();
                    const isDisabled = isFullyReturned || (option.value === 3 && !canUsePartialPayment);

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setPaymentMode(option.value.toString())}
                        disabled={isDisabled}
                        className={`rounded-xl border px-4 py-3 text-left transition-all ${
                          isSelected
                            ? "border-black bg-black text-white shadow-sm"
                            : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                        } ${isDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                      >
                        <p className="font-semibold">{option.label}</p>
                        <p className={`mt-1 text-xs ${isSelected ? "text-gray-200" : "text-gray-500"}`}>
                          {option.value === 3 ? "Keep a remaining balance" : "Mark sale as settled"}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {paymentMode === "3" && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <UniFieldInput
                      label="Paid Amount"
                      type="number"
                      min={0}
                      step={0.01}
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)}
                      disabled={isFullyReturned || !canUsePartialPayment}
                      placeholder="0.00"
                    />
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                      {canUsePartialPayment
                        ? `Party: ${saleData.party?.name}`
                        : "Partial payment needs a party linked to this sale."}
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Payment Mode</span>
                  <span className="font-semibold text-gray-900">
                    {PAYMENT_MODE_CHOICES.find((option) => option.value.toString() === paymentMode)?.label || "Cash"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Net Total</span>
                  <span className="font-semibold text-gray-900">₹{netAmount.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Paid</span>
                  <span className="font-semibold text-blue-600">₹{normalizedPaidAmount.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-gray-200 pt-3">
                  <span className="font-medium text-gray-700">Balance</span>
                  <span className={`text-lg font-semibold ${remainingBalance > 0 ? "text-orange-600" : "text-green-600"}`}>
                    ₹{remainingBalance.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div ref={paginationSentinelRef} className="h-px w-full" />
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
