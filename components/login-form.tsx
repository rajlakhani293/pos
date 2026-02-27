"use client"

import React, { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import Cookies from "js-cookie"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  FieldDescription,
  FieldGroup,
} from "@/components/ui/field"
import { OTPVerification } from "@/components/otp-verification"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { UniFieldInput } from "@/components/ui/unifield-input"
import { auth } from "@/lib/api/auth"
import { useSession } from "@/lib/redux/session-provider"
import { ViewIcon, HideIcon, CheckCircleIcon, CancelIcon, RegCircleIcon } from "./AppIcon"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const { refreshSession } = useSession()
  const [loginMethod, setLoginMethod] = useState<"otp" | "email">("otp")
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  // State for OTP flow
  const [mobileNumber, setMobileNumber] = useState("")
  const [otpAttempts, setOtpAttempts] = useState(0)
  const [otp, setOtp] = useState("")
  const [isBlocked] = useState(false)
  
  const [sendLoginOtpApi] = auth.useSendLoginOtpMutation();
  const [signinApi] = auth.useSigninMutation();
  const canRequestOTP = !isBlocked && otpAttempts < 3
  const incrementAttempts = () => setOtpAttempts(prev => prev + 1)
  
  // State for Email/Password flow
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [passwordAttempted, setPasswordAttempted] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState({
    minLength: false,
    hasUpperCase: false,
    hasNumber: false,
    hasSpecialChar: false
  })

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

  // Check password strength whenever password changes
  React.useEffect(() => {
    const strength = {
      minLength: passwordRequirements.minLength.test(password),
      hasUpperCase: passwordRequirements.hasUpperCase.test(password),
      hasNumber: passwordRequirements.hasNumber.test(password),
      hasSpecialChar: passwordRequirements.hasSpecialChar.test(password)
    };
    setPasswordStrength(strength);
  }, [password])

  // Centralized Send OTP logic
  const sendOTP = useCallback(async (mobile: string, showToast = true): Promise<boolean> => {
    if (!canRequestOTP) {
      if (showToast) toast.error("You have exceeded the OTP limit. Please contact support.")
      return false
    }

    if (!mobile || mobile.length !== 10) {
      if (showToast) toast.error("Please enter a valid 10-digit phone number")
      return false
    }

    setIsLoading(true)
    let success = false
    try {
      const response = await sendLoginOtpApi({ phone_number: `+91${mobile}` }).unwrap()

      if (response.code === 200) {
        setMobileNumber(mobile)
        incrementAttempts()
        setOtp(response.data.otp_code)
        toast.success(response.message)
        success = true
      } else {
        toast.error(response.message || "Failed to send OTP")
      }
    } catch (error: any) {
      if (showToast) toast.error(error.data?.message || "Failed to send OTP. Try again.")
    } finally {
      setIsLoading(false)
    }
    return success
  }, [canRequestOTP, incrementAttempts, sendLoginOtpApi])
  
  // Handle form submission for mobile number (Step 1)
  const handleSendOTPForm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const mobile = (e.currentTarget.elements.namedItem('mobile') as HTMLInputElement)?.value || ''
    
    const success = await sendOTP(mobile, true)
    if (success) {
      setStep(2)
    }
  }
  
  // Reusable function to handle post-authentication tasks
  const handlePostAuth = useCallback(async (token: string, redirectUrl?: string) => {
    // Set cookies
    if (token) {
      Cookies.set("token", token, {
        expires: 1,
        path: "/",
      })
    }
    
    // Refresh session data after successful login
    await refreshSession()
    
    // Handle redirect
    if (redirectUrl) {
      setTimeout(() => {
        router.push(redirectUrl)
      }, 100)
    }
    
    return token
  }, [refreshSession, router])

  // Centralized Verify OTP logic
  const verifyOTP = useCallback(async (otp: string): Promise<string | null> => {
    try {
      const result = await signinApi({
        phone_number: `+91${mobileNumber}`,
        otp_code: otp,
      }).unwrap()

      if (result.code === 200) {
        const token = result?.data?.token;
        
        if (token) {
          await handlePostAuth(token)
          return token
        } else {
          toast.error(result.message || "OTP verification failed")
          return null
        }
      } else {
        toast.error(result.message || "OTP verification failed")
        return null
      }
    } catch (error: any) {
      toast.error(error.data?.message || "OTP verification failed. Try again.")
      return null
    }
  }, [mobileNumber, signinApi, handlePostAuth])

  // Login with email and password
  const loginWithEmailPassword = async () => {
    setPasswordAttempted(true)
    
    if (!email || !password) {
      toast.error("Please enter both email and password")
      return
    }

    // Check if password meets all requirements
    const allRequirementsMet = Object.keys(passwordRequirements).every(
      key => passwordRequirements[key as keyof typeof passwordRequirements].test(password)
    );
    
    if (!allRequirementsMet) {
      toast.error("Please ensure your password meets all requirements")
      return
    }

    setIsLoading(true)
    try {
      const response = await signinApi({
        email: email,
        password: password,
      }).unwrap()

      const token = response?.data?.token

      if (token) {
        toast.success("User Login successfully!")
        await handlePostAuth(token, "/dashboard")
      } else {
        toast.error("Invalid Credentials")
      }
    } catch (error: any) {
      const errorMessage = error?.data?.message || "Something went wrong! Please try again."
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle back button from OTP screen
  const handleBackToMobile = () => {
    setStep(1)
    setMobileNumber("")
  }

  return (
    <Card className={className} {...props}>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Login to your account</h1>
          {step === 1 && (
            <p className="text-muted-foreground text-sm text-balance">
              Choose your preferred login method
            </p>
          )}
        </div>

        {/* Login Method Toggle */}
        {(loginMethod === "otp" && step === 1 || loginMethod === "email") && (
          <div className="relative flex rounded-lg border p-1 bg-muted/50">
            <div 
              className="absolute top-1 bottom-1 bg-primary rounded-md shadow-sm transition-all duration-300 ease-out"
              style={{
                left: loginMethod === "otp" ? "4px" : "50%",
                right: loginMethod === "otp" ? "50%" : "4px",
                width: "calc(50% - 4px)"
              }}
            />
            <button
              type="button"
              onClick={() => {
                setLoginMethod("otp")
                setStep(1)
                setMobileNumber("")
              }}
              className={cn(
                "relative flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all duration-300 ease-out z-10",
                loginMethod === "otp" ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
              disabled={isLoading}
            >
              Phone OTP
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginMethod("email")
                setStep(1)
              }}
              className={cn(
                "relative flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all duration-300 ease-out z-10",
                loginMethod === "email" ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
              disabled={isLoading}
            >
              Email Password
            </button>
          </div>
        )}

        {/* OTP Login Method */}
        {loginMethod === "otp" && (
          <>
            {/* Step 1: Mobile Input */}
            {step === 1 && (
              <form className="space-y-6" onSubmit={handleSendOTPForm}>
                <FieldGroup>
                  <UniFieldInput
                  id="mobile" 
                  name="mobile"
                  type="tel" 
                  label="Mobile Number"
                  placeholder="Enter 10-digit mobile number" 
                  maxLength={10}
                  pattern="[6-9][0-9]{9}"
                  required 
                  disabled={isLoading}
                  value={mobileNumber}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMobileNumber(e.target.value)}
                  prefix="+91"
                />
                <FieldDescription>
                  We'll send a verification code to this number
                </FieldDescription>
                  <Button type="submit" disabled={isLoading || mobileNumber.length !== 10 || !canRequestOTP} className="w-full">
                    {isLoading ? "Sending OTP..." : isBlocked ? "OTP Limit Reached" : "Send Verification Code"}
                  </Button>
                </FieldGroup>
              </form>
            )}

            {/* Step 2: OTP Verification */}
            {step === 2 && (
              <OTPVerification
                mobileNumber={mobileNumber}
                onBack={handleBackToMobile}
                onSuccess={(token) => {
                  if (token) {
                    toast.success("Login successful!")
                    setTimeout(() => router.push("/dashboard"), 1000)
                  } else {
                    toast.error("Login token not available")
                  }
                }}
                onSendOTP={sendOTP}
                onVerifyOTP={verifyOTP}
                currentAttempts={otpAttempts}
                isBlocked={isBlocked}
                demoOtp={otp}
              />
            )}
          </>
        )}

        {/* Email/Password Login Method */}
        {loginMethod === "email" && (
          <form method="post" onSubmit={loginWithEmailPassword} className="space-y-6">
            <FieldGroup>
              <UniFieldInput
                id="email" 
                name="email"
                type="email" 
                label="Email"
                placeholder="m@example.com" 
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                required 
                disabled={isLoading}
              />
              <div>
                <div className="flex items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Password</span>
                  <a
                    href="#"
                    className="ml-auto text-sm underline-offset-4 hover:underline text-primary"
                  >
                    Forgot your password?
                  </a>
                </div>
                <UniFieldInput
                  id="password" 
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="******"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      loginWithEmailPassword()
                    }
                  }}
                  required 
                  disabled={isLoading}
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
              <Button type="button" onClick={loginWithEmailPassword} disabled={isLoading} className="w-full">
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </FieldGroup>
          </form>
        )}

        {/* Sign up link - Hide when in OTP step 2 */}
        {(loginMethod === "email" || (loginMethod === "otp" && step === 1)) && (
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <a href="/signup" className="text-primary hover:underline font-medium">
                Sign up
              </a>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}