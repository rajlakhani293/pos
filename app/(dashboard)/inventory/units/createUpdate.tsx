"use client"

import { useEffect, useState } from "@/lib/imports";
import DynamicForm from "@/components/DynamicForm";
import { items } from "@/lib/api/items";
import { buildPayload, getInitialFormValues, type FormField } from "@/lib/utils";
import { showToast } from "@/lib/toast";

interface UnitFormProps {
  isOpen: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
  id?: string | null;
  title?: string;
}

const Schema: FormField[] = [
  { 
    name: "unit_name", 
    label: "Unit Name", 
    placeholder: "e.g. Pieces", 
    required: true,
    custom_msg: "Unit Name is required"
  },
  { 
    name: "short_name", 
    label: "Unit Short Name", 
    placeholder: "e.g. PCS",
    required: true,
    custom_msg: "Unit Short Name is required"
  }
];

export function UnitForm({ 
  isOpen, 
  onClose, 
  onSuccess, 
  id, 
  title, 
}: UnitFormProps) {
  const [createItemUnit] = items.useCreateItemUnitMutation();
  const [editItemUnit] = items.useEditItemUnitMutation();
  const [getItemUnitData] = items.useGetItemUnitByIdMutation();

  const [initialValues, setInitialValues] = useState(() =>
    getInitialFormValues(Schema)
  );

  const handleSubmit = async (
    values: Record<string, any>,
    { resetForm }: any
  ) => {
    try {
      const payLoad = buildPayload(Schema, values, { id });
      const result = id
        ? await editItemUnit({ id, ...payLoad }).unwrap()
        : await createItemUnit(payLoad).unwrap();

      resetForm();
      onClose?.();
      onSuccess?.();
      showToast.success(id ? "Unit updated successfully!" : "Unit created successfully!");
      return result;
    } catch (error) {
      showToast.error(error);
      return error;
    }
  };

  const handleGetMaster = async (id: string) => {
    setInitialValues({
      ...getInitialFormValues(Schema),
      isLoaded: 'false',
    });
    try {
      const result:any = await getItemUnitData({ id: parseInt(id) }).unwrap();
      if (result?.data) {
        const data = result.data;
        setInitialValues(
          getInitialFormValues(Schema, data, 'edit')
        );
      }
    } catch (e) {
      console.error(e);
      setInitialValues({
        ...getInitialFormValues(Schema),
        isLoaded: 'true',
      });
    }
  };

  useEffect(() => {
    if (id && isOpen) {
      handleGetMaster(id);
    } else if (isOpen) {
      setInitialValues(
        getInitialFormValues(Schema, null, 'create')
      );
    }
  }, [id, isOpen]);

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
