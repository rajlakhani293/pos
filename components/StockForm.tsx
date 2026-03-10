"use client";

import { items } from "@/lib/api/items";
import DynamicForm from "@/components/DynamicForm";
import { FormField, getInitialFormValues } from "@/lib/utils";
import { showToast } from "@/lib/toast";
import { useState, useEffect, useCallback, useMemo } from "react";

type ItemOption = { label: string; value: number; current_stock: number };
type DropdownItem = { id: number; item_name: string; item_code: string; current_stock?: number };

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

type Props = {
  isOpen: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
  type: "IN" | "OUT";
  title?: string;
};

export default function StockForm({ isOpen, onClose, onSuccess, type, title }: Props) {
  const [adjustItemStock] = items.useAdjustItemStockMutation();
  const [getItemsDropdown] = items.useGetItemsDropdownMutation();
  const [itemOptions, setItemOptions] = useState<ItemOption[]>([]);

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
    }
  }, [getItemsDropdown]);

  useEffect(() => {
    if (isOpen) {
      fetchItems();
    }
  }, [isOpen, fetchItems]);

  const Schema = useMemo((): FormField[] => [
    {
      name: "item_id",
      label: "Item",
      type: "select",
      placeholder: "Select item",
      options: itemOptions.map(item => ({ label: item.label, value: item.value.toString() })),
      required: true,
    },
    {
      name: "movement_type",
      label: "Type",
      type: "select",
      placeholder: "Select type",
      options: type === "IN" ? stockInTypes : stockOutTypes,
      required: true,
    },
    {
      name: "quantity",
      label: "Quantity",
      type: "number",
      placeholder: "0.00",
      required: true,
    },
    {
      name: "note",
      label: "Note",
      type: "text",
      placeholder: "Optional reason",
    },
  ], [itemOptions, type]);

  const [initialValues, setInitialValues] = useState<any>(() => getInitialFormValues(Schema, null, 'create'));

  useEffect(() => {
    if (isOpen) {
      setInitialValues(getInitialFormValues(Schema, null, 'create'));
    }
  }, [isOpen, Schema]);

  useEffect(() => {
    if (!isOpen) {
      setInitialValues(getInitialFormValues(Schema));
    }
  }, [isOpen, Schema]);

  const handleSubmit = async (values: any, { resetForm }: any) => {
    const qty = Number(values.quantity);

    if (!values.item_id) {
      showToast.error("Please select an item");
      return;
    }
    if (!qty || qty <= 0) {
      showToast.error("Quantity must be greater than 0");
      return;
    }

    try {
      const result = await adjustItemStock({
        item_id: Number(values.item_id),
        movement_type: values.movement_type,
        quantity: type === "IN" ? qty : -qty, // Negative for OUT
        note: values.note || undefined,
        reference_type: "MANUAL",
      }).unwrap() as { message?: string };

      showToast.success(result?.message || `Stock ${type.toLowerCase()} saved`);
      resetForm();
      onClose?.();
      onSuccess?.();
    } catch (error: unknown) {
      const errorData = (error as { data?: { message?: string } })?.data;
      showToast.error(errorData?.message || `Failed to update stock`);
    }
  };

  return (
    <DynamicForm
      title={title || `Add Stock ${type}`}
      fields={Schema}
      initialValues={initialValues}
      onSubmit={handleSubmit}
      onClose={onClose}
      isOpen={isOpen}
    >
      {({ formData }) => {
        const selectedItem = itemOptions.find((item) => item.value.toString() === formData.item_id?.toString());
        if (!selectedItem) return null;

        return (
          <div className="rounded-md border border-gray-200 p-3 text-sm mt-2 mb-4">
            <span className="text-gray-500">Current Stock: </span>
            <span className="font-semibold text-gray-900">{selectedItem.current_stock}</span>
          </div>
        );
      }}
    </DynamicForm>
  );
}
