"use client"

import { useEffect, useState } from "@/lib/imports";
import DynamicForm from "@/components/DynamicForm";
import { settings } from "@/lib/api/settings";
import { locations } from "@/lib/api/locations";
import { FormField, getInitialFormValues } from "@/lib/utils";
import { showToast } from "@/lib/toast";

interface PartyFormProps {
  isOpen: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
  id?: string | null;
  title?: string;
}

export function PartyForm({ 
  isOpen, 
  onClose, 
  onSuccess, 
  id, 
  title, 
}: PartyFormProps) {
  const [createParty] = settings.useCreatePartyMutation();
  const [editParty] = settings.useEditPartyMutation();
  const [getPartyData] = settings.useGetPartyByIdMutation();
  
  // Location API hooks
  const [getCountries] = locations.useGetCountriesMutation();
  const [getStates] = locations.useGetStatesMutation();
  const [getCities] = locations.useGetCitiesMutation();

  const [countries, setCountries] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);

  const Schema: FormField[] = [
   { 
    name: "party_type", 
    label: "Party Type", 
    placeholder: "Select Party Type", 
    type: "radio",
    defaultValue: "1",
    options: [
      { label: "Customer", value: 1 },
      { label: "Supplier", value: 2 },
      { label: "Both", value: 3 }
    ],
  },
  { 
    name: "name", 
    label: "Party Name", 
    placeholder: "e.g. John Doe", 
    required: true 
  },
  {
    name: "phone_number",
    label: "Phone Number",
    placeholder: "e.g. 1234567890",
    required: true,
    type: "number",
  },
  { 
    name: "customer_category", 
    label: "Customer Category", 
    placeholder: "Select Customer Category", 
    required: true,
    type: "select",
    options: [
      { label: "Regular", value: 1 },
      { label: "Card Holder", value: 2 },
      { label: "Vara (Home Delivery)", value: 3 }
    ],
  },
  {
    name: "email",
    label: "Email",
    placeholder: "e.g. john.doe@example.com",
    type: "email",
  },
  {
    name: "address",
    label: "Address",
    placeholder: "e.g. 123 Main St",
    required: true,
    type: "textarea",
  },
  { 
    name: "country", 
    label: "Country", 
    placeholder: "Select Country", 
    type: "select",
    required: true,
    options: countries,
  },
  { 
    name: "state", 
    label: "State", 
    placeholder: "Select State", 
    type: "select",
    required: true,
    options: states,
  },
  { 
    name: "city", 
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
  },
];

  const [dynamicFields, setDynamicFields] = useState<FormField[]>(Schema);
  
  const [initialValues, setInitialValues] = useState<any>(() => {
    const values = getInitialFormValues(Schema);
    values.country = "1";
    return values;
  });

  
  /** Submit handler */
  const handleSubmit = async (values: any, { resetForm }: any) => {
    try {
      const processedValues = {
        ...values,
      };

      const result: any = id
        ? await editParty({ id, payLoad: processedValues }).unwrap()
        : await createParty(processedValues).unwrap();

      if (result?.success) {
        showToast.success(id ? "Party updated successfully!" : "Party created successfully!");
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
      const result: any = await getPartyData({ id: parseInt(id) }).unwrap();
      if (result?.data) {
        const data = result.data;
        const baseValues = getInitialFormValues(Schema, data);
        
        if (data.country) {
          await loadStates(data.country);
          if (data.state) {
            await loadCities(data.state);
          }
        }
        
        setInitialValues(baseValues);
      }
    } catch (e) {
      console.error("Fetch failed:", e);
    }
  };

  const handleFieldChange = (name: string, value: any) => {
    if (name === 'country') {
      setInitialValues((prev: any) => ({ ...prev, [name]: value, state: '', city: '' }));
      if (value) {
        loadStates(value);
      }
    } else if (name === 'state') {
      setInitialValues((prev: any) => ({ ...prev, [name]: value, city: '' }));
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
      loadCountries();
      
      if (id) {
        handleGetMaster(id);
      } else {
        const defaultValues = getInitialFormValues(Schema, null, 'create');
        defaultValues.country = "1"; 
        setInitialValues(defaultValues);
        loadStates("1");
      }
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
    />
  );
}
