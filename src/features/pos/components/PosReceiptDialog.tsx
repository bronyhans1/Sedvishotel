"use client";

import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import {
  POS_CUSTOMER_TYPE_OPTIONS,
  POS_PAYMENT_METHOD_OPTIONS,
  type PosSale,
} from "@/types/pos";

type PosReceiptDialogProps = {
  open: boolean;
  sale: PosSale | null;
  onPrint: () => void;
  onSkip: () => void;
};

function customerTypeLabel(customerType: PosSale["customerType"]): string {
  return (
    POS_CUSTOMER_TYPE_OPTIONS.find((option) => option.value === customerType)
      ?.label ?? customerType.replace(/_/g, " ")
  );
}

function paymentMethodLabel(
  method: PosSale["payments"][number]["paymentMethod"] | undefined
): string {
  if (!method) return "—";
  return (
    POS_PAYMENT_METHOD_OPTIONS.find((option) => option.value === method)
      ?.label ?? method.replace(/_/g, " ")
  );
}

export function PosReceiptDialog({
  open,
  sale,
  onPrint,
  onSkip,
}: PosReceiptDialogProps) {
  if (!sale) return null;

  const receiptNumber =
    sale.payments[0]?.receiptNumber ?? sale.saleNumber;
  const paymentMethod = sale.payments[0]?.paymentMethod;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onSkip()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Receipt</DialogTitle>
          <DialogDescription>
            Sale recorded successfully. Print a receipt for the customer, or
            skip printing to continue.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 rounded-lg border bg-muted/30 p-4 text-sm">
          <p className="font-mono font-medium">{receiptNumber}</p>
          <p className="text-muted-foreground">{sale.saleNumber}</p>
          <div className="space-y-1">
            <p>
              <span className="text-muted-foreground">Customer:</span>{" "}
              {customerTypeLabel(sale.customerType)}
            </p>
            {sale.customerType === "room_charge" ? (
              <>
                <p>
                  <span className="text-muted-foreground">Guest:</span>{" "}
                  {sale.guestName ?? "—"}
                </p>
                <p>
                  <span className="text-muted-foreground">Room:</span>{" "}
                  {sale.roomNumber ?? "—"}
                </p>
              </>
            ) : null}
            <p>
              <span className="text-muted-foreground">Payment:</span>{" "}
              {paymentMethodLabel(paymentMethod)}
            </p>
            <p className="font-semibold">{formatCurrency(sale.total)}</p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onSkip}>
            Skip
          </Button>
          <Button type="button" onClick={onPrint}>
            <Printer className="h-4 w-4" />
            Print Receipt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
