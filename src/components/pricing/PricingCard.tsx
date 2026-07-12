"use client";

import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import {
  formatPricingSourceLabel,
  OVERRIDE_REASON_LABELS,
  PRICE_LOCKED_TOOLTIP,
  PRICING_MODE_LABELS,
  type OverrideReason,
  type PricingMode,
  type PricingSource,
} from "@/types/pricing";
import { Check } from "lucide-react";

export type PricingCardProps = {
  rackRate: number;
  chargedRate: number;
  discountAmount: number;
  discountPercent: number;
  pricingMode: PricingMode;
  pricingSource?: PricingSource;
  overrideReason?: OverrideReason | null;
  overrideReasonDetail?: string | null;
  approvedById?: string | null;
  requireApproval?: boolean;
  numberOfNights?: number;
  priceLocked?: boolean;
  compact?: boolean;
};

function modeTone(mode: PricingMode): string {
  if (mode === "standard") return "bg-slate-500/10 text-slate-700";
  if (mode === "complimentary") return "bg-emerald-500/10 text-emerald-700";
  if (mode === "manual_override") return "bg-amber-500/10 text-amber-800";
  if (mode === "without_ac") return "bg-sky-500/10 text-sky-800";
  if (mode === "corporate_rate") return "bg-violet-500/10 text-violet-800";
  if (mode === "vip" || mode === "returning_guest")
    return "bg-rose-500/10 text-rose-800";
  return "bg-muted text-muted-foreground";
}

export function PricingCard({
  rackRate,
  chargedRate,
  discountAmount,
  discountPercent,
  pricingMode,
  pricingSource,
  overrideReason,
  overrideReasonDetail,
  approvedById,
  requireApproval = false,
  numberOfNights,
  priceLocked = false,
  compact = false,
}: PricingCardProps) {
  const hasDiscount = discountAmount > 0;
  const savings =
    numberOfNights != null
      ? discountAmount * numberOfNights
      : discountAmount;
  const approvalPending = requireApproval && hasDiscount && !approvedById;

  return (
    <div
      className={`rounded-xl border bg-gradient-to-br from-card to-muted/20 ${
        compact ? "p-3" : "p-4"
      } ${hasDiscount ? "border-amber-200/80" : "border-border"}`}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold tracking-tight">Rate Summary</p>
        <Badge variant="secondary" className={modeTone(pricingMode)}>
          {PRICING_MODE_LABELS[pricingMode]}
        </Badge>
      </div>

      <div className="grid gap-2 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Rack Rate</span>
          <span className="font-medium tabular-nums">
            {formatCurrency(rackRate)}
            <span className="text-xs text-muted-foreground"> / night</span>
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Charged Rate</span>
          <span
            className={`font-semibold tabular-nums ${
              hasDiscount ? "text-emerald-700" : ""
            }`}
          >
            {formatCurrency(chargedRate)}
            <span className="text-xs font-normal text-muted-foreground">
              {" "}
              / night
            </span>
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Pricing Mode</span>
          <span className="text-xs font-medium">
            {PRICING_MODE_LABELS[pricingMode]}
          </span>
        </div>
        {pricingSource ? (
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Pricing Source</span>
            <span className="text-xs font-medium">
              {formatPricingSourceLabel(pricingSource, pricingMode)}
            </span>
          </div>
        ) : null}
        {hasDiscount ? (
          <>
            <div className="flex items-center justify-between gap-3 text-emerald-700">
              <span>Savings</span>
              <span className="font-medium tabular-nums">
                -{formatCurrency(savings)}
                {numberOfNights != null ? ` (${numberOfNights} nights)` : ""}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Discount</span>
              <span className="tabular-nums">
                {formatCurrency(discountAmount)} ({discountPercent.toFixed(1)}%)
              </span>
            </div>
          </>
        ) : null}
      </div>

      {priceLocked ? (
        <div
          className="mt-3 flex items-center gap-2 border-t pt-3 text-sm text-emerald-700"
          title={PRICE_LOCKED_TOOLTIP}
        >
          <Check className="h-4 w-4 shrink-0" aria-hidden />
          <span className="cursor-help font-medium" title={PRICE_LOCKED_TOOLTIP}>
            Price Locked
          </span>
        </div>
      ) : null}

      {(overrideReason || overrideReasonDetail) && (
        <div className="mt-3 border-t pt-3 text-sm">
          <p className="text-muted-foreground">Reason</p>
          <p className="font-medium">
            {overrideReason
              ? OVERRIDE_REASON_LABELS[overrideReason]
              : "—"}
          </p>
          {overrideReason === "other" && overrideReasonDetail ? (
            <p className="mt-1 text-muted-foreground">{overrideReasonDetail}</p>
          ) : null}
        </div>
      )}

      {hasDiscount ? (
        <div className="mt-3 flex items-center justify-between border-t pt-3 text-xs">
          <span className="text-muted-foreground">Approval</span>
          <Badge
            variant="secondary"
            className={
              approvalPending
                ? "bg-amber-500/10 text-amber-800"
                : "bg-emerald-500/10 text-emerald-700"
            }
          >
            {approvalPending
              ? "Pending Manager Approval"
              : approvedById
                ? "Approved"
                : "Logged"}
          </Badge>
        </div>
      ) : null}
    </div>
  );
}
