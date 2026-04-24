"use client";

import { Button, UniFieldInput } from "@/components/index";
import CustomDrawer from "@/components/CustomDrawer";

type PaymentDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  partyName: string;
  paymentAmount: string;
  paymentNote: string;
  onPaymentAmountChange: (value: string) => void;
  onPaymentNoteChange: (value: string) => void;
  onAddPayment: () => void;
  paymentSaving: boolean;
  amountError?: string;
};

export const PaymentDrawer = ({
  isOpen,
  onClose,
  partyName,
  paymentAmount,
  paymentNote,
  onPaymentAmountChange,
  onPaymentNoteChange,
  onAddPayment,
  paymentSaving,
  amountError,
}: PaymentDrawerProps) => {
  return (
    <CustomDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Add Payment"
      subtitle={partyName}
      footer={false}
      width={600}
    >
      <div className="space-y-4">
        <UniFieldInput
          label="Amount"
          type="number"
          min={0}
          placeholder="Enter amount"
          value={paymentAmount}
          onChange={(e) => onPaymentAmountChange(e.target.value)}
          required
          error={amountError}
        />
        <UniFieldInput
          label="Note"
          as="textarea"
          rows={3}
          placeholder="Optional note"
          value={paymentNote}
          onChange={(e) => onPaymentNoteChange(e.target.value)}
        />
        <Button
          className="w-full"
          onClick={onAddPayment}
          disabled={paymentSaving}
        >
          {paymentSaving ? "Saving..." : "Add Payment"}
        </Button>
      </div>
    </CustomDrawer>
  );
};
