"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import * as yup from "yup";
import { settings } from "@/lib/api/settings";
import { showToast } from "@/lib/toast";
import ImageUpload from "@/components/ImageUpload";
import { Button } from "@/components/ui/button";
import { UniFieldInput, Spinner } from "@/components/index";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { ViewIcon, HideIcon, CheckCircleIcon, CancelIcon, RegCircleIcon } from "@/components/AppIcon";
import CustomPopup from "@/components/ui/custom-popup";
import { useSession } from "@/hooks/useSession";

const validationSchema = yup.object().shape({
  user_name: yup.string().required("User Name is required"),
  email: yup.string().email("Invalid email format").required("Email is required"),
  phone_number: yup.string().required("Phone Number is required"),
});

const passwordValidationSchema = yup.object().shape({
  phone_number: yup.string().required("Phone Number is required"),
  otp_code: yup.string().required("OTP Code is required").length(6, "OTP must be 6 digits"),
  new_password: yup.string().required("New Password is required"),
  confirm_password: yup.string().required("Confirm Password is required").oneOf([yup.ref('new_password')], "Passwords must match"),
});

const passwordRequirements = {
  minLength: {
    test: (password: string) => password.length >= 8,
    label: 'Must be at least 8 characters'
  },
  hasUpperCase: {
    test: (password: string) => /[A-Z]/.test(password),
    label: 'Must contain one uppercase letter'
  },
  hasNumber: {
    test: (password: string) => /[0-9]/.test(password),
    label: 'Must contain one number'
  },
  hasSpecialChar: {
    test: (password: string) => /[!@#$%^&*(),.?":{}|<>]/.test(password),
    label: 'Must contain one special character'
  }
};

const Users = () => {
  const { user } = useSession();
  const searchParams = useSearchParams();
  const userId = user?.id?.toString();
  const hasPassword = user?.has_password;
  const [editUser] = settings.useEditUserMutation();
  const [getUserData] = settings.useGetUserByIdMutation();
  const [sendPasswordOtp] = settings.useSendPasswordOtpMutation();
  const [updateUserPassword] = settings.useUpdateUserPasswordMutation();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState<boolean>(false);
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false);
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [otpEntered, setOtpEntered] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [passwordAttempted, setPasswordAttempted] = useState<boolean>(false);
  const [passwordStrength, setPasswordStrength] = useState({
    minLength: false,
    hasUpperCase: false,
    hasNumber: false,
    hasSpecialChar: false
  });
  const [profileImage, setProfileImage] = useState<File | string | null>(null);

  const [formData, setFormData] = useState<any>({
    user_name: "",
    email: "",
    phone_number: "",
  });

  const [passwordData, setPasswordData] = useState<any>({
    phone_number: "",
    otp_code: "",
    new_password: "",
    confirm_password: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const lastLoadedUserId = useRef<string | undefined>(undefined);

  /** Submit handler for user profile */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate with Yup
      await validationSchema.validate(formData, { abortEarly: false });
      setErrors({});

      const formDataObj = new FormData();
      
      formDataObj.append('user_name', formData.user_name);
      formDataObj.append('email', formData.email);
      const fullPhoneNumber = formData.phone_number ? `+91${formData.phone_number}` : "";
      formDataObj.append('phone_number', fullPhoneNumber);
      
      if (profileImage instanceof File) {
        formDataObj.append('profile_image', profileImage);
      } else if (profileImage === null) {
        formDataObj.append('profile_image', null as any);
      }

      const result: any = await editUser({ id: userId, payLoad: formDataObj }).unwrap();

      if (result?.success) {
        showToast.success("User updated successfully!");
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

  /** Submit handler for password update */
  const handlePasswordUpdate = async () => {
    setIsUpdatingPassword(true);

    try {
      // Validate with Yup
      await passwordValidationSchema.validate(passwordData, { abortEarly: false });
      setPasswordErrors({});

      // Send only otp_code and new_password
      const payload = {
        otp_code: passwordData.otp_code,
        new_password: passwordData.new_password,
      };

      const result: any = await updateUserPassword(payload).unwrap();

      if (result?.success) {
        showToast.success("Password updated successfully!");
        setIsResetModalOpen(false);
        setOtpSent(false);
        setOtpEntered(false);
        setPasswordData({
          phone_number: "",
          otp_code: "",
          new_password: "",
          confirm_password: "",
        });
      }
    } catch (error: any) {
      if (error.name === 'ValidationError') {
        const newErrors: Record<string, string> = {};
        error.inner.forEach((err: any) => {
          newErrors[err.path] = err.message;
        });
        setPasswordErrors(newErrors);
      } else {
        showToast.error(error);
      }
    }
    setIsUpdatingPassword(false);
  };

  /** Open reset password modal */
  const handleOpenResetModal = async () => {
    setOtpSent(false);
    setOtpEntered(false);
    const fullPhoneNumber = formData.phone_number ? `+91${formData.phone_number}` : "";
    setPasswordData({
      phone_number: fullPhoneNumber,
      otp_code: "",
      new_password: "",
      confirm_password: "",
    });
    setIsResetModalOpen(true);

    // Auto-send OTP
    setIsSendingOtp(true);
    try {
      const result: any = await sendPasswordOtp({ phone_number: fullPhoneNumber }).unwrap();
      if (result?.success) {
        showToast.success(result.message);
        setOtpSent(true);
      }
    } catch (error: any) {
      // showToast.error(error);
    }
    setIsSendingOtp(false);
  };


  const handleGetMaster = async (id: any) => {
    try {
      setIsLoading(true);
      const result: any = await getUserData({ id: parseInt(id) }).unwrap();
      if (result?.data) {
        const data = result.data;
        
        let phoneNumber = data.phone_number || "";
        if (data.phone_number && data.phone_number.startsWith("+")) {
          phoneNumber = data.phone_number.substring(3);
        }

        setFormData({
          user_name: data.user_name || "",
          email: data.email || "",
          phone_number: phoneNumber,
        });
        
        if (data.profile_image) {
          setProfileImage(data.profile_image);
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
  };

  const handlePasswordFieldChange = (name: string, value: any) => {
    setPasswordData((prev: any) => ({ ...prev, [name]: value }));
    setPasswordErrors((prev: any) => ({ ...prev, [name]: "" }));

    // Check if OTP is complete (6 digits)
    if (name === 'otp_code' && value.length === 6) {
      setOtpEntered(true);
    }
  };

  // Check password strength whenever password changes
  useEffect(() => {
    const strength = {
      minLength: passwordRequirements.minLength.test(passwordData.new_password),
      hasUpperCase: passwordRequirements.hasUpperCase.test(passwordData.new_password),
      hasNumber: passwordRequirements.hasNumber.test(passwordData.new_password),
      hasSpecialChar: passwordRequirements.hasSpecialChar.test(passwordData.new_password)
    };
    setPasswordStrength(strength);
  }, [passwordData.new_password]);

  useEffect(() => {
    // Only load if userId has changed
    if (userId === lastLoadedUserId.current) return;
    lastLoadedUserId.current = userId;

    setIsLoading(true);
    if (userId) {
      handleGetMaster(userId);
    } else {
      setIsLoading(false);
    }
  }, [userId]);

  // Check for password modal trigger from URL
  useEffect(() => {
    const openPasswordModal = searchParams.get('openPasswordModal');
    if (openPasswordModal === 'true' && formData.phone_number) {
      handleOpenResetModal();
    }
  }, [searchParams, formData.phone_number]);

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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Settings</h1>
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={handleOpenResetModal}>
            {hasPassword ? "Reset Password" : "Set Password"}
          </Button>
          <Button type="submit" disabled={isSubmitting} onClick={(e) => {
            e.preventDefault();
            handleSubmit(e);
          }}>
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
      </div>
      
      {/* Profile Section */}
      <div className="mb-8">
        {/* <h2 className="text-lg font-semibold mb-4">Profile Information</h2> */}
        <form onSubmit={handleSubmit} className="space-y-4 max-w-4xl">
          <div className="grid grid-cols-[200px_1fr] gap-4 items-start">
            <label className="text-sm font-medium text-right pt-2">Profile Image</label>
            <ImageUpload
              value={profileImage}
              onChange={setProfileImage}
            />
          </div>

          <div className="grid grid-cols-[200px_1fr] gap-4 items-center">
            <label className="text-sm font-medium text-right">User Name <span className="text-red-500">*</span></label>
            <UniFieldInput
              placeholder="e.g. John Doe"
              value={formData.user_name}
              onChange={(e) => handleFieldChange('user_name', e.target.value)}
              error={errors.user_name}
            />
          </div>

          <div className="grid grid-cols-[200px_1fr] gap-4 items-center">
            <label className="text-sm font-medium text-right">Email <span className="text-red-500">*</span></label>
            <UniFieldInput
              placeholder="e.g. john@example.com"
              type="email"
              value={formData.email}
              onChange={(e) => handleFieldChange('email', e.target.value)}
              error={errors.email}
            />
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
        </form>
      </div>

      {/* Reset Password Modal */}
      <CustomPopup
        title={hasPassword ? "Reset Password" : "Set Password"}
        open={isResetModalOpen}
        onOpenChange={(open) => setIsResetModalOpen(open)}
        onSave={otpEntered ? handlePasswordUpdate : undefined}
        onClose={() => setIsResetModalOpen(false)}
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setIsResetModalOpen(false)}>
              Cancel
            </Button>
            {otpEntered && (
              <Button type="button" onClick={handlePasswordUpdate} disabled={isUpdatingPassword}>
                {isUpdatingPassword ? (
                  <span className="flex items-center gap-2">
                    <Spinner />
                    Updating...
                  </span>
                ) : (
                  "Update Password"
                )}
              </Button>
            )}
          </>
        }
      >
        <div className="space-y-4">
          {!otpEntered && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone Number</label>
                <div className="flex items-center gap-2">
                  <UniFieldInput
                    value={passwordData.phone_number}
                    disabled
                    prefix="+91"
                    className="flex-1"
                  />
                  {isSendingOtp && (
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Spinner />
                      Sending OTP...
                    </span>
                  )}
                </div>
              </div>

              {otpSent && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">OTP Code <span className="text-red-500">*</span></label>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={passwordData.otp_code}
                      onChange={(value) => {
                        handlePasswordFieldChange('otp_code', value);
                      }}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} className="h-12 w-12 text-xl" />
                        <InputOTPSlot index={1} className="h-12 w-12 text-xl" />
                        <InputOTPSlot index={2} className="h-12 w-12 text-xl" />
                        <InputOTPSlot index={3} className="h-12 w-12 text-xl" />
                        <InputOTPSlot index={4} className="h-12 w-12 text-xl" />
                        <InputOTPSlot index={5} className="h-12 w-12 text-xl" />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  {passwordErrors.otp_code && (
                    <p className="text-red-500 text-sm text-center">{passwordErrors.otp_code}</p>
                  )}
                </div>
              )}
            </>
          )}

          {otpEntered && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">New Password <span className="text-red-500">*</span></label>
                <UniFieldInput
                  placeholder="Enter New Password"
                  type={showPassword ? "text" : "password"}
                  value={passwordData.new_password}
                  onChange={(e) => {
                    handlePasswordFieldChange('new_password', e.target.value);
                    setPasswordAttempted(true);
                  }}
                  error={passwordErrors.new_password}
                  suffix={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <HideIcon className="size-5" />
                      ) : (
                        <ViewIcon className="size-5" />
                      )}
                    </button>
                  }
                />
                <div className="space-y-1.5 p-2">
                  {Object.keys(passwordRequirements).map((key) => {
                    const requirement = passwordRequirements[key as keyof typeof passwordRequirements];
                    const isFulfilled = passwordStrength?.[key as keyof typeof passwordStrength];
                    const showAsError = passwordAttempted && !isFulfilled;

                    return (
                      <div key={key} className="flex items-center gap-2 text-xs">
                        <span className={`flex items-center gap-1.5 ${isFulfilled
                            ? 'text-green-600 dark:text-green-500'
                            : showAsError
                              ? 'text-red-500 dark:text-red-400'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}>
                          {isFulfilled ? (
                            <CheckCircleIcon className="size-4" />
                          ) : showAsError ? (
                            <CancelIcon className="size-4" />
                          ) : (
                            <RegCircleIcon className="size-4" />
                          )}
                          {requirement.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Confirm Password <span className="text-red-500">*</span></label>
                <UniFieldInput
                  placeholder="Confirm New Password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={passwordData.confirm_password}
                  onChange={(e) => handlePasswordFieldChange('confirm_password', e.target.value)}
                  error={passwordErrors.confirm_password}
                  suffix={
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? (
                        <HideIcon className="size-5" />
                      ) : (
                        <ViewIcon className="size-5" />
                      )}
                    </button>
                  }
                />
              </div>
            </>
          )}
        </div>
      </CustomPopup>
    </>
  );
};

export default Users;
