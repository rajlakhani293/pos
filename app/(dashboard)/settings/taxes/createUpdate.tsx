"use client"

import { useEffect, useState } from "@/lib/imports";
import DynamicForm from "@/components/DynamicForm";
import { settings } from "@/lib/api/settings";
import { FormField, getInitialFormValues } from "@/lib/utils";
import { showToast } from "@/lib/toast";

interface TaxFormProps {
  isOpen: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
  id?: string | null;
  title?: string;
}

const Schema: FormField[] = [
  { 
    name: "tax_name", 
    label: "Tax Name", 
    placeholder: "e.g. VAT", 
    required: true 
  },
  { 
    name: "tax_value", 
    label: "Tax Rate (%)", 
    placeholder: "e.g. 15", 
    required: true,
    type: "number"
  }
];

export function TaxForm({ 
  isOpen, 
  onClose, 
  onSuccess, 
  id, 
  title, 
}: TaxFormProps) {
  const [createTax] = settings.useCreateTaxMutation();
  const [editTax] = settings.useEditTaxMutation();
  const [getTaxData] = settings.useGetTaxByIdMutation();

  const [initialValues, setInitialValues] = useState<any>(() => getInitialFormValues(Schema));
  
  /** Submit handler */
  const handleSubmit = async (values: any, { resetForm }: any) => {
    try {
      const processedValues = {
        ...values,
        tax_rate: parseFloat(values.tax_rate),
      };

      const result: any = id
        ? await editTax({ id, payLoad: processedValues }).unwrap()
        : await createTax(processedValues).unwrap();

      if (result?.success) {
        showToast.success(id ? "Tax updated successfully!" : "Tax created successfully!");
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
      const result: any = await getTaxData({ id: parseInt(id) }).unwrap();
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
