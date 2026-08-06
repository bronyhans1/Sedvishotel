"use client";

import { AlertTriangle, CheckCircle2, Info, ShieldAlert } from "lucide-react";

import { OverstayFinancialBadge } from "@/components/reservations/OverstayFinancialBadge";
import { Button } from "@/components/ui/button";
import { OVERSTAY_CHARGE_MODE_LABELS } from "@/types/overstay";
import type { OverstayCheckoutValidation } from "@/types/overstay-checkout";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Props = {
  validation: OverstayCheckoutValidation;
  outstandingBalance: number;
  canManageOverstay: boolean;
  onRecover?: () => void;
  recovering?: boolean;
};

function statusIcon(uxStatus: OverstayCheckoutValidation["uxStatus"]) {
  switch (uxStatus) {
    case "posted":
      return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
    case "pending_approval":
      return <ShieldAlert className="h-4 w-4 text-amber-600" />;
    case "policy_changed_notice":
    case "recovery_available":
      return <AlertTriangle className="h-4 w-4 text-amber-600" />;
    default:
      return <Info className="h-4 w-4 text-muted-foreground" />;
  }
}

function financialStatusFromValidation(
  validation: OverstayCheckoutValidation
): import("@/types/overstay").OverstayFinancialStatus {
  switch (validation.chargeState) {
    case "posted":
      return "posted";
    case "pending":
      return "pending_charge";
    case "waived":
      return "waived";
    case "rejected":
      return "rejected";
    case "skipped":
      return "skipped";
    default:
      return "none";
  }
}

export function OverstayCheckoutPanel({
  validation,
  outstandingBalance,
  canManageOverstay,
  onRecover,
  recovering = false,
}: Props) {
  if (!validation.isOverstay) return null;

  const charge = validation.ledgerCharge;
  const showPostedAmount =
    validation.chargeState === "posted" && validation.chargeOnFolio;

  return (
    <div className="space-y-3 rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 font-semibold text-red-900 dark:text-red-200">
          {statusIcon(validation.uxStatus)}
          Overstay Check-Out
        </div>
        <OverstayFinancialBadge status={financialStatusFromValidation(validation)} />
      </div>

      <dl className="grid gap-2 text-xs sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Business Date</dt>
          <dd className="font-medium">{validation.businessDate}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Scheduled Checkout</dt>
          <dd className="font-medium">{validation.scheduledCheckOutDate}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Overstay</dt>
          <dd className="font-medium">{validation.overstayDays} day(s)</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Hotel Policy</dt>
          <dd className="font-medium">
            {OVERSTAY_CHARGE_MODE_LABELS[validation.currentPolicy.chargeMode]}
          </dd>
        </div>
      </dl>

      {validation.messages.map((message) => (
        <p
          key={message}
          className={cn(
            "text-xs leading-relaxed",
            validation.uxStatus === "pending_approval"
              ? "text-amber-800 dark:text-amber-200"
              : "text-muted-foreground"
          )}
        >
          {message}
        </p>
      ))}

      {showPostedAmount && charge ? (
        <div className="rounded-md border bg-background/80 p-3">
          <p className="text-xs text-muted-foreground">Overstay Charge</p>
          <p className="text-lg font-semibold">{formatCurrency(charge.amount)}</p>
          <p className="text-xs text-muted-foreground">
            Included in Outstanding Balance ({formatCurrency(outstandingBalance)})
          </p>
        </div>
      ) : null}

      {validation.uxStatus === "pending_approval" ? (
        <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-900 dark:text-amber-100">
          Manager approval required before checkout can continue.
        </p>
      ) : null}

      {validation.recoveryAvailable && canManageOverstay && onRecover ? (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onRecover}
          disabled={recovering}
        >
          {recovering ? "Evaluating…" : "Evaluate Missing Overstay Charge"}
        </Button>
      ) : null}
    </div>
  );
}
