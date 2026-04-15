export const NEXT_OTP_ATTEMPT_LIMIT = 3
export const NEXT_OTP_TIMER_SECONDS = 5


export const businessTypeOptions = [
    { value: "1", label: "Retail / Shops" },
    { value: "2", label: "Wholesale / Distribution" },
    { value: "3", label: "E-commerce / Online Selling" },
    { value: "4", label: "Manufacturing" },
    { value: "5", label: "Trading" },
    { value: "6", label: "Export / Import" },
    { value: "7", label: "Services / Consulting" },
    { value: "8", label: "IT & Software" },
    { value: "9", label: "Construction / Real Estate" },
    { value: "10", label: "Healthcare / Medical / Pharma" },
    { value: "11", label: "Transport & Logistics" },
    { value: "12", label: "Agriculture" },
    { value: "13", label: "Others" },
  ]

export const PAYMENT_MODE_CHOICES = [
    { value: 1, label: 'Cash' },
    { value: 2, label: 'UPI' },
    { value: 3, label: 'Partial' },
    { value: 4, label: 'Bank Transfer' },
  ];

export const MOVEMENT_LABELS: Record<string, string> = {
  OPENING_STOCK: "Opening Stock",
  PURCHASE: "Purchase",
  SALES_RETURN: "Sales Return",
  TRANSFER_IN: "Transfer In",
  ADJUSTMENT_IN: "Adjustment In",
  SALE: "Sale",
  PURCHASE_RETURN: "Purchase Return",
  TRANSFER_OUT: "Transfer Out",
  DAMAGE: "Damage",
  ADJUSTMENT_OUT: "Adjustment Out",
  SAMPLE_GIVEN: "Sample Given",
  INTERNAL_USE: "Internal Use",
  THEFT_LOSS: "Theft / Loss",
  DAMAGE_EXPIRED: "Damage / Expired",
};