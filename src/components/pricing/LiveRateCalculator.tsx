"use client";

import { PricingCard } from "@/components/pricing/PricingCard";
import { formatCurrency } from "@/lib/utils";
import { formatPricingSourceLabel } from "@/types/pricing";
import type { ReservationPricingSnapshot } from "@/types/pricing";

type Props = {
  preview: ReservationPricingSnapshot & {
    numberOfNights: number;
    subtotal: number;
    taxes: number;
    serviceCharge: number;
    totalAmount: number;
  };
  requireApproval?: boolean;
  vatLabel?: string;
};

function Row({
  label,
  value,
  emphasis,
  highlight,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 text-sm ${
        emphasis ? "font-semibold" : ""
      }`}
    >
      <span className={emphasis ? "" : "text-muted-foreground"}>{label}</span>
      <span className={highlight ? "text-emerald-700" : ""}>{value}</span>
    </div>
  );
}

export function LiveRateCalculator({ preview, requireApproval = false, vatLabel = "VAT" }: Props) {
  const savings = preview.discountAmount * preview.numberOfNights;

  return (
    <div className="space-y-4">
      <PricingCard
        rackRate={preview.rackRate}
        chargedRate={preview.chargedRate}
        discountAmount={preview.discountAmount}
        discountPercent={preview.discountPercent}
        pricingMode={preview.pricingMode}
        pricingSource={preview.pricingSource}
        overrideReason={preview.overrideReason}
        overrideReasonDetail={preview.overrideReasonDetail}
        approvedById={preview.approvedById}
        requireApproval={requireApproval}
        numberOfNights={preview.numberOfNights}
      />

      <div className="rounded-xl border bg-gradient-to-br from-card to-muted/20 p-4 text-sm">
        <p className="mb-3 font-semibold">Live Rate Calculator</p>
        <div className="space-y-2">
          <Row label="Nights" value={String(preview.numberOfNights)} />
          <Row
            label="Pricing Source"
            value={formatPricingSourceLabel(
              preview.pricingSource,
              preview.pricingMode
            )}
          />
          <Row
            label="Savings"
            value={
              savings > 0 ? `-${formatCurrency(savings)}` : formatCurrency(0)
            }
            highlight={savings > 0}
          />
          <Row
            label="Discount %"
            value={`${preview.discountPercent.toFixed(1)}%`}
          />
        </div>

        <div className="my-3 border-t" />

        <div className="space-y-2">
          <Row
            label="Accommodation"
            value={formatCurrency(preview.subtotal)}
          />
          <Row label={vatLabel} value={formatCurrency(preview.taxes)} />
          <Row
            label="Service Charge"
            value={formatCurrency(preview.serviceCharge)}
          />
        </div>

        <div className="my-3 border-t" />

        <Row
          label="Grand Total"
          value={formatCurrency(preview.totalAmount)}
          emphasis
        />
      </div>
    </div>
  );
}
