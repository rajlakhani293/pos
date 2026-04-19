"use client"

import { useEffect, useState } from "@/lib/imports";
import DynamicForm from "@/components/DynamicForm";
import { settings } from "@/lib/api/settings";
import { locations } from "@/lib/api/locations";
import { FormField, getInitialFormValues } from "@/lib/utils";
import { showToast } from "@/lib/toast";

interface BranchFormProps {
  isOpen: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
  id?: string | null;
  title?: string;
}

export function BranchForm({ 
  isOpen, 
  onClose, 
  onSuccess, 
  id, 
  title, 
}: BranchFormProps) {
  const [createBranch] = settings.useCreateBranchMutation();
  const [editBranch] = settings.useEditBranchMutation();
  const [getBranchData] = settings.useGetBranchByIdMutation();
  
  // Location API hooks
  const [getCountries] = locations.useGetCountriesMutation();
  const [getStates] = locations.useGetStatesMutation();
  const [getCities] = locations.useGetCitiesMutation();

  const [countries, setCountries] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const Schema: FormField[] = [
  { 
    name: "branch_name", 
    label: "Branch Name", 
    placeholder: "e.g. Main Branch", 
    required: true 
  },
  { 
    name: "country_id", 
    label: "Country", 
    placeholder: "Select Country", 
    type: "select",
    required: true,
    options: countries,
  },
  { 
    name: "state_id", 
    label: "State", 
    placeholder: "Select State", 
    type: "select",
    required: true,
    options: states,
  },
  { 
    name: "city_id", 
    label: "City", 
    placeholder: "Select City", 
    type: "select",
    required: true,
    options: cities,
  },
  { 
    name: "pincode", 
    label: "Pincode", 
    placeholder: "e.g. 560001", 
    type: "number",
    maxLength: 6
  },
];

  const [dynamicFields, setDynamicFields] = useState<FormField[]>(Schema);
  
  const [initialValues, setInitialValues] = useState<any>(() => {
    const values = getInitialFormValues(Schema);
    values.country_id = "1";
    return values;
  });

  
  /** Submit handler */
  const handleSubmit = async (values: any, { resetForm }: any) => {
    try {
      const processedValues = {
        ...values,
        country_id: parseInt(values.country_id),
        state_id: parseInt(values.state_id),
        city_id: parseInt(values.city_id),
        pincode: values.pincode,
      };

      const result: any = id
        ? await editBranch({ id, payLoad: processedValues }).unwrap()
        : await createBranch(processedValues).unwrap();

      if (result?.success) {
        showToast.success(id ? "Branch updated successfully!" : "Branch created successfully!");
        resetForm();
        onClose?.();
        onSuccess?.();
      }
      return result;
    } catch (error: any) {
      return error;
    }
  };

  /** Load countries data */
  const loadCountries = async () => {
    try {
      const result:any = await getCountries({}).unwrap();
      if (result?.success && result?.data) {
        const countryOptions = result.data.map((country: any) => ({
          label: country.name || country.title,
          value: country.id?.toString() || country._id?.toString()
        }));
        setCountries(countryOptions);
      }
    } catch (error) {
      console.error("Failed to load countries:", error);
    }
  };
  
  /** Load states data */
  const loadStates = async (countryId: any) => {
    try {
      const result:any = await getStates({ id: countryId.toString() }).unwrap();
      if (result?.success && result?.data) {
        const stateOptions = result.data.map((state: any) => ({
          label: state.name || state.title,
          value: state.id?.toString() || state._id?.toString()
        }));
        setStates(stateOptions);
        setCities([]);
      }
    } catch (error) {
      console.error("Failed to load states:", error);
    }
  };
  
  /** Load cities data */
  const loadCities = async (stateId: any) => {
    try {
      const result:any = await getCities({ id: stateId.toString() }).unwrap();
      if (result?.success && result?.data) {
        const cityOptions = result.data.map((city: any) => ({
          label: city.name || city.title,
          value: city.id?.toString() || city._id?.toString()
        }));
        setCities(cityOptions);
      }
    } catch (error) {
      console.error("Failed to load cities:", error);
    }
  };

  const handleGetMaster = async (id: any) => {
    try {
      setIsLoading(true);
      const result: any = await getBranchData({ id: parseInt(id) }).unwrap();
      if (result?.data) {
        const data = result.data;
        
        if (data.country_id) {
          await loadStates(data.country_id);
          if (data.state_id) {
            await loadCities(data.state_id);
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
        
        const mappedData = {
          ...data,
          country_id: data.country_id,
          state_id: data.state_id,
          city_id: data.city_id
        };
        
        const baseValues = getInitialFormValues(Schema, mappedData);
        setInitialValues(baseValues);
      }
    } catch (e) {
      console.error("Fetch failed:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldChange = (name: string, value: any) => {
    if (name === 'country_id') {
      setInitialValues((prev: any) => ({ ...prev, [name]: value, state_id: '', city_id: '' }));
      if (value) {
        loadStates(value);
      }
    } else if (name === 'state_id') {
      setInitialValues((prev: any) => ({ ...prev, [name]: value, city_id: '' }));
      if (value) {
        loadCities(value);
      }
    } else {
      setInitialValues((prev: any) => ({ ...prev, [name]: value }));
    }
  };

  // Synchronize Schema with current options
  useEffect(() => {
    setDynamicFields(Schema);
  }, [countries, states, cities]);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      loadCountries().finally(() => {
        if (id) {
          handleGetMaster(id);
        } else {
          const defaultValues = getInitialFormValues(Schema, null, 'create');
          defaultValues.country_id = "1"; 
          setInitialValues(defaultValues);
          loadStates("1").finally(() => setIsLoading(false));
        }
      });
    }
  }, [id, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setInitialValues(getInitialFormValues(Schema));
      setStates([]);
      setCities([]);
      setDynamicFields(Schema);
    }
  }, [isOpen]);

  return (
    <DynamicForm
      fields={dynamicFields}
      initialValues={initialValues}
      onSubmit={handleSubmit}
      onClose={onClose}
      onFieldChange={handleFieldChange}
      isOpen={isOpen}
      title={title}
      isLoading={isLoading}
    />
  );
}
