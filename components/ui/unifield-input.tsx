"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Textarea } from "./textarea"
import { Field, FieldError, FieldLabel } from "./field"

interface UniFieldInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix' | 'suffix'> {
  label?: string
  error?: string
  containerClassName?: string
  prefix?: React.ReactNode
  suffix?: React.ReactNode
  as?: 'input' | 'textarea'
  rows?: number
}

export const UniFieldInput = React.forwardRef<HTMLInputElement, UniFieldInputProps>(
  ({ 
    label, 
    error, 
    containerClassName,
    className,
    id,
    prefix,
    suffix,
    as = 'input',
    rows = 3,
    onChange,
    ...props 
  }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    
    return (
      <Field data-invalid={error ? true : undefined} className={cn("gap-1", containerClassName)}>
        {label && (
          <FieldLabel htmlFor={inputId}>
            {label}
            {props.required && <span className="text-red-500">*</span>}
          </FieldLabel>
        )}
        <div className="relative">
          {prefix && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground z-10">
              {prefix}
            </div>
          )}
          {as === 'textarea' ? (
            <Textarea
              ref={ref as React.Ref<HTMLTextAreaElement>}
              id={inputId}
              rows={rows}
              className={cn(
                error && "border-red-500 focus:border-red-500 focus:ring-red-500",
                className
              )}
              aria-invalid={error ? true : undefined}
              value={props.value}
              placeholder={props.placeholder}
              disabled={props.disabled}
              required={props.required}
              onChange={onChange as any}
            />
          ) : (
          <Input
              ref={ref}
              id={inputId}
              className={cn(
                "h-10 border-2 bg-white",
                error && "border-red-500 focus:border-red-500 focus:ring-red-500",
                prefix && "pl-12",
                suffix && "pr-16", // Increased padding to account for suffix section
                props.type === 'number' && "[&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none",
                className
              )}
              aria-invalid={error ? true : undefined}
              {...props}
              onChange={onChange as any}
            />
          )}
          {suffix && (
            <div className="absolute right-[2px] top-[2px] bottom-[2px] flex items-center justify-center px-3 text-sm text-muted-foreground z-10 border-l bg-muted/30 rounded-r-[calc(var(--radius)-2px)]">
              {suffix}
            </div>
          )}
        </div>
        {error && <FieldError>{error}</FieldError>}
      </Field>
    )
  }
)

UniFieldInput.displayName = "UniFieldInput"
