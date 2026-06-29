"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";

import { SubmitButton } from "@/components/loading/SubmitButton";
import { PaymentChargeSummary } from "@/components/payments/PaymentChargeSummary";
import { PaymentTaxSection } from "@/components/payments/PaymentTaxSection";
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
import type { AuthoritativeSettlement } from "@/lib/folio/authoritative-settlement";
import { buildPaymentSettlementFromFolio } from "@/lib/folio/settlement";
import { createPaymentIdempotencyKey } from "@/lib/payments/atomic-commit";
import {
  exceedsOutstandingBalance,
  OVERPAYMENT_ERROR,
  roundCurrency,
} from "@/lib/payments/currency";
import {
  buildSettlementFromReservation,
  getReservationChargeBase,
} from "@/lib/payments/payment-settlement";
import { computeTransactionVatFields } from "@/lib/payments/vat";
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
  folioSettlements: Record<string, AuthoritativeSettlement>;
  defaultTaxRate: number;
  defaultVatApplied: boolean;
  canOverrideVat: boolean;
};

function buildInitial(defaultVatApplied: boolean): PaymentFormValues {
  return {
    guestId: "",
    reservationId: "",
    amount: 0,
    method: "cash",
    referenceNumber: "",
    notes: "",
    vatApplied: defaultVatApplied,
    vatRate: 0,
    vatAmount: 0,
    vatExemptionReason: "",
    vatExemptionNotes: "",
  };
}

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function RecordPaymentModal({
  open,
  onOpenChange,
  guests,
  reservations,
  partialPayments,
  folioSettlements,
  defaultTaxRate,
  defaultVatApplied,
  canOverrideVat,
}: Props) {
  const toast = useToast();
  const refresh = useLiveRefresh();
  const [guestFilterId, setGuestFilterId] = useState("");
  const [values, setValues] = useState(() => buildInitial(defaultVatApplied));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const idempotencyKeyRef = useRef<string>("");

  useEffect(() => {
    if (open) {
      idempotencyKeyRef.current = createPaymentIdempotencyKey();
    }
  }, [open]);

  const selectedReservation = useMemo(
    () => reservations.find((r) => r.id === values.reservationId) ?? null,
    [reservations, values.reservationId]
  );

  const continuingPayment = useMemo(
    () =>
      partialPayments.find((p) => p.reservationId === values.reservationId) ??
      null,
    [partialPayments, values.reservationId]
  );

  const vatApplied = values.vatApplied ?? defaultVatApplied;

  const filteredReservations = useMemo(() => {
    if (!guestFilterId) return reservations;
    return reservations.filter((r) => r.guestId === guestFilterId);
  }, [reservations, guestFilterId]);

  const settlement = useMemo(() => {
    if (!selectedReservation) return null;
    const folio = folioSettlements[selectedReservation.id];
    if (folio) {
      return buildPaymentSettlementFromFolio(
        selectedReservation,
        folio,
        values.amount
      );
    }
    return buildSettlementFromReservation(
      selectedReservation,
      defaultTaxRate,
      vatApplied,
      values.amount,
      {
        lockedTotalDue: continuingPayment?.totalDue,
        amountPaid: continuingPayment?.amountPaid ?? selectedReservation.amountPaid,
      }
    );
  }, [
    selectedReservation,
    folioSettlements,
    defaultTaxRate,
    vatApplied,
    values.amount,
    continuingPayment,
  ]);

  function resetForm() {
    setGuestFilterId("");
    setValues(buildInitial(defaultVatApplied));
    setError(null);
  }

  function handleClose(next: boolean) {
    if (!next) {
      resetForm();
    }
    onOpenChange(next);
  }

  function buildSettlementForReservation(
    reservation: Reservation,
    nextVatApplied: boolean
  ) {
    const folio = folioSettlements[reservation.id];
    if (folio) {
      return buildPaymentSettlementFromFolio(reservation, folio, 0);
    }
    const partial = partialPayments.find(
      (p) => p.reservationId === reservation.id
    );
    return buildSettlementFromReservation(
      reservation,
      defaultTaxRate,
      nextVatApplied,
      0,
      {
        lockedTotalDue: partial?.totalDue,
        amountPaid: partial?.amountPaid ?? reservation.amountPaid,
      }
    );
  }

  function handleReservationChange(reservationId: string) {
    if (!reservationId) {
      setValues((v) => ({
        ...v,
        reservationId: "",
        guestId: "",
        referenceNumber: "",
        amount: 0,
      }));
      return;
    }

    const reservation = reservations.find((r) => r.id === reservationId);
    if (!reservation) return;

    const partial = partialPayments.find((p) => p.reservationId === reservationId);
    const draft = buildSettlementForReservation(reservation, defaultVatApplied);

    setGuestFilterId(reservation.guestId);
    setValues((v) => ({
      ...v,
      reservationId,
      guestId: reservation.guestId,
      referenceNumber: partial?.reference ?? "",
      vatApplied: defaultVatApplied,
      vatExemptionReason: "",
      vatExemptionNotes: "",
      amount: draft.outstandingBalance,
    }));
  }

  function handleVatChange(patch: Partial<PaymentFormValues>) {
    if (!selectedReservation) {
      setValues((v) => ({ ...v, ...patch }));
      return;
    }

    const nextVatApplied = patch.vatApplied ?? vatApplied;
    const draft = buildSettlementForReservation(
      selectedReservation,
      nextVatApplied
    );

    setValues((v) => ({
      ...v,
      ...patch,
      vatApplied: nextVatApplied,
      amount:
        patch.vatApplied !== undefined
          ? draft.outstandingBalance
          : v.amount,
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!selectedReservation || !settlement) {
      setError("Select a reservation to continue.");
      return;
    }

    if (values.guestId !== selectedReservation.guestId) {
      setError("Guest does not match the selected reservation.");
      return;
    }

    const requestedAmount = roundCurrency(values.amount);
    const outstandingBalance = settlement.outstandingBalance;

    if (requestedAmount <= 0) {
      setError("Payment amount must be greater than zero.");
      return;
    }

    if (exceedsOutstandingBalance(requestedAmount, outstandingBalance)) {
      setError(OVERPAYMENT_ERROR);
      toast.error(OVERPAYMENT_ERROR);
      return;
    }

    if (!vatApplied && defaultTaxRate > 0) {
      if (!values.vatExemptionReason?.trim()) {
        setError("A VAT exemption reason is required.");
        return;
      }
      if (
        values.vatExemptionReason === "Other" &&
        !values.vatExemptionNotes?.trim()
      ) {
        setError("Notes are required when the exemption reason is Other.");
        return;
      }
    }

    const chargeBase = getReservationChargeBase(selectedReservation);
    const { vatAmount } = computeTransactionVatFields(
      requestedAmount,
      vatApplied,
      vatApplied ? defaultTaxRate : 0,
      chargeBase
    );

    const payload: PaymentFormValues = {
      ...values,
      guestId: selectedReservation.guestId,
      reservationId: selectedReservation.id,
      amount: requestedAmount,
      vatApplied,
      vatRate: vatApplied ? defaultTaxRate : 0,
      vatAmount,
      idempotencyKey: idempotencyKeyRef.current,
    };

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

  const guestLabel =
    selectedReservation?.guestName ??
    guests.find((g) => g.id === guestFilterId)?.fullName ??
    "";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {continuingPayment ? "Continue Payment" : "Record Payment"}
          </DialogTitle>
          <DialogDescription>
            {continuingPayment
              ? "Settle the outstanding balance on an existing payment."
              : "Select a reservation — guest and charges are loaded automatically."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Filter by Guest (optional)</Label>
            <select
              value={guestFilterId}
              disabled={Boolean(selectedReservation)}
              onChange={(e) => {
                const nextGuestId = e.target.value;
                setGuestFilterId(nextGuestId);
                if (values.reservationId) {
                  const stillVisible = reservations.some(
                    (r) =>
                      r.id === values.reservationId &&
                      (!nextGuestId || r.guestId === nextGuestId)
                  );
                  if (!stillVisible) {
                    handleReservationChange("");
                  }
                }
              }}
              className={selectClass}
            >
              <option value="">All guests</option>
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
              onChange={(e) => handleReservationChange(e.target.value)}
              className={selectClass}
            >
              <option value="">Select reservation</option>
              {filteredReservations.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.reservationNumber} · {r.guestName} · Room {r.roomNumber}
                </option>
              ))}
            </select>
          </div>

          {selectedReservation ? (
            <div className="space-y-2">
              <Label>Guest</Label>
              <Input readOnly value={guestLabel} className="bg-muted/40" />
            </div>
          ) : null}

          {settlement ? <PaymentChargeSummary settlement={settlement} /> : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Payment Amount</Label>
              <Input
                type="number"
                min={0.01}
                step="0.01"
                required
                disabled={!settlement}
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

          {settlement ? (
            <PaymentTaxSection
              vatRate={defaultTaxRate}
              vatApplied={vatApplied}
              vatAmount={settlement.vatAmount}
              canOverrideVat={canOverrideVat}
              values={{
                vatApplied,
                vatExemptionReason: values.vatExemptionReason,
                vatExemptionNotes: values.vatExemptionNotes,
              }}
              onChange={handleVatChange}
            />
          ) : null}

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
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleClose(false)}>
              Cancel
            </Button>
            <SubmitButton
              loading={isPending}
              disabled={!settlement}
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
