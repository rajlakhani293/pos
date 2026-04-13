"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">Amount</div>
          <Input
            type="number"
            min="0"
            placeholder="Enter amount"
            value={paymentAmount}
            onChange={(e) => onPaymentAmountChange(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">Note</div>
          <Textarea
            rows={3}
            placeholder="Optional note"
            value={paymentNote}
            onChange={(e) => onPaymentNoteChange(e.target.value)}
          />
        </div>
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
