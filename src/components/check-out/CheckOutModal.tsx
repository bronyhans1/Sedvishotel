"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { FileText } from "lucide-react";

import { PaymentChargeSummary } from "@/components/payments/PaymentChargeSummary";
import { PaymentTaxSection } from "@/components/payments/PaymentTaxSection";
import { completeCheckOutAction } from "@/features/check-out/actions";
import { useLiveRefresh } from "@/hooks/use-live-refresh";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPaymentIdempotencyKey } from "@/lib/payments/atomic-commit";
import { buildPaymentSettlementFromFolio } from "@/lib/folio/settlement";
import type { AuthoritativeSettlement } from "@/lib/folio/authoritative-settlement";
import {
  exceedsOutstandingBalance,
  OVERPAYMENT_ERROR,
  roundCurrency,
} from "@/lib/payments/currency";
import { buildSettlementFromReservation } from "@/lib/payments/payment-settlement";
import { computeTransactionVatFields } from "@/lib/payments/vat";
import { getReservationChargeBase } from "@/lib/payments/payment-settlement";
import {
  PAYMENT_METHOD_OPTIONS,
  type PaymentFormValues,
  type TransactionPaymentMethod,
} from "@/types/payment";
import type { Reservation } from "@/types/reservation";

type Props = {
  reservation: Reservation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  defaultTaxRate: number;
  defaultVatApplied: boolean;
  canOverrideVat: boolean;
  canRecordPayment: boolean;
  folioSettlement?: AuthoritativeSettlement;
};

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function CheckOutModal({
  reservation,
  open,
  onOpenChange,
  onSuccess,
  defaultTaxRate,
  defaultVatApplied,
  canOverrideVat,
  canRecordPayment,
  folioSettlement,
}: Props) {
  const toast = useToast();
  const refresh = useLiveRefresh();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [vatApplied, setVatApplied] = useState(defaultVatApplied);
  const [vatExemptionReason, setVatExemptionReason] = useState<
    PaymentFormValues["vatExemptionReason"]
  >("");
  const [vatExemptionNotes, setVatExemptionNotes] = useState("");
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] =
    useState<TransactionPaymentMethod>("cash");
  const idempotencyKeyRef = useRef("");

  useEffect(() => {
    if (!open) return;
    idempotencyKeyRef.current = createPaymentIdempotencyKey();
    setVatApplied(defaultVatApplied);
    setVatExemptionReason("");
    setVatExemptionNotes("");
    setPaymentMethod("cash");
    setPaymentAmount(0);
    setError("");
  }, [open, reservation?.id, defaultVatApplied]);

  const settlement = useMemo(() => {
    if (!reservation) return null;
    if (folioSettlement) {
      return buildPaymentSettlementFromFolio(
        reservation,
        folioSettlement,
        paymentAmount,
        { suppressPaymentProjection: true }
      );
    }
    return buildSettlementFromReservation(
      reservation,
      defaultTaxRate,
      vatApplied,
      paymentAmount,
      { suppressPaymentProjection: true }
    );
  }, [
    reservation,
    defaultTaxRate,
    vatApplied,
    paymentAmount,
    folioSettlement,
  ]);

  function handleClose(next: boolean) {
    if (!next) {
      setError("");
    }
    onOpenChange(next);
  }

  function handleCheckOut() {
    if (!reservation || !settlement) return;
    setError("");

    const outstanding = settlement.outstandingBalance;
    const needsPayment = outstanding > 0;

    if (needsPayment) {
      if (!canRecordPayment) {
        setError("Outstanding balance must be settled before check-out.");
        return;
      }
      if (paymentAmount <= 0) {
        setError("Enter a payment amount to settle the balance.");
        return;
      }
      if (exceedsOutstandingBalance(paymentAmount, outstanding)) {
        setError(OVERPAYMENT_ERROR);
        return;
      }
      if (!vatApplied && defaultTaxRate > 0 && !vatExemptionReason?.trim()) {
        setError("A VAT exemption reason is required.");
        return;
      }
      if (vatExemptionReason === "Other" && !vatExemptionNotes.trim()) {
        setError("Notes are required when the exemption reason is Other.");
        return;
      }
    }

    const chargeBase = getReservationChargeBase(reservation);
    const { vatAmount } = computeTransactionVatFields(
      paymentAmount,
      vatApplied,
      vatApplied ? defaultTaxRate : 0,
      chargeBase
    );

    const paymentPayload: PaymentFormValues | undefined = needsPayment
      ? {
          guestId: reservation.guestId,
          reservationId: reservation.id,
          amount: roundCurrency(paymentAmount),
          method: paymentMethod,
          referenceNumber: "",
          notes: "Check-out settlement",
          vatApplied,
          vatRate: vatApplied ? defaultTaxRate : 0,
          vatAmount,
          vatExemptionReason,
          vatExemptionNotes,
          idempotencyKey: idempotencyKeyRef.current,
        }
      : undefined;

    startTransition(async () => {
      const result = await completeCheckOutAction(
        reservation.id,
        paymentPayload
      );
      if (!result.success) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      handleClose(false);
      toast.celebrate(
        "Check-Out Complete",
        `${reservation.guestName} checked out from Room ${reservation.roomNumber}.`
      );
      refresh();
      onSuccess?.();
    });
  }

  if (!reservation || !settlement) return null;

  const needsPayment = settlement.outstandingBalance > 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Guest Check-Out</DialogTitle>
          <DialogDescription>
            Room {reservation.roomNumber} · {reservation.guestName}
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <div className="rounded-lg border p-4 text-sm space-y-2">
          <p className="font-semibold">{reservation.guestName}</p>
          <p className="text-muted-foreground">
            {reservation.checkInDate} — {reservation.checkOutDate} ·{" "}
            {reservation.numberOfNights} nights
          </p>
        </div>

        <PaymentChargeSummary
          settlement={settlement}
          collectionAmount={paymentAmount}
        />

        {needsPayment ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setPaymentAmount(roundCurrency(settlement.outstandingBalance))
                }
              >
                Collect Full Balance
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setPaymentAmount(
                    roundCurrency(settlement.outstandingBalance * 0.5)
                  )
                }
              >
                Collect 50%
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPaymentAmount(0)}
              >
                Clear
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Payment Amount</Label>
                <Input
                  type="number"
                  min={0.01}
                  step="0.01"
                  value={paymentAmount || ""}
                  onChange={(e) =>
                    setPaymentAmount(roundCurrency(Number(e.target.value) || 0))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <select
                  value={paymentMethod}
                  onChange={(e) =>
                    setPaymentMethod(e.target.value as TransactionPaymentMethod)
                  }
                  className={selectClass}
                >
                  {PAYMENT_METHOD_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <PaymentTaxSection
              vatRate={defaultTaxRate}
              vatApplied={vatApplied}
              vatAmount={settlement.vatAmount}
              canOverrideVat={canOverrideVat}
              values={{
                vatApplied,
                vatExemptionReason,
                vatExemptionNotes,
              }}
              onChange={(patch) => {
                if (patch.vatApplied !== undefined) setVatApplied(patch.vatApplied);
                if (patch.vatExemptionReason !== undefined) {
                  setVatExemptionReason(patch.vatExemptionReason);
                }
                if (patch.vatExemptionNotes !== undefined) {
                  setVatExemptionNotes(patch.vatExemptionNotes);
                }
              }}
            />
          </div>
        ) : null}

        <DialogFooter className="gap-2">
          <Button variant="outline" disabled>
            <FileText className="h-4 w-4" />
            Generate Invoice
          </Button>
          <Button onClick={handleCheckOut} disabled={isPending}>
            {isPending ? "Processing…" : "Complete Check-Out"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
