import { roundCurrency } from "@/lib/payments/currency";
import type { OverstayChargeMode, OverstayPolicy } from "@/types/overstay";

/**
 * Overstay fee evaluation — day-based, not hour-based.
 * Does NOT reuse late-checkout hour brackets (different domain).
 * Amount uses the reservation night rate (same accommodation basis as stay extension).
 */
export function computeOverstayNightAmount(nightRate: number): number {
  return roundCurrency(Math.max(0, nightRate));
}

export type OverstayChargeDecision =
  | { action: "skip"; reason: string }
  | { action: "pending"; amount: number; reason: string }
  | { action: "post"; amount: number; reason: string };

/**
 * Decide what to do for one reservation on one Business Date.
 * Idempotency of existing rows is handled by the service layer.
 */
export function evaluateOverstayChargeDecision(input: {
  policy: OverstayPolicy;
  nightRate: number;
  /** True when this reservation already has any non-rejected overstay charge (for one_additional_night). */
  hasPriorOverstayCharge: boolean;
  /** True when a row already exists for this (reservation, businessDate). */
  alreadyHandledForBusinessDate: boolean;
}): OverstayChargeDecision {
  if (input.alreadyHandledForBusinessDate) {
    return {
      action: "skip",
      reason: "Already handled for this Business Date (idempotent).",
    };
  }

  const mode: OverstayChargeMode = input.policy.chargeMode;

  if (mode === "none") {
    return { action: "skip", reason: "Policy: No Automatic Charge." };
  }

  if (mode === "one_additional_night" && input.hasPriorOverstayCharge) {
    return {
      action: "skip",
      reason: "Policy: One Additional Night already charged or pending.",
    };
  }

  const amount = computeOverstayNightAmount(input.nightRate);

  if (amount <= 0) {
    return { action: "skip", reason: "Night rate is zero — no charge created." };
  }

  if (input.policy.managerApprovalRequired) {
    if (!input.policy.autoCreatePendingCharge) {
      return {
        action: "skip",
        reason: "Approval required but auto-create pending is disabled.",
      };
    }
    return {
      action: "pending",
      amount,
      reason: "Manager approval required — pending charge created.",
    };
  }

  return {
    action: "post",
    amount,
    reason: "Automatic overstay accommodation charge.",
  };
}
