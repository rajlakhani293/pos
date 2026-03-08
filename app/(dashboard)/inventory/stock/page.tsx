"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { items } from "@/lib/api/items";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { UniFieldInput } from "@/components/ui/unifield-input";
import { UniFieldSelect } from "@/components/ui/unifield-select";
import { SelectItem } from "@/components/ui/select";
import { showToast } from "@/lib/toast";

type StockMode = "IN" | "OUT";
type DropdownItem = { id: number; item_name: string; item_code: string; current_stock?: number };
type ItemOption = { label: string; value: number; current_stock: number };

const stockInTypes = [
  { label: "New Stock", value: "NEW_STOCK" },
  { label: "Return Stock", value: "RETURN_STOCK" },
  { label: "Adjustment In", value: "ADJUSTMENT_IN" },
];

const stockOutTypes = [
  { label: "Damaged Stock", value: "DAMAGED_STOCK" },
  { label: "Used Stock", value: "USED_STOCK" },
  { label: "Adjustment Out", value: "ADJUSTMENT_OUT" },
];

export default function StockPage() {
  const [getItemsDropdown] = items.useGetItemsDropdownMutation();
  const [adjustItemStock] = items.useAdjustItemStockMutation();

  const [mode, setMode] = useState<StockMode>("IN");
  const [itemOptions, setItemOptions] = useState<ItemOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    item_id: "",
    movement_type: "NEW_STOCK",
    quantity: "",
    note: "",
  });

  const movementOptions = mode === "IN" ? stockInTypes : stockOutTypes;

  const selectedItem = useMemo(
    () => itemOptions.find((item) => item.value.toString() === formData.item_id?.toString()),
    [itemOptions, formData.item_id]
  );

  const fetchItems = useCallback(async () => {
    try {
      const result = await getItemsDropdown({}).unwrap() as { data?: DropdownItem[] };
      const list = Array.isArray(result?.data) ? result.data : [];
      setItemOptions(
        list.map((item) => ({
          label: `${item.item_name} (${item.item_code})`,
          value: item.id,
          current_stock: item.current_stock || 0,
        }))
      );
    } catch {
      showToast.error("Failed to load items");
    } finally {
      setIsLoading(false);
    }
  }, [getItemsDropdown]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      movement_type: mode === "IN" ? stockInTypes[0].value : stockOutTypes[0].value,
    }));
  }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.item_id) {
      showToast.error("Please select an item");
      return;
    }

    const qty = Number(formData.quantity);
    if (!qty || qty <= 0) {
      showToast.error("Quantity must be greater than 0");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await adjustItemStock({
        item_id: Number(formData.item_id),
        movement_type: formData.movement_type,
        quantity: qty,
        note: formData.note || undefined,
        reference_type: "MANUAL",
      }).unwrap() as { message?: string };

      showToast.success(result?.message || "Stock updated successfully");
      setFormData((prev) => ({
        ...prev,
        quantity: "",
        note: "",
      }));
      await fetchItems();
    } catch (error: unknown) {
      const errorData = (error as { data?: { message?: string } })?.data;
      showToast.error(errorData?.message || "Failed to update stock");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white h-full overflow-y-auto custom-scrollbar">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">Stock In/Out</h1>
        <p className="text-sm text-gray-500 mt-1">Manage stock separately from item edit screen</p>
      </div>

      <div className="max-w-2xl p-4">
        <form onSubmit={handleSubmit} className="space-y-4 border border-gray-200 rounded-lg p-4">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Operation</p>
            <ButtonGroup className="w-full">
              <Button
                type="button"
                className="flex-1"
                variant={mode === "IN" ? "default" : "outline"}
                onClick={() => setMode("IN")}
              >
                Stock In
              </Button>
              <Button
                type="button"
                className="flex-1"
                variant={mode === "OUT" ? "default" : "outline"}
                onClick={() => setMode("OUT")}
              >
                Stock Out
              </Button>
            </ButtonGroup>
          </div>

          <UniFieldSelect
            label="Item"
            value={formData.item_id}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, item_id: value }))}
            placeholder={isLoading ? "Loading items..." : "Select item"}
          >
            {itemOptions.map((item) => (
              <SelectItem key={item.value} value={item.value.toString()}>
                {item.label}
              </SelectItem>
            ))}
          </UniFieldSelect>

          {selectedItem && (
            <div className="rounded-md border border-gray-200 p-3 text-sm">
              <span className="text-gray-500">Current Stock: </span>
              <span className="font-semibold text-gray-900">{selectedItem.current_stock}</span>
            </div>
          )}

          <UniFieldSelect
            label="Type"
            value={formData.movement_type}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, movement_type: value }))}
            placeholder="Select type"
          >
            {movementOptions.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </UniFieldSelect>

          <UniFieldInput
            label="Quantity"
            type="number"
            placeholder="0.00"
            min={0}
            step={0.01}
            value={formData.quantity}
            onChange={(e) => setFormData((prev) => ({ ...prev, quantity: e.target.value }))}
          />

          <UniFieldInput
            label="Note"
            type="text"
            placeholder="Optional reason"
            value={formData.note}
            onChange={(e) => setFormData((prev) => ({ ...prev, note: e.target.value }))}
          />

          <div className="pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Update Stock"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
