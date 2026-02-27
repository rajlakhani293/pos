"use client"

import React, { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { OTPVerification } from "@/components/otp-verification"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { auth } from "@/lib/api/auth"

const SignupForm = ({ className, ...props }: React.ComponentProps<"div">) => {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)

  // State for OTP flow
  const [mobileNumber, setMobileNumber] = useState("")
  const [otpAttempts, setOtpAttempts] = useState(0)
  const [otp, setOtp] = useState("")
  const [isBlocked] = useState(false)
  const [registrationToken, setRegistrationToken] = useState("")

  const canRequestOTP = !isBlocked && otpAttempts < 3
  const incrementAttempts = () => setOtpAttempts(prev => prev + 1)

  const [sendOtpApi] = auth.useSendOtpMutation();
  const [verifyOtpApi] = auth.useVerifyOtpMutation();

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
      const response = await sendOtpApi({ phone_number: `+91${mobile}` }).unwrap()

      if (response.code === 200) {
        setMobileNumber(mobile) // Update mobile number state
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
  }, [canRequestOTP, incrementAttempts, sendOtpApi])

  // Handle form submission for mobile number (Step 1)
  const handleSendOTPForm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const mobile = (e.currentTarget.elements.namedItem('mobile') as HTMLInputElement)?.value || ''

    const success = await sendOTP(mobile, true)
    if (success) {
      setStep(2)
    }
  }


  const verifyOTP = useCallback(async (otp: string): Promise<string | null> => {
    try {
      const result = await verifyOtpApi({
        phone_number: `+91${mobileNumber}`,
        otp_code: otp
      }).unwrap()

      if (result.code === 200) {
        const token = result.data.registration_token
        setRegistrationToken(token)
        return token
      } else {
        toast.error(result.message || "OTP verification failed")
        return null
      }
    } catch (error: any) {
      toast.error(error.data?.message || "OTP verification failed. Try again.")
      return null
    }
  }, [mobileNumber, verifyOtpApi])


  // Handle back button from OTP screen
  const handleBackToMobile = () => {
    setStep(1)
    setMobileNumber("")
  }

  return (
    <Card className={className} {...props}>
      <CardContent className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Create Your Account</h2>
        </div>

        {/* STEP 1: Mobile Number */}
        {step === 1 && (
          <form className="space-y-6" onSubmit={handleSendOTPForm}>
            <FieldGroup>
              <Field>
                <Label htmlFor="mobile">Mobile Number</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">+91</span>
                  <Input
                    id="mobile"
                    name="mobile"
                    type="tel"
                    placeholder="Enter 10-digit mobile number"
                    maxLength={10}
                    pattern="[6-9][0-9]{9}"
                    required
                    disabled={isLoading}
                    value={mobileNumber}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMobileNumber(e.target.value)}
                    className="pl-12"
                  />
                </div>
                <FieldDescription>
                  We'll send a verification code to this number
                </FieldDescription>
              </Field>
              <Button type="submit" disabled={isLoading || mobileNumber.length !== 10 || !canRequestOTP} className="w-full">
                {isLoading ? "Sending OTP..." : isBlocked ? "OTP Limit Reached" : "Send Verification Code"}
              </Button>
            </FieldGroup>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <a href="/login" className="text-primary hover:underline font-medium">
                  Sign In
                </a>
              </p>
            </div>
          </form>
        )}

        {/* STEP 2: Enter OTP */}
        {step === 2 && (
          <OTPVerification
            mobileNumber={mobileNumber}
            onBack={handleBackToMobile}
            onSuccess={(token) => {
              if (token) {
                toast.success("OTP Verified!")
                router.push(`/register?mobile=${mobileNumber}&token=${token}`)
              } else {
                toast.error("Registration token not available")
              }
            }}
            onSendOTP={sendOTP}
            onVerifyOTP={verifyOTP}
            currentAttempts={otpAttempts}
            isBlocked={isBlocked}
            demoOtp={otp}
          />
        )}

      </CardContent>
    </Card>
  )
}

export default SignupForm;