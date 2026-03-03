"use client"

import React from "react"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Field, FieldError, FieldLabel } from "./field"
import { ArrowRightIcon, CirclePlusIcon } from "@/components/AppIcon"

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
  onAddNew?: () => void
  addNewLabel?: string
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
  onAddNew,
  addNewLabel
}: UniFieldSelectProps) => {
    const handleValueChange = (val: string) => {
      if (val === "add_new" && onAddNew) {
        onAddNew()
      } else if (onValueChange) {
        onValueChange(val)
      }
    }

    return (
     <Field data-invalid={error ? true : undefined} className={cn("w-full gap-1", containerClassName)}>
      {label && <FieldLabel>{label} {required && <span className="text-red-500">*</span>}</FieldLabel>}
      <Select value={value} onValueChange={handleValueChange}>
        <SelectTrigger aria-invalid={error ? true : undefined}>
          <SelectValue placeholder={placeholder || "Select an option"} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {children}
            {onAddNew && (
             <div className="border-t">
              <SelectItem value="add_new" className="font-medium flex items-center justify-center cursor-pointer rounded-b-md rounded-t-none">
                <div className="flex items-center w-full justify-center gap-2">
                  <CirclePlusIcon className="w-4 h-4" />
                  {addNewLabel || `Add New ${label || ''}`}
                  <ArrowRightIcon className="size-3" />
                </div>
              </SelectItem></div>
            )}
          </SelectGroup>
        </SelectContent>
      </Select>
      {error && <FieldError>{error}</FieldError>}
      {validationError && <FieldError>{validationError}</FieldError>}
    </Field>
    )
  }
