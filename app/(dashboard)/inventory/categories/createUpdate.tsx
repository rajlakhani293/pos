"use client"

import { useEffect, useState } from "@/lib/imports";
import DynamicForm from "@/components/DynamicForm";
import { items } from "@/lib/api/items";
import { FormField, getInitialFormValues } from "@/lib/utils";
import { showToast } from "@/lib/toast";

interface CategoryFormProps {
  isOpen: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
  id?: string | null;
  title?: string;
}

const Schema: FormField[] = [
  { 
    name: "category_name", 
    label: "Category Name", 
    placeholder: "e.g. Electronics", 
    required: true 
  },
  { 
    name: "description", 
    label: "Description", 
    placeholder: "Enter a description...",
  }
];

export function CategoryForm({ 
  isOpen, 
  onClose, 
  onSuccess, 
  id, 
  title, 
}: CategoryFormProps) {
  const [createItemCategory] = items.useCreateItemCategoryMutation();
  const [editItemCategory] = items.useEditItemCategoryMutation();
  const [getItemCategoryData] = items.useGetItemCategoryByIdMutation();

  const [initialValues, setInitialValues] = useState<any>(() => getInitialFormValues(Schema));
  
  /** Submit handler */
  const handleSubmit = async (values: any, { resetForm }: any) => {
    try {
      const processedValues = {
        ...values,
      };

      const result: any = id
        ? await editItemCategory({ id, payLoad: processedValues }).unwrap()
        : await createItemCategory(processedValues).unwrap();

      if (result?.success) {
        showToast.success(id ? "Category updated successfully!" : "Category created successfully!");
        resetForm();
        onClose?.();
        onSuccess?.();
      } else {
        showToast.error(result);
      }

      return result;
    } catch (error: any) {
      showToast.error(error);
      console.error("Submit failed:", error);
      return error;
    }
  };

  /** Load data if editing */
  const handleGetMaster = async (id: any) => {
    try {
      const result: any = await getItemCategoryData({ id: parseInt(id) }).unwrap();
      const data = result.data;
      if (result?.data) {
        const baseValues = getInitialFormValues(Schema, data);
        setInitialValues(baseValues);
      }
    } catch (e) {
      console.error("Fetch failed:", e);
    }
  };

  /** Sync when opening or when id changes */
  useEffect(() => {
    if (isOpen) {
      if (id) {
        handleGetMaster(id);
      } else {
        setInitialValues(
          getInitialFormValues(Schema, null, 'create')
        );
      }
    }
  }, [id, isOpen]);

  /** Reset form when closing */
  useEffect(() => {
    if (!isOpen) {
      setInitialValues(getInitialFormValues(Schema));
    }
  }, [isOpen]);

  return (
    <DynamicForm
      fields={Schema}
      initialValues={initialValues}
      onSubmit={handleSubmit}
      onClose={onClose}
      isOpen={isOpen}
      title={title}
    />
  );
}
