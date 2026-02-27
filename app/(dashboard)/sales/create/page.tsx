"use client"

import { useEffect, useMemo, useState } from "@/lib/imports";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { useRouter } from "next/navigation";
import { sales } from "@/lib/api/sales";
import { settings } from "@/lib/api/settings";
import { items } from "@/lib/api/items";
import { getInitialFormValues, type FormField } from "@/lib/utils";
import { UniFieldInput } from "@/components/ui/unifield-input";
import { UniFieldSelect } from "@/components/ui/unifield-select";
import {
  SelectItem,
} from "@/components/ui/select";
import { ArrowRightIcon, CirclePlusIcon, Minus, PlusIcon, SearchIcon, TrashIcon } from "@/components/AppIcon";
import { ButtonGroup } from "@/components/ui/button-group";
import { PartyForm } from "@/app/(dashboard)/settings/parties/createUpdate";
import { showToast } from "@/lib/toast";
import { useDebounce } from "@/hooks/useDebounce";

export default function CreateSalePage() {
  const router = useRouter();
  
  const [createSale] = sales.useCreateSaleMutation();
  const [getParties] = settings.useGetPartiesDropdownMutation();
  const [getItemsData] = items.useGetItemsDataMutation();
  const [getItemCategories] = items.useGetItemCategoriesDropdownMutation();
  const [getTaxes] = settings.useGetTaxesDropdownMutation();

  const [parties, setParties] = useState<any[]>([]);
  const [itemsList, setItemsList] = useState<any[]>([]);
  const [taxes, setTaxes] = useState<any[]>([]);
  const [itemCategories, setItemCategories] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // State for managing add forms
  const [addFormOpen, setAddFormOpen] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<any>(null);
  const [itemSearch, setItemSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");

  const debouncedItemSearch = useDebounce(itemSearch, 400);

  // Main sales form schema
  const SalesSchema: FormField[] = [
    { 
      name: "party_id", 
      label: "Party", 
      type: "select",
      placeholder: "Select Party",
      options: parties
    },
    {
      name: "sales_date",
      label: "Sales Date",
      type: "date",
      placeholder: "Select Date",
      required: true
    },
    {
      name: "subtotal",
      label: "Subtotal",
      type: "number",
      placeholder: "0.00",
      required: true,
      min: 0,
      step: 0.01,
      disabled: true
    },
    {
      name: "tax_amount",
      label: "Tax Amount",
      type: "number",
      placeholder: "0.00",
      min: 0,
      step: 0.01,
      disabled: true
    },
    {
      name: "discount_percentage",
      label: "Discount Percentage",
      type: "number",
      placeholder: "0.00",
      min: 0,
      max: 100,
      step: 0.01
    },
    {
      name: "discount_amount",
      label: "Discount Amount",
      type: "number",
      placeholder: "0.00",
      min: 0,
      step: 0.01,
      disabled: true
    },
    {
      name: "total_amount",
      label: "Total Amount",
      type: "number",
      placeholder: "0.00",
      required: true,
      min: 0,
      step: 0.01,
      disabled: true
    },
    {
      name: "paid_amount",
      label: "Paid Amount",
      type: "number",
      placeholder: "0.00",
      required: true,
      min: 0,
      step: 0.01
    },
    {
      name: "payment_mode",
      label: "Payment Mode",
      type: "select",
      placeholder: "Select Payment Mode",
      required: true,
      options: [
        { label: "Cash", value: 1 },
        { label: "UPI", value: 2 },
        { label: "Partial", value: 3 },
        { label: "Bank Transfer", value: 4 }
      ]
    },
    { 
      name: "notes", 
      label: "Notes", 
      type: "textarea",
      placeholder: "Enter any additional notes...",
      rows: 3
    }
  ];

  const [formData, setFormData] = useState<any>(() => ({
    ...getInitialFormValues(SalesSchema),
    sales_date: new Date().toISOString().split('T')[0],
    subtotal: "0.00",
    tax_amount: "0.00",
    discount_percentage: "0.00",
    discount_amount: "0.00",
    total_amount: "0.00",
    paid_amount: "0.00",
    payment_mode: "1",
    transactions: []
  }));

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = (name: string, value: any) => {
    const field = SalesSchema.find(f => f.name === name);
    if (!field) return '';

    if (field.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      return `${field.label} is required`;
    }

    if (field.type === 'number' && value && isNaN(Number(value))) {
      return `${field.label} must be a valid number`;
    }

    return '';
  };

  const handleChange = (name: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [name]: value }));
    
    const error = validateField(name, value);
    setErrors((prev: any) => ({ ...prev, [name]: error }));

    // Auto-calculate when discount percentage changes
    if (name === 'discount_percentage') {
      calculateTotals();
    }
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let totalTaxAmount = 0;

    const updatedTransactions = formData.transactions?.map((transaction: any) => {
      const quantity = parseFloat(transaction.item_quantity) || 0;
      const rate = parseFloat(transaction.item_rate) || 0;
      const rowSubtotal = quantity * rate;
      
      const discountPercentage = parseFloat(transaction.discount_percentage) || 0;
      const rowDiscountAmount = rowSubtotal * (discountPercentage / 100);
      
      const taxId = transaction.tax_id;
      const tax = taxes.find(t => t.value?.toString() === taxId?.toString());
      const taxRate = tax ? (typeof tax.rate === 'number' ? tax.rate : parseFloat(tax.rate)) : 0;
      const rowTaxAmount = (rowSubtotal - rowDiscountAmount) * (taxRate / 100);
      
      const rowTotal = rowSubtotal - rowDiscountAmount + rowTaxAmount;
      
      subtotal += rowSubtotal;
      totalTaxAmount += rowTaxAmount;
      
      return {
        ...transaction,
        discount_amount: rowDiscountAmount.toFixed(2),
        tax_amount: rowTaxAmount.toFixed(2),
        total_amount: rowTotal.toFixed(2)
      };
    }) || [];

    const discountPercentage = parseFloat(formData.discount_percentage) || 0;
    const overallDiscountAmount = subtotal * (discountPercentage / 100);
    const finalTotalAmount = subtotal - overallDiscountAmount + totalTaxAmount;

    setFormData((prev: any) => {
      // Check if transactions have actually changed to avoid infinite loop
      const txChanged = JSON.stringify(prev.transactions) !== JSON.stringify(updatedTransactions);
      if (!txChanged && 
          prev.subtotal === subtotal.toFixed(2) && 
          prev.tax_amount === totalTaxAmount.toFixed(2) &&
          prev.total_amount === finalTotalAmount.toFixed(2)) {
        return prev;
      }
      
      return {
        ...prev,
        transactions: updatedTransactions,
        subtotal: subtotal.toFixed(2),
        discount_amount: overallDiscountAmount.toFixed(2),
        tax_amount: totalTaxAmount.toFixed(2),
        total_amount: finalTotalAmount.toFixed(2)
      };
    });
  };

  const handleTransactionChange = (index: number, name: string, value: any) => {
    setFormData((prev: any) => {
      const newTransactions = [...prev.transactions];
      newTransactions[index] = { ...newTransactions[index], [name]: value };
      return { ...prev, transactions: newTransactions };
    });
  };

  const removeTransaction = (index: number) => {
    const newTransactions = formData.transactions.filter((_: any, i: number) => i !== index);
    setFormData((prev: any) => ({ ...prev, transactions: newTransactions }));
    calculateTotals();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate all fields
    const newErrors: Record<string, string> = {};
    SalesSchema.forEach(field => {
      const error = validateField(field.name, formData[field.name]);
      if (error) newErrors[field.name] = error;
    });

    // Validate transactions
    if (formData.transactions.length === 0) {
      newErrors.transactions = "At least one item is required";
    } else {
      formData.transactions.forEach((transaction: any, index: number) => {
        if (!transaction.item_id) {
          newErrors[`transaction_${index}_item`] = "Item is required";
        }
        if (!transaction.item_quantity || parseFloat(transaction.item_quantity) <= 0) {
          newErrors[`transaction_${index}_quantity`] = "Quantity must be greater than 0";
        }
        if (!transaction.item_rate || parseFloat(transaction.item_rate) <= 0) {
          newErrors[`transaction_${index}_rate`] = "Rate must be greater than 0";
        }
      });
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      try {
        // Prepare the payload
        const payload = {
          ...formData,
          subtotal: parseFloat(formData.subtotal),
          tax_amount: parseFloat(formData.tax_amount),
          discount_percentage: parseFloat(formData.discount_percentage),
          discount_amount: parseFloat(formData.discount_amount),
          total_amount: parseFloat(formData.total_amount),
          paid_amount: parseFloat(formData.paid_amount),
          payment_mode: parseInt(formData.payment_mode),
          transactions: formData.transactions.map((t: any) => ({
            ...t,
            item_quantity: parseFloat(t.item_quantity),
            item_rate: parseFloat(t.item_rate),
            discount_percentage: parseFloat(t.discount_percentage || "0.00"),
            discount_amount: parseFloat(t.discount_amount || "0.00"),
            tax_amount: parseFloat(t.tax_amount || "0.00"),
            total_amount: parseFloat(t.total_amount || (t.item_quantity * t.item_rate))
          }))
        };

        const result: any = await createSale(payload).unwrap();
        showToast.success(result?.message || "Sale created successfully");
        
        setIsSubmitting(false);
        router.push('/sales');
        return;
      } catch (error: any) {
        setIsSubmitting(false);
        showToast.error(error?.data?.message || "Failed to create sale");
      }
    } else {
      setIsSubmitting(false);
    }
  };

  const setItemsFromApiResponse = (itemsResult: any, categoryId?: string) => {
    const uniqueItems = new Map();
    const itemsArray = itemsResult?.data?.items || itemsResult?.data || [];
    (itemsArray as any[])?.forEach((item: any) => {
      if (!uniqueItems.has(item.id)) {
        const derivedCategoryId =
          categoryId && categoryId !== "all" ? Number(categoryId) : (item.category_id ?? item.item_category_id ?? item.category?.id);
        uniqueItems.set(item.id, {
          label: item.item_name,
          value: item.id,
          rate: item.selling_price,
          unit: item.unit || "Unit",
          tax: item.tax,
          current_stock: item.current_stock || 0,
          item_code: item.item_code,
          item_images: item.item_images || [],
          category_id: derivedCategoryId,
        });
      }
    });
    setItemsList(Array.from(uniqueItems.values()));
  };

  const fetchItems = async ({ categoryId, search }: { categoryId: string; search: string }) => {
    const trimmedSearch = search.trim();
    const payload: any = {};

    if (trimmedSearch) payload.search = trimmedSearch;
    if (categoryId !== "all") payload.filter = { category: Number(categoryId) };

    const itemsResult: any = await getItemsData(payload).unwrap();
    setItemsFromApiResponse(itemsResult, categoryId);
  };

  const fetchPartiesAndItems = async () => {
    if (parties.length > 0 && itemsList.length > 0) return;
    
    try {
      const [partiesResult, taxesResult, categoriesResult] = await Promise.all([
        getParties({}).unwrap(),
        getTaxes({}).unwrap(),
        getItemCategories({}).unwrap(),
      ]);
      
      setParties((partiesResult as any)?.data?.map((item: any) => ({
        label: item.name,
        value: item.id
      })) || []);

      setTaxes((taxesResult as any)?.data?.map((item: any) => ({
        label: `${item.tax_name} (${item.tax_value}%)`,
        value: item.id,
        rate: item.tax_value
      })) || []);

      setItemCategories((categoriesResult as any)?.data?.map((item: any) => ({
        id: item.id,
        name: item.category_name,
        item_count: item.item_count,
      })) || []);

    } catch (error) {
      console.error("Failed to fetch parties, items, taxes, and units:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handlers for add forms
  const handleOpenAddForm = (formType: string) => {
    setAddFormOpen(formType);
    setSelectedId(null);
  };

  const handleCloseAddForm = () => {
    setAddFormOpen(null);
    setSelectedId(null);
  };

  const handleAddFormSuccess = () => {
    handleCloseAddForm();
    fetchPartiesAndItems();
  };

  // Custom select component with Add button inside dropdown
  const SelectWithAddButton = ({ field, formType }: { field: FormField; formType: string }) => {
    return (
      <UniFieldSelect
        label={field.label}
        value={formData[field.name] || ''}
        onValueChange={(value) => {
          if (value === 'add_new') {
            handleOpenAddForm(formType);
          } else {
            handleChange(field.name, value);
          }
        }}
        placeholder={field.placeholder || `Select ${field.label}`}
        required={field.required}
        error={errors[field.name]}
      >
        {field.options?.filter(option => option != null && option.value != null).map((option) => (
          <SelectItem key={option.value} value={option.value.toString()}>
            {option.label}
          </SelectItem>
        ))}
        <SelectItem value="add_new" className="border-t font-medium flex items-center justify-center">
          <div className="flex items-center justify-center gap-2">
            <CirclePlusIcon className="w-4 h-4" />
            Add New {field.label}
            <ArrowRightIcon className="size-3" />
          </div>
        </SelectItem>
      </UniFieldSelect>
    );
  };

  const filteredItems = useMemo(() => {
    return itemsList;
  }, [itemsList]);

  const addItemToCart = (itemId: string) => {
    const selectedItem = itemsList.find((item) => item.value.toString() === itemId);
    if (!selectedItem) return;

    setFormData((prev: any) => {
      const existingIndex = prev.transactions.findIndex((t: any) => t.item_id?.toString() === itemId);
      if (existingIndex >= 0) {
        const newTransactions = [...prev.transactions];
        const currentQty = parseFloat(newTransactions[existingIndex].item_quantity || "0");
        newTransactions[existingIndex] = {
          ...newTransactions[existingIndex],
          item_quantity: (currentQty + 1).toString(),
        };
        return { ...prev, transactions: newTransactions };
      }

      return {
        ...prev,
        transactions: [
          ...prev.transactions,
          {
            item_id: itemId,
            item_quantity: "1",
            item_rate: selectedItem.rate?.toString() || "0.00",
            item_description: "",
            discount_percentage: "0.00",
            discount_amount: "0.00",
            tax_id: selectedItem.tax?.toString() || "",
            tax_amount: "0.00",
            total_amount: "0.00",
            unit: selectedItem.unit || "Unit"
          }
        ],
      };
    });
  };

  const updateQuantity = (index: number, delta: number) => {
    const currentQty = parseFloat(formData.transactions[index]?.item_quantity || "0");
    const nextQty = currentQty + delta;
    if (nextQty <= 0) {
      removeTransaction(index);
      return;
    }
    handleTransactionChange(index, "item_quantity", nextQty.toFixed(2).replace(/\.00$/, ""));
  };

  const getItemById = (itemId: any) => itemsList.find((item) => item.value.toString() === itemId?.toString());

  useEffect(() => {
    fetchPartiesAndItems();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    fetchItems({ categoryId: selectedCategoryId, search: debouncedItemSearch }).catch(() => {});
  }, [debouncedItemSearch, selectedCategoryId, isLoading]);

  useEffect(() => {
    calculateTotals();
  }, [formData.transactions, formData.discount_percentage, taxes]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Spinner />
          <p className="mt-2 text-gray-600">Loading sales data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white flex flex-col">
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            <div className="flex">
              <div className="space-y-4 flex-3 min-w-0 p-4 border-r border-gray-200">
                <div className="bg-white">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">POS Catalog</h3>
                  <div className="relative mb-4">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={itemSearch}
                      onChange={(e) => setItemSearch(e.target.value)}
                      placeholder="Search item by name or code"
                      className="h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    />
                  </div>
                  {itemCategories.length > 0 && (
                    <div className="mb-4 flex items-center gap-2 overflow-x-auto whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setSelectedCategoryId("all")}
                        className={`shrink-0 rounded-full border px-3 py-1 text-sm font-medium transition-colors hover:cursor-pointer ${selectedCategoryId === "all" ? "bg-black text-white border-black" : "bg-white text-gray-700 border-gray-200 hover:border-gray-900"}`}
                      >
                        All
                      </button>
                      {itemCategories.map((cat: any) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setSelectedCategoryId(cat.id?.toString?.() || "all")}
                          className={`shrink-0 rounded-full border px-3 py-1 text-sm font-medium transition-colors flex items-center gap-2 hover:cursor-pointer ${selectedCategoryId === cat.id?.toString?.() ? "bg-black text-white border-black" : "bg-white text-gray-700 border-gray-200 hover:border-gray-900"}`}
                        >
                          <span className="max-w-[160px] truncate">{cat.name}</span>
                          <Badge variant="secondary" className={`${selectedCategoryId === cat.id?.toString?.() ? "bg-white/15 text-white border-0" : ""} border-0`}
                          >
                            {cat.item_count}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[65vh] overflow-y-auto pr-1">
                    {filteredItems.map((item) => {
                      const inCart = formData.transactions.some((t: any) => t.item_id?.toString() === item.value.toString());
                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => addItemToCart(item.value.toString())}
                          className="rounded-lg border border-gray-200 transition-colors flex flex-col h-full overflow-hidden hover:cursor-pointer relative"
                        >
                          {inCart && (
                            <Badge className="absolute top-4 right-3 z-10 border border-green-200 shadow-sm text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold whitespace-nowrap">
                              In Cart
                            </Badge>
                          )}
                         <div className="p-2">
                           <div className="w-full h-30 rounded-lg flex items-center justify-center overflow-hidden bg-gray-100">
                            {item.item_images && item.item_images.length > 0 ? (
                              <img 
                                src={item.item_images.find((img: any) => img.is_primary)?.url || item.item_images[0].url} 
                                alt={item.label}
                                className="h-full w-auto max-w-full object-contain"
                              />
                            ) : (
                              <div className="text-gray-400 flex flex-col items-center">
                                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 flex flex-col items-start pt-1">
                            <p className="font-bold text-gray-900 text-base">{item.label}</p>
                            <p className="text-base font-bold font-mono">₹{item.rate || "0.00"}</p>
                          </div>
                         </div>
                        </button>
                      );
                    })}
                    {filteredItems.length === 0 && (
                      <p className="text-sm text-gray-500 col-span-full py-6 text-center">No matching items found.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4 flex-2 min-w-0 p-4">
                <div className="bg-white">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer & Date</h3>
                  <div className="space-y-4">
                    {SalesSchema.filter(field => ["party_id", "sales_date"].includes(field.name)).map((field) => (
                      <div key={field.name}>
                        {field.name === "party_id" ? (
                          <SelectWithAddButton field={field} formType="party" />
                        ) : (
                          <UniFieldInput
                            label={field.label}
                            type={field.type}
                            placeholder={field.placeholder}
                            value={formData[field.name] || ""}
                            onChange={(e) => handleChange(field.name, e.target.value)}
                            required={field.required}
                            min={field.min}
                            step={field.step}
                            error={errors[field.name]}
                            disabled={field.disabled}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Cart</h3>
                    <p className="text-sm text-gray-500">{formData.transactions.length} items</p>
                  </div>
                  <div className="space-y-3 max-h-[42vh] overflow-y-auto pr-1">
                    {formData.transactions.length === 0 && (
                      <div className="rounded-md border border-dashed border-gray-300 p-4 text-center text-sm text-gray-500">
                        Add items from the catalog to start billing.
                      </div>
                    )}
                    {formData.transactions.map((transaction: any, index: number) => {
                      const selectedItem = getItemById(transaction.item_id);
                      return (
                        <div key={index} className="rounded-md border border-gray-200 p-3 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{selectedItem?.label || "Unknown item"}</p>
                              <p className="text-xs text-gray-500">{selectedItem?.item_code || "No code"}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeTransaction(index)}
                              className="text-red-500 hover:text-red-600"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center gap-2">
                              <Button type="button" size="icon" variant="outline" onClick={() => updateQuantity(index, -1)}>
                                <Minus className="w-4 h-4" />
                              </Button>
                              <UniFieldInput
                                value={transaction.item_quantity || "1"}
                                onChange={(e) => handleTransactionChange(index, "item_quantity", e.target.value)}
                                type="number"
                                min="0.01"
                                step="0.01"
                                className="text-center"
                              />
                              <Button type="button" size="icon" variant="outline" onClick={() => updateQuantity(index, 1)}>
                                <PlusIcon className="w-4 h-4" />
                              </Button>
                            </div>
                            <UniFieldInput
                              type="number"
                              value={transaction.item_rate || ""}
                              onChange={(e) => handleTransactionChange(index, "item_rate", e.target.value)}
                              placeholder="Rate"
                              min="0"
                              step="0.01"
                            />
                            <UniFieldInput
                              type="number"
                              value={transaction.discount_percentage || ""}
                              onChange={(e) => handleTransactionChange(index, "discount_percentage", e.target.value)}
                              placeholder="Discount %"
                              min="0"
                              max="100"
                              step="0.01"
                            />
                            <UniFieldSelect
                              value={transaction.tax_id || ""}
                              onValueChange={(value) => handleTransactionChange(index, "tax_id", value)}
                              placeholder="Tax"
                            >
                              {taxes.map((tax) => (
                                <SelectItem key={tax.value} value={tax.value.toString()}>
                                  {tax.label}
                                </SelectItem>
                              ))}
                            </UniFieldSelect>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-gray-900">₹{parseFloat(transaction.total_amount || "0").toFixed(2)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Payment</h3>
                  <UniFieldInput
                    label="Paid Amount"
                    type="number"
                    placeholder="0.00"
                    value={formData.paid_amount || ""}
                    onChange={(e) => handleChange("paid_amount", e.target.value)}
                    required
                    min={0}
                    step={0.01}
                    error={errors.paid_amount}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Payment Mode</p>
                    <ButtonGroup className="w-full">
                      {SalesSchema.find((field) => field.name === "payment_mode")?.options?.map((option) => (
                        <Button
                          key={option.value}
                          type="button"
                          variant={formData.payment_mode?.toString() === option.value.toString() ? "default" : "outline"}
                          className="flex-1"
                          onClick={() => handleChange("payment_mode", option.value.toString())}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </ButtonGroup>
                  </div>
                  <UniFieldInput
                    label="Notes"
                    type="textarea"
                    placeholder="Enter any additional notes..."
                    value={formData.notes || ""}
                    onChange={(e) => handleChange("notes", e.target.value)}
                    as="textarea"
                    rows={3}
                  />
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <p className="text-gray-600">Subtotal</p>
                    <p className="font-semibold text-gray-900">₹{formData.subtotal}</p>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <p className="text-gray-600">Discount</p>
                    <p className="font-semibold text-red-600">-₹{formData.discount_amount}</p>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <p className="text-gray-600">Tax</p>
                    <p className="font-semibold text-gray-900">₹{formData.tax_amount}</p>
                  </div>
                  <div className="flex items-center justify-between border-t pt-2">
                    <p className="font-semibold text-gray-900">Grand Total</p>
                    <p className="text-xl font-bold text-gray-900">₹{formData.total_amount}</p>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <p className="text-gray-600">Balance</p>
                    <p className={`font-bold ${(parseFloat(formData.total_amount) - parseFloat(formData.paid_amount)) > 0 ? "text-red-500" : "text-green-600"}`}>
                      ₹{(parseFloat(formData.total_amount) - parseFloat(formData.paid_amount)).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/sales')}
                disabled={isSubmitting}
                className="rounded-lg border px-4 py-1.5"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="min-w-[120px] rounded-lg px-4 py-1.5 bg-black text-white"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Spinner />
                    Creating...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">Create Sale</span>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Add Forms */}
        <PartyForm
          isOpen={addFormOpen === 'party'}
          onClose={handleCloseAddForm}
          onSuccess={handleAddFormSuccess}
          id={selectedId?.id}
          title={selectedId ? `Edit Party` : `Add Party`}
        />
    </div>
  );
}
