"use client";

import { useEffect, useMemo, useState, useTransition } from "react";

import { SubmitButton } from "@/components/loading/SubmitButton";
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
import { Textarea } from "@/components/ui/textarea";
import { recordPaymentAction } from "@/features/payments/actions";
import type { PartialPaymentContext } from "@/features/payments/load-payments-page";
import { useLiveRefresh } from "@/hooks/use-live-refresh";
import { useToast } from "@/hooks/use-toast";
import {
  exceedsOutstandingBalance,
  OVERPAYMENT_ERROR,
  roundCurrency,
} from "@/lib/payments/currency";
import { formatCurrency } from "@/lib/utils";
import {
  PAYMENT_METHOD_OPTIONS,
  type PaymentFormValues,
} from "@/types/payment";
import type { Guest } from "@/types/guest";
import type { Reservation } from "@/types/reservation";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guests: Guest[];
  reservations: Reservation[];
  partialPayments: PartialPaymentContext[];
};

const initial: PaymentFormValues = {
  guestId: "",
  reservationId: "",
  amount: 0,
  method: "cash",
  referenceNumber: "",
  notes: "",
};

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function RecordPaymentModal({
  open,
  onOpenChange,
  guests,
  reservations,
  partialPayments,
}: Props) {
  const toast = useToast();
  const refresh = useLiveRefresh();
  const [values, setValues] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const continuingPayment = useMemo(
    () =>
      partialPayments.find((p) => p.reservationId === values.reservationId) ??
      null,
    [partialPayments, values.reservationId]
  );

  useEffect(() => {
    if (!values.reservationId) return;
    const partial = partialPayments.find(
      (p) => p.reservationId === values.reservationId
    );
    if (partial) {
      setValues((v) => ({
        ...v,
        referenceNumber: partial.reference,
        amount: roundCurrency(partial.outstandingBalance),
      }));
    } else {
      setValues((v) => ({
        ...v,
        referenceNumber: "",
        amount: 0,
      }));
    }
  }, [values.reservationId, partialPayments]);

  const guestReservations = reservations.filter(
    (r) =>
      !values.guestId ||
      guests.find((g) => g.id === values.guestId)?.email.toLowerCase() ===
        r.guestEmail.toLowerCase()
  );

  function handleClose(next: boolean) {
    if (!next) {
      setValues(initial);
      setError(null);
    }
    onOpenChange(next);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const requestedAmount = roundCurrency(values.amount);
    const selectedReservation = reservations.find(
      (r) => r.id === values.reservationId
    );
    const outstandingBalance = continuingPayment
      ? roundCurrency(continuingPayment.outstandingBalance)
      : selectedReservation
        ? roundCurrency(selectedReservation.balance)
        : null;

    if (
      outstandingBalance !== null &&
      exceedsOutstandingBalance(requestedAmount, outstandingBalance)
    ) {
      setError(OVERPAYMENT_ERROR);
      toast.error(OVERPAYMENT_ERROR);
      return;
    }

    const payload = { ...values, amount: requestedAmount };
    startTransition(async () => {
      const result = await recordPaymentAction(payload);
      if (result.success) {
        handleClose(false);
        if (continuingPayment) {
          toast.celebrate(
            "Payment Continued",
            "Outstanding balance settled successfully."
          );
        } else {
          toast.celebrate("Payment Recorded", "Payment recorded successfully.");
        }
        refresh();
      } else {
        setError(result.error);
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {continuingPayment ? "Continue Payment" : "Record Payment"}
          </DialogTitle>
          <DialogDescription>
            {continuingPayment
              ? "Settle the outstanding balance on an existing payment."
              : "Record a guest payment against a reservation."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
            {continuingPayment && (
              <div className="rounded-md border bg-muted/50 px-3 py-2 text-sm">
                <p className="text-muted-foreground">Outstanding Balance</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(continuingPayment.outstandingBalance)}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label>Guest</Label>
              <select
                required
                value={values.guestId}
                onChange={(e) =>
                  setValues((v) => ({
                    ...v,
                    guestId: e.target.value,
                    reservationId: "",
                  }))
                }
                className={selectClass}
              >
                <option value="">Select guest</option>
                {guests.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.fullName}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Reservation</Label>
              <select
                required
                value={values.reservationId}
                onChange={(e) =>
                  setValues((v) => ({ ...v, reservationId: e.target.value }))
                }
                className={selectClass}
              >
                <option value="">Select reservation</option>
                {guestReservations.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.reservationNumber} · Room {r.roomNumber}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Amount (GHS)</Label>
                <Input
                  type="number"
                  min={1}
                  required
                  value={values.amount || ""}
                  onChange={(e) =>
                    setValues((v) => ({
                      ...v,
                      amount: roundCurrency(Number(e.target.value) || 0),
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <select
                  value={values.method}
                  onChange={(e) =>
                    setValues((v) => ({
                      ...v,
                      method: e.target.value as PaymentFormValues["method"],
                    }))
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
            <div className="space-y-2">
              <Label>Reference Number</Label>
              <Input
                value={values.referenceNumber}
                readOnly={Boolean(continuingPayment)}
                onChange={(e) =>
                  setValues((v) => ({ ...v, referenceNumber: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={values.notes}
                onChange={(e) =>
                  setValues((v) => ({ ...v, notes: e.target.value }))
                }
                rows={2}
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleClose(false)}>
                Cancel
              </Button>
              <SubmitButton
                loading={isPending}
                loadingLabel={
                  continuingPayment ? "Continuing Payment…" : "Recording Payment…"
                }
              >
                {continuingPayment ? "Continue Payment" : "Record Payment"}
              </SubmitButton>
            </DialogFooter>
          </form>
      </DialogContent>
    </Dialog>
  );
}
