"use client";

import { formatCurrency } from "@/lib/utils";
import type { PaymentSettlement } from "@/lib/payments/payment-settlement";
import { resolveCollectionPaymentLifecycle } from "@/lib/payments/booking-payment-lifecycle";
import { BookingPaymentLifecycleBadge } from "@/components/payments/BookingPaymentLifecycleBadge";
import type { BookingPaymentPolicy } from "@/types/booking-payment";

type Props = {
  settlement: PaymentSettlement;
  collectionAmount?: number;
  paymentPolicy?: BookingPaymentPolicy;
  readOnly?: boolean;
};

function SummaryRow({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 text-sm ${
        emphasis ? "font-semibold" : ""
      }`}
    >
      <span className={emphasis ? "" : "text-muted-foreground"}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

export function PaymentChargeSummary({
  settlement,
  collectionAmount = 0,
  paymentPolicy = "collect_now",
  readOnly = true,
}: Props) {
  const vatLabel = settlement.vatApplied
    ? `VAT (${(settlement.vatRate * 100).toFixed(1)}%)`
    : "VAT";

  const collecting = Math.max(0, collectionAmount);
  const remainingAfter = Math.max(
    0,
    settlement.outstandingBalance - collecting
  );

  const currentLifecycle = resolveCollectionPaymentLifecycle({
    totalAmount: settlement.totalDue,
    alreadyPaid: settlement.amountPaid,
    collectionAmount: 0,
    paymentPolicy,
  });

  const projectedLifecycle = resolveCollectionPaymentLifecycle({
    totalAmount: settlement.totalDue,
    alreadyPaid: settlement.amountPaid,
    collectionAmount: collecting,
    paymentPolicy,
  });

  const lifecycleStatus =
    collecting > 0 ? projectedLifecycle : currentLifecycle;

  return (
    <div className="space-y-3 rounded-lg border bg-muted/30 p-4 text-sm">
      <p className="font-medium">Payment Summary</p>

      {settlement.reservationNumber ? (
        <SummaryRow label="Reservation" value={settlement.reservationNumber} />
      ) : null}
      {settlement.guestName ? (
        <SummaryRow label="Guest" value={settlement.guestName} />
      ) : null}
      {settlement.roomNumber ? (
        <SummaryRow
          label="Room"
          value={
            settlement.roomCategory
              ? `${settlement.roomNumber} (${settlement.roomCategory})`
              : settlement.roomNumber
          }
        />
      ) : null}

      <div className="space-y-2 border-t pt-3">
        <SummaryRow
          label="Accommodation Charge"
          value={formatCurrency(settlement.accommodationCharge)}
        />
        {settlement.discount > 0 ? (
          <SummaryRow
            label="Discount"
            value={`-${formatCurrency(settlement.discount)}`}
          />
        ) : null}
        <SummaryRow
          label={vatLabel}
          value={
            settlement.vatApplied
              ? formatCurrency(settlement.vatAmount)
              : "Exempt"
          }
        />
        <SummaryRow
          label="Total Due"
          value={formatCurrency(settlement.totalDue)}
          emphasis
        />
        <SummaryRow
          label="Already Paid"
          value={formatCurrency(settlement.amountPaid)}
        />
        <SummaryRow
          label="Outstanding Balance"
          value={formatCurrency(settlement.outstandingBalance)}
          emphasis
        />
      </div>

      {collecting > 0 ? (
        <div className="space-y-2 border-t pt-3">
          <SummaryRow
            label="This Payment"
            value={formatCurrency(collecting)}
          />
          <SummaryRow
            label="Remaining After Payment"
            value={formatCurrency(remainingAfter)}
          />
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-2 border-t pt-3">
        <span className="text-muted-foreground">Payment Status</span>
        <BookingPaymentLifecycleBadge status={lifecycleStatus} />
      </div>

      {readOnly ? null : (
        <p className="text-xs text-muted-foreground">
          Summary reflects the reservation ledger. Enter a payment amount below
          to update status live.
        </p>
      )}
    </div>
  );
}
