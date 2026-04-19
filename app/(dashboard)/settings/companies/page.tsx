"use client"

import { useState, useEffect } from "react"
import * as yup from "yup";
import { settings } from "@/lib/api/settings";
import { locations } from "@/lib/api/locations";
import { showToast } from "@/lib/toast";
import { businessTypeOptions } from "@/lib/utils/constants";
import ImageUpload from "@/components/ImageUpload";
import { Button } from "@/components/ui/button";
import { UniFieldInput, UniFieldSelect, SelectItem, Spinner } from "@/components/index";
import { useSession } from "@/hooks/useSession";

const validationSchema = yup.object().shape({
  company_name: yup.string().required("Company Name is required"),
  phone_number: yup.string().required("Phone Number is required"),
  country: yup.string().required("Country is required"),
  state: yup.string().required("State is required"),
  city: yup.string().required("City is required"),
});

const Companies = () => {
  const { company } = useSession();
  const companyId = company?.id?.toString();
  const [editCompany] = settings.useEditCompanyMutation();
  const [getCompanyData] = settings.useGetCompanyByIdMutation();
  
  // Location API hooks
  const [getCountries] = locations.useGetCountriesMutation();
  const [getStates] = locations.useGetStatesMutation();
  const [getCities] = locations.useGetCitiesMutation();

  const [countries, setCountries] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [logoImage, setLogoImage] = useState<File | string | null>(null);

  const [formData, setFormData] = useState<any>({
    company_name: "",
    business_type_id: "",
    phone_number: "",
    email: "",
    tax_no: "",
    pan_no: "",
    address: "",
    country: "1",
    state: "",
    city: "",
    pincode: "",
    website_url: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  /** Submit handler */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate with Yup
      await validationSchema.validate(formData, { abortEarly: false });
      setErrors({});

      const formDataObj = new FormData();
      
      formDataObj.append('company_name', formData.company_name);
      if (formData.business_type_id) formDataObj.append('business_type_id', parseInt(formData.business_type_id).toString());
      const fullPhoneNumber = formData.phone_number ? `+91${formData.phone_number}` : "";
      formDataObj.append('phone_number', fullPhoneNumber);
      if (formData.email) formDataObj.append('email', formData.email);
      if (formData.tax_no) formDataObj.append('tax_no', formData.tax_no);
      if (formData.pan_no) formDataObj.append('pan_no', formData.pan_no);
      if (formData.address) formDataObj.append('address', formData.address);
      formDataObj.append('country', parseInt(formData.country).toString());
      formDataObj.append('state', parseInt(formData.state).toString());
      formDataObj.append('city', parseInt(formData.city).toString());
      if (formData.pincode) formDataObj.append('pincode', formData.pincode.toString() || "");
      if (formData.website_url) formDataObj.append('website_url', formData.website_url);
      
      if (logoImage instanceof File) {
        formDataObj.append('logo_image', logoImage);
      } else if (logoImage === null) {
        formDataObj.append('logo_image', null as any);
      }

      const result: any = await editCompany({ id: companyId, payLoad: formDataObj }).unwrap();

      if (result?.success) {
        showToast.success("Company updated successfully!");
      }
    } catch (error: any) {
      if (error.name === 'ValidationError') {
        const newErrors: Record<string, string> = {};
        error.inner.forEach((err: any) => {
          newErrors[err.path] = err.message;
        });
        setErrors(newErrors);
      } else {
        showToast.error(error);
      }
    }
    setIsSubmitting(false);
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
      const result: any = await getCompanyData({ id: parseInt(id) }).unwrap();
      if (result?.data) {
        const data = result.data;
        
        // Load states based on country_id
        if (data.country_id) {
          await loadStates(data.country_id);
          // Load cities based on state_id
          if (data.state_id) {
            await loadCities(data.state_id);
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
        
        let phoneNumber = data.phone_number || "";
        if (data.phone_number && data.phone_number.startsWith("+")) {
          phoneNumber = data.phone_number.substring(3);
        }

        setFormData({
          company_name: data.company_name || "",
          business_type_id: data.business_type_id?.toString() || "",
          phone_number: phoneNumber,
          email: data.email || "",
          tax_no: data.tax_no || "",
          pan_no: data.pan_no || "",
          address: data.address || "",
          country: data.country_id?.toString() || "1",
          state: data.state_id?.toString() || "",
          city: data.city_id?.toString() || "",
          pincode: data.pincode?.toString() || "",
          website_url: data.website_url || "",
        });
        
        if (data.logo_image) {
          setLogoImage(data.logo_image);
        }
      }
    } catch (e) {
      console.error("Fetch failed:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldChange = (name: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [name]: value }));
    setErrors((prev: any) => ({ ...prev, [name]: "" }));

    if (name === 'country' && value) {
      setFormData((prev: any) => ({ ...prev, state: "", city: "" }));
      loadStates(value);
    } else if (name === 'state' && value) {
      setFormData((prev: any) => ({ ...prev, city: "" }));
      loadCities(value);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    loadCountries().finally(() => {
      if (companyId) {
        handleGetMaster(companyId);
      } else {
        setIsLoading(false);
      }
    });
  }, [companyId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-row items-center gap-2">
          <Spinner className="text-base" />
          <span className="text-base text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-bold mb-6">Company Settings</h1>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-4xl h-full">
        <div className="grid grid-cols-[200px_1fr] gap-4 items-start">
          <label className="text-sm font-medium text-right pt-2">Company Logo</label>
          <ImageUpload
            value={logoImage}
            onChange={setLogoImage}
          />
        </div>

        <div className="grid grid-cols-[200px_1fr] gap-4 items-center">
          <label className="text-sm font-medium text-right">Company Name <span className="text-red-500">*</span></label>
          <UniFieldInput
            placeholder="e.g. ABC Corporation"
            value={formData.company_name}
            onChange={(e) => handleFieldChange('company_name', e.target.value)}
            error={errors.company_name}
          />
        </div>

        <div className="grid grid-cols-[200px_1fr] gap-4 items-center">
          <label className="text-sm font-medium text-right">Business Type</label>
          <UniFieldSelect
            placeholder="Select Business Type"
            value={formData.business_type_id}
            onValueChange={(value) => handleFieldChange('business_type_id', value)}
            error={errors.business_type_id}
          >
            {businessTypeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </UniFieldSelect>
        </div>

        <div className="grid grid-cols-[200px_1fr] gap-4 items-center">
          <label className="text-sm font-medium text-right">Phone Number <span className="text-red-500">*</span></label>
          <UniFieldInput
            placeholder="Enter Your Number"
            type="number"
            value={formData.phone_number}
            onChange={(e) => handleFieldChange('phone_number', e.target.value)}
            prefix={"+91"}
            maxLength={10}
            error={errors.phone_number}
          />
        </div>

        <div className="grid grid-cols-[200px_1fr] gap-4 items-center">
          <label className="text-sm font-medium text-right">Email</label>
          <UniFieldInput
            placeholder="e.g. company@example.com"
            type="email"
            value={formData.email}
            onChange={(e) => handleFieldChange('email', e.target.value)}
            error={errors.email}
          />
        </div>

        <div className="grid grid-cols-[200px_1fr] gap-4 items-center">
          <label className="text-sm font-medium text-right">Tax Number</label>
          <UniFieldInput
            placeholder="e.g. GSTIN12345678"
            value={formData.tax_no}
            onChange={(e) => handleFieldChange('tax_no', e.target.value)}
            error={errors.tax_no}
          />
        </div>

        <div className="grid grid-cols-[200px_1fr] gap-4 items-center">
          <label className="text-sm font-medium text-right">PAN Number</label>
          <UniFieldInput
            placeholder="e.g. ABCDE1234F"
            value={formData.pan_no}
            onChange={(e) => handleFieldChange('pan_no', e.target.value)}
            error={errors.pan_no}
          />
        </div>

        <div className="grid grid-cols-[200px_1fr] gap-4 items-center">
          <label className="text-sm font-medium text-right">Website URL</label>
          <UniFieldInput
            placeholder="e.g. https://www.example.com"
            value={formData.website_url}
            onChange={(e) => handleFieldChange('website_url', e.target.value)}
            error={errors.website_url}
          />
        </div>

        <div className="grid grid-cols-[200px_1fr] gap-4 items-start">
          <label className="text-sm font-medium text-right pt-2">Address</label>
          <UniFieldInput
            as="textarea"
            placeholder="e.g. 123 Main St"
            value={formData.address}
            onChange={(e) => handleFieldChange('address', e.target.value)}
            rows={3}
            error={errors.address}
          />
        </div>

        <div className="grid grid-cols-[200px_1fr] gap-4 items-center">
          <label className="text-sm font-medium text-right">Country <span className="text-red-500">*</span></label>
          <UniFieldSelect
            placeholder="Select Country"
            value={formData.country}
            onValueChange={(value) => handleFieldChange('country', value)}
            error={errors.country}
          >
            {countries.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </UniFieldSelect>
        </div>

        <div className="grid grid-cols-[200px_1fr] gap-4 items-center">
          <label className="text-sm font-medium text-right">State <span className="text-red-500">*</span></label>
          <UniFieldSelect
            placeholder="Select State"
            value={formData.state}
            onValueChange={(value) => handleFieldChange('state', value)}
            error={errors.state}
          >
            {states.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </UniFieldSelect>
        </div>

        <div className="grid grid-cols-[200px_1fr] gap-4 items-center">
          <label className="text-sm font-medium text-right">City <span className="text-red-500">*</span></label>
          <UniFieldSelect
            placeholder="Select City"
            value={formData.city}
            onValueChange={(value) => handleFieldChange('city', value)}
            error={errors.city}
          >
            {cities.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </UniFieldSelect>
        </div>

        <div className="grid grid-cols-[200px_1fr] gap-4 items-center">
          <label className="text-sm font-medium text-right">Pincode</label>
          <UniFieldInput
            placeholder="e.g. 560001"
            type="number"
            value={formData.pincode}
            onChange={(e) => handleFieldChange('pincode', e.target.value)}
            maxLength={6}
            error={errors.pincode}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Spinner />
                Saving...
              </span>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>
    </>
  );
};

export default Companies;
