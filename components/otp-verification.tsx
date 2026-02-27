"use client"

import { useState, useEffect } from "react"
import toast from "react-hot-toast"
import { Button } from "@/components/ui/button"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { MdEdit, MdOutlineDangerous } from "react-icons/md"
import { NEXT_OTP_ATTEMPT_LIMIT, NEXT_OTP_TIMER_SECONDS } from "../lib/utils/constants"

const OTP_ATTEMPT_LIMIT = NEXT_OTP_ATTEMPT_LIMIT;
const OTP_TIMER_SECONDS = NEXT_OTP_TIMER_SECONDS;

interface OTPVerificationProps {
  mobileNumber: string
  onBack: () => void
  className?: string
  onSendOTP: (mobile: string, showToast?: boolean) => Promise<boolean>
  onSuccess: (token: string) => void
  onVerifyOTP: (otp: string) => Promise<string | null>
  currentAttempts: number
  isBlocked: boolean
  demoOtp?: string
}

export function OTPVerification({
  mobileNumber,
  onBack,
  onSuccess,
  className,
  onSendOTP,
  onVerifyOTP,
  currentAttempts,
  isBlocked,
  demoOtp
}: OTPVerificationProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [otpError, setOtpError] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [timer, setTimer] = useState(0)
  const [canResend, setCanResend] = useState(true)
  const [otpValue, setOtpValue] = useState("")
  const [devOtp, setDevOtp] = useState(demoOtp || "123456")

  useEffect(() => {
    if (demoOtp) {
      setDevOtp(demoOtp)
    }
  }, [demoOtp])

  useEffect(() => {
    if (timer <= 0) {
      setCanResend(true)
      return
    }

    const interval = setInterval(() => {
      setTimer(prev => prev - 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [timer])


  const resendOtp = async () => {
    if (isBlocked) {
      toast.error("You are blocked from requesting more OTPs.")
      return
    }

    if (currentAttempts >= OTP_ATTEMPT_LIMIT) {
      toast.error("OTP limit reached. Please try later.")
      setCanResend(false)
      return
    }

    if (timer > 0) {
      toast.error(`Please wait ${timer}s`)
      return
    }

    setCanResend(false)
    setTimer(OTP_TIMER_SECONDS)

    const success = await onSendOTP(mobileNumber, true)

    if (!success) {
      setTimer(0)
    }
  }


  const handleVerifyOTP = async (otp: string) => {
    if (otp.length !== 6) return

    setIsLoading(true)
    setOtpError(false)

    const token = await onVerifyOTP(otp)

    if (token) {
      setIsSuccess(true)
      toast.success("OTP Verified Successfully!")
      setTimeout(() => {
        onSuccess(token)
      }, 500)
    } else {
      setOtpError(true)
    }
    setIsLoading(false)
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Dev/Demo OTP Display */}
      {devOtp && (
        <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-600 dark:text-blue-400">
            Demo OTP: <strong>{devOtp}</strong>
          </p>
        </div>
      )}

      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold">Enter verification code</h2>
        <div className="flex items-center justify-center gap-2 mt-2">
          <p className="text-base text-gray-700 dark:text-gray-300">
            We sent a 6-digit code to
          </p>
          <p className="text-base font-medium text-gray-900 dark:text-white">
            +91 {mobileNumber}
          </p>
          <button
            type="button"
            onClick={onBack}
            disabled={isBlocked || isLoading}
            className="text-black hover:text-black/80 hover:cursor-pointer transition disabled:opacity-50 dark:text-white dark:hover:text-gray-300"
            aria-label="Edit Mobile Number"
          >
            <MdEdit className="size-4" />
          </button>
        </div>
      </div>

      {/* OTP Input */}
      <div className="flex justify-center">
        <InputOTP
          maxLength={6}
          id="otp"
          required
          className="gap-3"
          value={otpValue}
          onChange={(value) => {
            setOtpValue(value)
            setOtpError(false) // Clear error on change
            setIsSuccess(false) // Clear success on change
          }}
          onComplete={handleVerifyOTP} // Auto-verify on completion
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} className={`h-12 w-12 text-xl ${otpError ? 'border-red-500 text-red-500' : isSuccess ? 'border-green-500' : ''
              }`} />
            <InputOTPSlot index={1} className={`h-12 w-12 text-xl ${otpError ? 'border-red-500 text-red-500' : isSuccess ? 'border-green-500' : ''
              }`} />
            <InputOTPSlot index={2} className={`h-12 w-12 text-xl ${otpError ? 'border-red-500 text-red-500' : isSuccess ? 'border-green-500' : ''
              }`} />
            <InputOTPSlot index={3} className={`h-12 w-12 text-xl ${otpError ? 'border-red-500 text-red-500' : isSuccess ? 'border-green-500' : ''
              }`} />
            <InputOTPSlot index={4} className={`h-12 w-12 text-xl ${otpError ? 'border-red-500 text-red-500' : isSuccess ? 'border-green-500' : ''
              }`} />
            <InputOTPSlot index={5} className={`h-12 w-12 text-xl ${otpError ? 'border-red-500 text-red-500' : isSuccess ? 'border-green-500' : ''
              }`} />
          </InputOTPGroup>
        </InputOTP>
      </div>

      {/* Error State */}
      {otpError && (
        <p className="text-sm text-center text-red-600 dark:text-red-400">
          Invalid or expired OTP. Please try again.
        </p>
      )}

      {/* Action Buttons & Resend Logic */}
      <div className="space-y-4">
        {!isBlocked ? (
          <>
            <Button
              onClick={() => handleVerifyOTP(otpValue)}
              disabled={isLoading || isBlocked || otpValue.length !== 6 || currentAttempts >= OTP_ATTEMPT_LIMIT}
              className="w-full"
            >
              {isLoading ? "Verifying..." : "Verify & Continue"}
            </Button>

            <div className="space-y-4">
              {canResend ? (
                currentAttempts >= OTP_ATTEMPT_LIMIT ? (
                  <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg text-center">
                    <MdOutlineDangerous className="size-10 text-orange-500 mx-auto mb-3" />
                    <p className="text-sm text-orange-600 dark:text-orange-400">
                      OTP limit reached attempts. Please try later.
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-1 text-center">
                    <p className="text-sm text-muted-foreground">
                      Didn't receive the code?
                    </p>
                    <button
                      type="button"
                      onClick={resendOtp}
                      disabled={isLoading}
                      className="text-sm text-primary hover:text-primary/80 font-medium transition underline hover:cursor-pointer disabled:opacity-50"
                    >
                      Resend OTP
                    </button>
                  </div>
                )
              ) : (
                <div className="flex items-center justify-center gap-1 text-center">
                  <p className="text-sm text-muted-foreground">
                    Didn't receive the code?
                  </p>
                  <span className="text-sm text-muted-foreground">
                    Resend in {timer}s
                  </span>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-center">
            <MdOutlineDangerous className="size-10 text-red-500 mx-auto mb-3" />
            <p className="text-sm text-red-600 dark:text-red-400">
              You've exceeded the OTP limit ({OTP_ATTEMPT_LIMIT} attempts). Please contact support.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}