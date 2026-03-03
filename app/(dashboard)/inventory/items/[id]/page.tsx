"use client"

import { useEffect, useState, useRef } from "@/lib/imports";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useRouter, useParams } from "next/navigation";
import { items } from "@/lib/api/items";
import { getInitialFormValues, type FormField } from "@/lib/utils";
import { UniFieldInput } from "@/components/ui/unifield-input";
import { UniFieldSelect } from "@/components/ui/unifield-select";
import { SelectItem } from "@/components/ui/select";
import { LeftIcon } from "@/components/AppIcon";
import { CategoryForm } from "@/app/(dashboard)/inventory/categories/createUpdate";
import { UnitForm } from "@/app/(dashboard)/inventory/units/createUpdate";
import { BrandForm } from "@/app/(dashboard)/settings/brands/createUpdate";
import { settings } from "@/lib/api/settings";
import { MultipleImageUpload } from "@/components/ui/multiple-image-upload";
import { showToast } from "@/lib/toast";

export default function ItemPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const isEdit = id !== 'create';
  
  const [createItem] = items.useCreateItemMutation();
  const [editItem] = items.useEditItemMutation();
  const [getItemData] = items.useGetItemByIdMutation();
  const [getCategories] = items.useGetItemCategoriesDropdownMutation();
  const [getUnits] = items.useGetItemUnitsDropdownMutation();
  const [getBrands] = settings.useGetBrandsDropdownMutation();

  const [categories, setCategories] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEdit);
  
  // State for managing add forms
  const [addFormOpen, setAddFormOpen] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<any>(null);
  const [isFooterStuck, setIsFooterStuck] = useState(false);
  const paginationSentinelRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const lastFetchedIdRef = useRef<string | null>(null);

  const fetchCategories = async () => {
    try {
      const result = await getCategories({}).unwrap();
      setCategories((result as any)?.data?.map((item: any) => ({
        label: item.category_name,
        value: item.id
      })) || []);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const fetchUnits = async () => {
    try {
      const result = await getUnits({}).unwrap();
      setUnits((result as any)?.data?.map((item: any) => ({
        label: item.unit_name,
        value: item.id
      })) || []);
    } catch (error) {
      console.error("Failed to fetch units:", error);
    }
  };

  const fetchBrands = async () => {
    try {
      const result = await getBrands({}).unwrap();
      setBrands((result as any)?.data?.map((item: any) => ({
        label: item.brand_name,
        value: item.id
      })) || []);
    } catch (error) {
      console.error("Failed to fetch brands:", error);
    }
  };

  const Schema: FormField[] = [
    { 
      name: "item_name", 
      label: "Item Name", 
      placeholder: "e.g. Premium Widget", 
      required: true 
    },
    {
      name: "category_id",
      label: "Category",
      type: "select",
      placeholder: "Select Category",
      required: true,
      options: categories,
      onAddNew: () => handleOpenAddForm('category'),
      addNewLabel: "Add New Category"
    },
    {
      name: "purchase_price",
      label: "Purchase Price",
      type: "number",
      placeholder: "0.00"
    },
    {
      name: "selling_price",
      label: "Selling Price",
      type: "number",
      placeholder: "0.00",
      required: true,
      min: 0,
      step: 0.01
    },
    {
      name: "opening_stock",
      label: "Opening Stock",
      type: "number",
      placeholder: "0.00",
      min: 0,
      step: 0.01
    },
    // {
    //   name: "min_stock_level",
    //   label: "Minimum Stock Level",
    //   type: "number",
    //   placeholder: "0.00",
    //   required: true,
    //   min: 0,
    //   step: 0.01
    // },
    {
      name: "primary_unit_id",
      label: "Primary Unit",
      type: "select",
      placeholder: "Select Unit",
      required: true,
      options: units,
      onAddNew: () => handleOpenAddForm('unit'),
      addNewLabel: "Add New Unit"
    },
    {
      name: "item_weight",
      label: "Item Weight",
      type: "number",
      placeholder: "0.00",
      min: 0,
      step: 0.01
    },
    {
      name: "brand",
      label: "Brand",
      type: "select",
      placeholder: "Select Brand",
      options: brands,
      onAddNew: () => handleOpenAddForm('brand'),
      addNewLabel: "Add New Brand"
    },
    {
      name: "barcode",
      label: "Barcode",
      placeholder: "Enter barcode"
    },
    { 
      name: "description", 
      label: "Description", 
      type: "textarea",
      placeholder: "Enter a detailed description...",
      rows: 3
    },
    {
      name: "item_code",
      label: "Item Code",
      type: "hidden"
    }
  ];

  const [formData, setFormData] = useState<any>(() => ({
    ...getInitialFormValues(Schema),
    item_images_metadata: [],
    item_images_files: {}
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = (name: string, value: any) => {
    const field = Schema.find(f => f.name === name);
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
  };


  const handleSubmit = async (e: React.FormEvent) => {
    console.log("save");
    
    e.preventDefault();
    setIsSubmitting(true);

    // Validate all fields
    const newErrors: Record<string, string> = {};
    Schema.forEach(field => {
      const error = validateField(field.name, formData[field.name]);
      if (error) newErrors[field.name] = error;
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      try {
        const formDataPayload = new FormData();
        
        // Append regular form fields
        Object.entries(formData).forEach(([key, value]) => {
          if (['item_images_metadata', 'item_images_files', 'front_images', 'rear_images', 'other_images'].includes(key)) return;
          if (value !== null && value !== undefined) {
            formDataPayload.append(key, value.toString());
          }
        });

        // Append item_images metadata
        formDataPayload.append('item_images', JSON.stringify(formData.item_images_metadata || []));

        // Append image files
        const imageFiles = formData.item_images_files || {};
        Object.entries(imageFiles).forEach(([key, file]) => {
          formDataPayload.append(key, file as File);
        });

        if (isEdit) {
          const result:any = await editItem({ id, payLoad: formDataPayload }).unwrap();
          showToast.success(result?.message || "Item updated successfully");
        } else {
          const result:any = await createItem(formDataPayload).unwrap();
          showToast.success(result?.message || "Item created successfully");
        }
        
        setIsSubmitting(false);
        router.push('/inventory/items');
        return;
      } catch (error: any) {
        setIsSubmitting(false);
      }
    } else {
      setIsSubmitting(false);
    }
  };

  const handleGetMaster = async (id: any) => {
    try {
      const result: any = await getItemData({ id: parseInt(id) }).unwrap();
      const data = result.data;
      if (result?.data) {
        const baseValues = getInitialFormValues(Schema, data, 'edit');
        setFormData({
          ...baseValues,
          category_id: data.category?.toString() || "",
          primary_unit_id: data.primary_unit?.toString() || "",
          item_images_metadata: data.item_images || [],
          item_images_files: {}
        });
      }
    } catch (e) {
      console.error("Fetch failed:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategoriesAndUnits = async (force: boolean = false) => {
    if (!force && categories.length > 0 && units.length > 0) return;
    
    try {
      await Promise.all([
        fetchCategories(),
        fetchUnits(),
        fetchBrands()
      ]);
    } catch (error) {
      console.error("Failed to fetch categories, units and brands:", error);
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

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      if (isEdit && id === lastFetchedIdRef.current) {
        return;
      }
      
      await fetchCategoriesAndUnits();
      
      if (!isMounted) {
        return;
      }

      if (isEdit && id) {
        if (id === lastFetchedIdRef.current) {
          return;
        }

        lastFetchedIdRef.current = id;
        await handleGetMaster(id);
      } else {
        lastFetchedIdRef.current = null;
        setFormData(
          getInitialFormValues(Schema, null, 'create')
        );
      }
    };
    loadData();
    
    return () => {
      isMounted = false;
    };
  }, [id, isEdit]);

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
        rootMargin: "0px 0px -85px 0px",
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
          <p className="mt-2 text-gray-600">Loading item data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border-2 rounded-lg bg-white flex flex-col h-[calc(100vh-70px)] overflow-hidden">
        {/* Form */}
         <div className="px-6 py-2 border-b border-gray-200 bg-white z-20 flex-none">
          <div className="flex items-center gap-4">
            <button className="flex items-center text-sm text-gray-600 hover:text-gray-900 hover:cursor-pointer" onClick={() => router.push('/inventory/items')}>
              <LeftIcon className="size-4" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">{isEdit ? 'Edit Item' : 'Create Item'}</h1>
          </div>
        </div>
        <div ref={contentRef} className="px-6 pt-6 overflow-y-auto flex-1 custom-scrollbar">
          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            {/* Multi-column Layout */}
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Main Column - Left (60%) */}
              <div className="w-full lg:w-[70%] space-y-6">
                {/* Basic Details */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Schema.filter(field => ['item_name', 'category_id', 'brand', 'barcode'].includes(field.name)).map((field) => (
                      <div key={field.name}>
                        {field.type === "select" ? (
                         <UniFieldSelect
                            label={field.label}
                            value={formData[field.name] || ''}
                            onValueChange={(value) => handleChange(field.name, value)}
                            placeholder={field.placeholder || `Select ${field.label}`}
                            required={field.required}
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
                            value={formData[field.name] || ''}
                            onChange={(e) => handleChange(field.name, e.target.value)}
                            required={field.required}
                            min={field.min}
                            step={field.step}
                            error={errors[field.name]}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pricing  */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Schema.filter(field => ['purchase_price', 'selling_price'].includes(field.name)).map((field) => (
                      <div key={field.name}>
                          <UniFieldInput
                            label={field.label}
                            type={field.type}
                            placeholder={field.placeholder}
                            value={formData[field.name] || ''}
                            onChange={(e) => handleChange(field.name, e.target.value)}
                            required={field.required}
                            min={field.min}
                            step={field.step}
                            error={errors[field.name]}
                          />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Inventory & Compliance */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory & Compliance</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Schema.filter(field => ['opening_stock', 'primary_unit_id', 'min_stock_level', 'item_weight'].includes(field.name)).map((field) => (
                      <div key={field.name}>
                        {field.type === "select" ? (
                          <UniFieldSelect
                            label={field.label}
                            value={formData[field.name] || ''}
                            onValueChange={(value) => handleChange(field.name, value)}
                            placeholder={field.placeholder || `Select ${field.label}`}
                            required={field.required}
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
                            value={formData[field.name] || ''}
                            onChange={(e) => handleChange(field.name, e.target.value)}
                            required={field.required}
                            min={field.min}
                            step={field.step}
                            error={errors[field.name]}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>
                  {Schema.filter(field => field.name === 'description').map((field) => (
                    <div key={field.name}>
                      <UniFieldInput
                        label={field.label}
                        type={field.type}
                        placeholder={field.placeholder}
                        value={formData[field.name] || ''}
                        onChange={(e) => handleChange(field.name, e.target.value)}
                        required={field.required}
                        min={field.min}
                        step={field.step}
                        as="textarea"
                        rows={4}
                        error={errors[field.name]}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Sidebar - Right (40%) */}
              <div className="w-full lg:w-[30%] space-y-6">
                {/* Images */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <MultipleImageUpload
                    key={id}
                    initialImages={formData.item_images_metadata || []}
                    onFrontImagesChange={(files: File[]) => handleChange('front_images', files)}
                    onRearImagesChange={(files: File[]) => handleChange('rear_images', files)}
                    onOtherImagesChange={(files: File[]) => handleChange('other_images', files)}
                    onImagesUpdate={(data: any) => {
                      setFormData((prev: any) => ({
                        ...prev,
                        item_images_metadata: data.item_images,
                        item_images_files: data.files
                      }));
                    }}
                    frontError={errors.front_images}
                    rearError={errors.rear_images}
                    otherError={errors.other_images}
                  />
                </div>

                
              </div>
            </div>

            <div ref={paginationSentinelRef} className="h-px w-full" />

            {/* Form Actions */}
            <footer className={`mt-4 sticky z-50 transition-all duration-300 ease-in-out ${isFooterStuck ? "mx-6 bottom-5" : "mx-0 bottom-0"}`}>
              <div className={`flex items-center justify-end gap-x-2 rounded-b-xl p-3 bg-white/90 backdrop-blur-md transition-shadow duration-200 ${isFooterStuck ? "rounded-t-xl shadow-lg border border-gray-200/80" : "rounded-t-none shadow-none border-t-2 border-gray-100"}`}>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.push('/inventory/items')} 
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
                      Saving...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      {isEdit ? 'Update Item' : 'Save Item'}
                    </span>
                  )}
                </Button>
              </div>
            </footer>
          </form>
        </div>
        
        {/* Add Forms */}
         <CategoryForm
           isOpen={addFormOpen === 'category'}
           onClose={handleCloseAddForm}
           onSuccess={() => { handleCloseAddForm(); fetchCategories(); }}
           id={selectedId?.id}
           title={selectedId ? `Edit Item Category` : `Add Item Category`}
         />
         <UnitForm
           isOpen={addFormOpen === 'unit'}
           onClose={handleCloseAddForm}
           onSuccess={() => { handleCloseAddForm(); fetchUnits(); }}
           id={selectedId?.id}
           title={selectedId ? `Edit Item Unit` : `Add Item Unit`}
         />
         <BrandForm
           isOpen={addFormOpen === 'brand'}
           onClose={handleCloseAddForm}
           onSuccess={() => { handleCloseAddForm(); fetchBrands(); }}
           id={selectedId?.id}
           title={selectedId ? `Edit Brand` : `Add Brand`}
         />
    </div>
  );
}
