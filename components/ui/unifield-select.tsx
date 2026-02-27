"use client"

import React from "react"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Field, FieldError, FieldLabel } from "./field"

interface UniFieldSelectProps {
  label?: string
  error?: string
  containerClassName?: string
  value?: string
  onValueChange?: (value: string) => void
  required?: boolean
  placeholder?: string
  children?: React.ReactNode
  validationError?: string
}

export const UniFieldSelect = ({
  label,
  error,
  containerClassName,
  value,
  onValueChange,
  required = false,
  placeholder,
  children,
  validationError,
}: UniFieldSelectProps) => {
    return (
     <Field data-invalid={error ? true : undefined} className={cn("w-full gap-1", containerClassName)}>
      {label && <FieldLabel>{label} {required && <span className="text-red-500">*</span>}</FieldLabel>}
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger aria-invalid={error ? true : undefined}>
          <SelectValue placeholder={placeholder || "Select an option"} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {children}
          </SelectGroup>
        </SelectContent>
      </Select>
      {error && <FieldError>{error}</FieldError>}
      {validationError && <FieldError>{validationError}</FieldError>}
    </Field>
    )
  }
