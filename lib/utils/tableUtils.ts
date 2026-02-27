import dayjs from "dayjs";

export interface FormValuesWithLoading extends Record<string, any> {
  isLoaded?: string;
}

export type FormField = {
  validation?: any;
  name: string;
  label: string;
  type?:
  | "select" | "number" | "text" | "textarea" | "date" | "month" | "note"
  | "checkbox" | "radio" | "file" | "switch" | "password" | "email" | "tel"
  | "hidden" | "custom" | "readonly";
  placeholder?: string;
  icon?: React.ReactNode;
  required?: boolean;
  showCheckbox?: boolean;
  custom_msg?: string;
  note?: string;
  multiple?: boolean;
  allowClear?: boolean;
  defaultValue?: string | number;
  hidden?: boolean;
  options?: { label: string; value: any }[];
  dataType?: "string" | "number";
  checkedText?: string;
  unCheckedText?: string;
  checkedValue?: any;
  unCheckedValue?: any;
  custom?: (formikProps: any) => React.ReactNode;
  rows?: number;
  readonly?: boolean;
  maxLength?: number;
};

export const getInitialFormValues = <T extends FormValuesWithLoading>(
  schema: FormField[],
  data?: Record<string, any> | null,
  mode: 'create' | 'edit' = 'create'
): T => {
  const initialValues: Record<string, any> = {};

  schema.forEach(field => {
    if (field.defaultValue !== undefined && field.defaultValue !== null) {
      initialValues[field.name] = field.defaultValue;
    } else {
      initialValues[field.name] = "";
    }
  });

  const typedValues = initialValues as T;

  if (mode === 'create') {
    typedValues.isLoaded = "true";
  } else if (mode === 'edit') {
    typedValues.isLoaded = data ? "true" : "false";
  }

  if (data && data !== null) {
    for (const field of schema) {
      if (data[field.name] !== undefined) {
        const rawValue = data[field.name];
        if ((field.type === "date" || field.type === "month") && rawValue) {
          (typedValues as any)[field.name] = dayjs(rawValue);
        } else {
          (typedValues as any)[field.name] = rawValue?.toString() || "";
        }
      }
    }
    typedValues.isLoaded = "true";
  }

  return typedValues;
};

const toSnakeCase = (str: string) =>
  str.replace(/([A-Z])/g, "_$1").toLowerCase();

export const buildPayload = (
  schema: FormField[],
  values: Record<string, any>,
  additionalParams: Record<string, any> = {},
  extraFields: string[] = [],
) => {
  const isEditMode = additionalParams.id != null;
  const allKeys = [...schema.map((f) => f.name), ...extraFields];

  const payload = allKeys.reduce((acc, key) => {
    const val = values[key];
    if (isEditMode || (val != null && val !== "")) {
      const field = schema.find((f) => f.name === key);
      const snakeKey = toSnakeCase(key);
      if (field?.type === "select" && field.multiple && Array.isArray(val)) {
        acc[snakeKey] = val.join(",");
      } else if (field?.type === "date" && val && typeof val.format === "function") {
        acc[snakeKey] = val.format("YYYY-MM-DD");
      } else if (field?.type === "month" && val && typeof val.format === "function") {
        acc[snakeKey] = val.format("YYYY-MM");
      } else {
        const valueToSend = isEditMode && val === "" ? null : val;
        acc[snakeKey] = isNaN(Number(valueToSend)) || valueToSend === "" || valueToSend === null ? valueToSend : Number(valueToSend);
      }
    }
    return acc;
  }, {} as Record<string, any>);

  const snakeAdditional = Object.fromEntries(
    Object.entries(additionalParams).map(([k, v]) => [toSnakeCase(k), v])
  );

  return { ...payload, ...snakeAdditional };
};
