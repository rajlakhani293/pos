"use client"

import { useEffect, useMemo, useState, useRef } from "@/lib/imports";
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
import { SelectItem } from "@/components/ui/select";
import { SearchIcon, TrashIcon } from "@/components/AppIcon";
import { ButtonGroup } from "@/components/ui/button-group";
import { PartyForm } from "@/app/(dashboard)/settings/parties/createUpdate";
import { TaxForm } from "@/app/(dashboard)/settings/taxes/createUpdate";
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
  const [discountType, setDiscountType] = useState<"percentage" | "amount">("percentage");
  const [isFooterStuck, setIsFooterStuck] = useState(false);
  const paginationSentinelRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const debouncedItemSearch = useDebounce(itemSearch, 400);

  const fetchParties = async () => {
    try {
      const result = await getParties({}).unwrap();
      setParties((result as any)?.data?.map((item: any) => ({
        label: item.name,
        value: item.id
      })) || []);
    } catch (error) {
      console.error("Failed to fetch parties:", error);
    }
  };

  const fetchTaxes = async () => {
    try {
      const result = await getTaxes({}).unwrap();
      setTaxes((result as any)?.data?.map((item: any) => ({
        label: `${item.tax_name} (${item.tax_value}%)`,
        value: item.id,
        rate: item.tax_value
      })) || []);
    } catch (error) {
      console.error("Failed to fetch taxes:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const result = await getItemCategories({}).unwrap();
      setItemCategories((result as any)?.data?.map((item: any) => ({
        id: item.id,
        name: item.category_name,
        item_count: item.item_count,
      })) || []);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  // Main sales form schema
  const SalesSchema: FormField[] = [
    {
      name: "party_id",
      label: "Party",
      type: "select",
      placeholder: "Select Party",
      options: parties,
      onAddNew: () => handleOpenAddForm('party'),
      addNewLabel: "Add New Party",
    },
    {
      name: "sales_date",
      label: "Sales Date",
      type: "date",
      placeholder: "Select Date",
      required: true
    },
    {
      name: "discount_value",
      label: "Discount",
      type: "number",
      placeholder: discountType === "percentage" ? "0.00%" : "₹0.00",
      min: 0,
      max: discountType === "percentage" ? 100 : undefined,
      step: 0.01
    },
    {
      name: "paid_amount",
      label: "Paid Amount",
      type: "number",
      placeholder: "0.00",
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
    subtotal: "",
    tax_amount: "",
    discount_percentage: "",
    discount_amount: "",
    discount_value: "",
    total_amount: "",
    paid_amount: "",
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

  const handleDiscountTypeChange = (type: "percentage" | "amount") => {
    setDiscountType(type);
    // Clear discount value when switching types
    setFormData((prev: any) => ({ ...prev, discount_value: "" }));
    // Recalculate totals will happen through useEffect
  };

  const handleChange = (name: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [name]: value }));

    const error = validateField(name, value);
    setErrors((prev: any) => ({ ...prev, [name]: error }));

    // Auto-calculate when discount value changes
    if (name === 'discount_value') {
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

    const discountValue = parseFloat(formData.discount_value) || 0;
    const overallDiscountAmount = discountType === "percentage"
      ? subtotal * (discountValue / 100)
      : discountValue;
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
        discount_percentage: discountType === "percentage" ? formData.discount_value || "0" : "0",
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
    setFormData((prev: any) => {
      const newTransactions = prev.transactions.filter((_: any, i: number) => i !== index);
      return { ...prev, transactions: newTransactions };
    });
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

    // Additional validation for partial payment
    if (formData.payment_mode === "3") {
      // Validate party is required for partial payment
      if (!formData.party_id || (typeof formData.party_id === 'string' && formData.party_id.trim() === '')) {
        newErrors.party_id = "Party is required for partial payment";
      }
      
      // Validate paid amount is required and greater than 0 for partial payment
      if (!formData.paid_amount || parseFloat(formData.paid_amount) <= 0) {
        newErrors.paid_amount = "Paid amount must be greater than 0 for partial payment";
      }
    }

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
          discount_percentage: discountType === "percentage" ? parseFloat(formData.discount_value || "0") : 0,
          discount_amount: parseFloat(formData.discount_amount || "0"),
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

  const fetchPartiesAndItems = async (force: boolean = false) => {
    if (!force && parties.length > 0 && itemsList.length > 0) return;

    try {
      await Promise.all([
        fetchParties(),
        fetchTaxes(),
        fetchCategories(),
      ]);
    } catch (error) {
      console.error("Failed to fetch parties, taxes, and categories:", error);
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

  const filteredItems = useMemo(() => {
    return itemsList;
  }, [itemsList]);

  const addItemToCart = (itemId: string) => {
    const selectedItem = itemsList.find((item) => item.value.toString() === itemId);
    if (!selectedItem) return;

    // Clear transaction error when item is added
    if (errors.transactions) {
      setErrors((prev: any) => {
        const newErrors = { ...prev };
        delete newErrors.transactions;
        return newErrors;
      });
    }

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

  const getItemById = (itemId: any) => itemsList.find((item) => item.value.toString() === itemId?.toString());

  useEffect(() => {
    fetchPartiesAndItems();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    fetchItems({ categoryId: selectedCategoryId, search: debouncedItemSearch }).catch(() => { });
  }, [debouncedItemSearch, selectedCategoryId, isLoading]);

  useEffect(() => {
    calculateTotals();
  }, [formData.transactions, formData.discount_value, discountType, taxes]);

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
        rootMargin: "0px",
        root: contentRef.current
      },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isLoading]);

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
    <div className=" bg-white flex flex-col h-full overflow-hidden">
      <div ref={contentRef} className="overflow-y-auto flex-1 custom-scrollbar">
        <form onSubmit={handleSubmit} noValidate className="space-y-6" id="sales-form">
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
                      className={`shrink-0 rounded-full border px-3 py-1 text-sm font-medium transition-colors cursor-pointer ${selectedCategoryId === "all" ? "bg-black text-white" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100"}`}
                    >
                      All
                    </button>
                    {itemCategories.map((cat: any) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategoryId(cat.id?.toString?.() || "all")}
                        className={`shrink-0 rounded-full border px-3 py-1 text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer ${selectedCategoryId === cat.id?.toString?.() ? "bg-black text-white" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100"}`}
                      >
                        <span className="max-w-[160px] truncate">{cat.name}</span>
                        <Badge variant="outline" className={`${selectedCategoryId === cat.id?.toString?.() ? "bg-white text-black border-0" : ""} bg-gray-100`}
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
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">Cart</h3>
                  <p className="text-sm text-gray-500">{formData.transactions.length} items</p>
                </div>

                <div className="overflow-x-auto border rounded-lg border-gray-200">
                  {errors.transactions && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm rounded-t-lg">
                      {errors.transactions}
                    </div>
                  )}
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-700 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="px-3 py-2">Item</th>
                        <th className="px-3 py-2 w-24">Qty</th>
                        <th className="px-3 py-2 w-24">Rate</th>
                        <th className="px-3 py-2 text-right w-28">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {formData.transactions.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-3 py-8 text-center text-gray-500 italic">
                            Add items from the catalog.
                          </td>
                        </tr>
                      ) : (
                        formData.transactions.map((transaction: any, index: number) => {
                          const selectedItem = getItemById(transaction.item_id);
                          return (
                            <tr key={index} className="hover:bg-gray-50 transition-colors group relative">
                              <td className="pl-2 py-2">
                                <p className="font-semibold text-gray-900 line-clamp-1">{selectedItem?.label || "Unknown"}</p>
                                <p className="text-[10px] text-gray-500">{selectedItem?.item_code || "N/A"}</p>
                              </td>
                              <td className="px-1 py-2 w-24">
                                <UniFieldInput
                                  type="number"
                                  value={transaction.item_quantity || ""}
                                  onChange={(e) => handleTransactionChange(index, "item_quantity", e.target.value)}
                                  className="w-20 h-8"
                                  min={0}
                                  step="0.01"
                                />
                              </td>
                              <td className="px-1 py-2 w-24">
                                <UniFieldInput
                                  type="number"
                                  value={transaction.item_rate || ""}
                                  onChange={(e) => handleTransactionChange(index, "item_rate", e.target.value)}
                                  className="w-full h-8 text-xs"
                                  placeholder="0.00"
                                  step="0.01"
                                />
                              </td>
                              <td className="px-1 py-2 text-right w-28 font-bold text-gray-900 relative">
                                ₹{parseFloat(transaction.total_amount || "0").toFixed(2)}

                                {/* Delete button overlay on hover */}
                                <div className="absolute inset-y-0 border right-0 rounded-l-lg flex items-center px-1 bg-white opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-full group-hover:translate-x-0">
                                  <button
                                    type="button"
                                    onClick={() => removeTransaction(index)}
                                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                                    title="Remove item"
                                  >
                                    <TrashIcon className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white space-y-4">
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

                {formData.payment_mode === "3" && (
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
                )}
              </div>

              <div className="bg-white">
                <div className="space-y-4">
                  {SalesSchema.filter(field => ["party_id", "sales_date", "notes"].includes(field.name)).map((field) => (
                    <div key={field.name}>
                      {field.name === "party_id" ? (
                        <UniFieldSelect
                          label={field.label}
                          value={formData[field.name] || ''}
                          onValueChange={(value) => handleChange(field.name, value)}
                          placeholder={field.placeholder || `Select ${field.label}`}
                          required={field.required || formData.payment_mode === "3"}
                          error={errors[field.name]}
                          onAddNew={field.onAddNew}
                          addNewLabel={field.addNewLabel}
                        >
                          {field.options?.filter(option => option != null && option.value != null).map((option) => (
                            <SelectItem key={option.value} value={option.value.toString()}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </UniFieldSelect>
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
                          as={field.type === "textarea" ? "textarea" : "input"}
                          rows={field.rows || 3}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>


              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <p className="text-gray-600">Subtotal</p>
                  <p className="font-semibold text-gray-900">₹{formData.subtotal}</p>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <p className="text-gray-600">Discount</p>
                  <ButtonGroup>
                    <UniFieldInput
                      type="number"
                      placeholder={discountType === "percentage" ? "0.00%" : "₹0.00"}
                      value={formData.discount_value || ""}
                      onChange={(e) => handleChange("discount_value", e.target.value)}
                      min={0}
                      max={discountType === "percentage" ? 100 : undefined}
                      step={0.01}
                      className="w-20 h-8 rounded-r-none"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleDiscountTypeChange(discountType === "percentage" ? "amount" : "percentage")}
                      className="w-8 h-8 p-0 rounded-l-none"
                    >
                      {discountType === "percentage" ? "%" : "₹"}
                    </Button>
                  </ButtonGroup>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <p className="text-gray-600">Tax</p>
                  <div className="flex items-center gap-2">
                    <UniFieldSelect
                      value={formData.selected_tax_id || ''}
                      onValueChange={(value) => {
                        setFormData((prev: any) => ({
                          ...prev,
                          selected_tax_id: value,
                          transactions: prev.transactions.map((t: any) => ({
                            ...t,
                            tax_id: value
                          }))
                        }));
                      }}
                      placeholder="Select Tax"
                      containerClassName="w-40"
                      size="sm"
                      onAddNew={() => handleOpenAddForm('tax')}
                      addNewLabel="Add New Tax"
                    >
                      {taxes.filter(tax => tax != null && tax.value != null).map((tax) => (
                        <SelectItem key={tax.value} value={tax.value.toString()}>
                          {tax.label}
                        </SelectItem>
                      ))}
                    </UniFieldSelect>
                    <span className="font-semibold text-gray-900">₹{formData.tax_amount}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t pt-2">
                  <p className="font-semibold text-gray-900">Grand Total</p>
                  <p className="text-xl font-bold text-gray-900">₹{formData.total_amount}</p>
                </div>
                {formData.payment_mode === "3" && (
                  <div className="flex items-center justify-between text-sm">
                    <p className="text-gray-600">Balance</p>
                    <p className={`font-bold ${(parseFloat(formData.total_amount) - parseFloat(formData.paid_amount)) > 0 ? "text-red-500" : "text-green-600"}`}>
                      ₹{(parseFloat(formData.total_amount) - parseFloat(formData.paid_amount)).toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>
        <div ref={paginationSentinelRef} className="h-px w-full" />
        
      </div>
        <footer className={`mt-4 sticky z-10 transition-all duration-300 ease-in-out ${isFooterStuck ? "mx-6 bottom-3" : "mx-0 bottom-0"}`}>
            <div className={`flex items-center justify-between gap-x-2 rounded-b-xl p-3 bg-white/90 backdrop-blur-md transition-shadow duration-200 ${isFooterStuck ? "rounded-t-xl shadow-lg border border-gray-200/80" : "rounded-t-none shadow-none border-t-2 border-gray-100"}`}>
              <div className="flex items-center gap-4">
                <div className="text-sm">
                  <span className="text-gray-600">Grand Total: </span>
                  <span className="font-bold text-lg text-gray-900">₹{formData.total_amount || "0.00"}</span>
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
                Cancel
              </Button>
              <Button
                type="submit"
                form="sales-form"
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
            </div>
          </footer>


      {/* Add Forms */}
      <PartyForm
        isOpen={addFormOpen === 'party'}
        onClose={handleCloseAddForm}
        onSuccess={() => { handleCloseAddForm(); fetchParties(); }}
        id={selectedId?.id}
        title={selectedId ? `Edit Party` : `Add Party`}
      />
      <TaxForm
        isOpen={addFormOpen === 'tax'}
        onClose={handleCloseAddForm}
        onSuccess={() => { handleCloseAddForm(); fetchTaxes(); }}
        id={selectedId?.id}
        title={selectedId ? `Edit Tax` : `Add Tax`}
      />
    </div>
  );
}
