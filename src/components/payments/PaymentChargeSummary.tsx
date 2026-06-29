"use client";

import { formatCurrency } from "@/lib/utils";
import type { PaymentSettlement } from "@/lib/payments/payment-settlement";
import { PaymentStatusBadge } from "@/components/payments/PaymentStatusBadge";

type Props = {
  settlement: PaymentSettlement;
  showProjected?: boolean;
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

export function PaymentChargeSummary({ settlement, showProjected = true }: Props) {
  const vatLabel = settlement.vatApplied
    ? `VAT (${(settlement.vatRate * 100).toFixed(1)}%)`
    : "VAT";

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
          label="TOTAL DUE"
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

      {showProjected && settlement.paymentAmount > 0 ? (
        <div className="space-y-2 border-t pt-3">
          <SummaryRow
            label="This Payment"
            value={formatCurrency(settlement.paymentAmount)}
          />
          <SummaryRow
            label="Remaining After Payment"
            value={formatCurrency(settlement.remainingAfterPayment)}
          />
          <div className="flex items-center justify-between gap-2 pt-1">
            <span className="text-muted-foreground">Payment Status</span>
            <PaymentStatusBadge status={settlement.projectedStatus} />
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2 border-t pt-3">
          <span className="text-muted-foreground">Payment Status</span>
          <PaymentStatusBadge status={settlement.paymentStatus} />
        </div>
      )}
    </div>
  );
}
