import type { OverstayCharge, OverstayPolicy } from "@/types/overstay";

/** Reception-facing overstay charge state at checkout. */
export type OverstayCheckoutChargeState =
  | "no_charge"
  | "posted"
  | "pending"
  | "waived"
  | "rejected"
  | "skipped";

export type OverstayCheckoutUxStatus =
  | "posted"
  | "pending_approval"
  | "waived"
  | "rejected"
  | "skipped"
  | "no_charge"
  | "policy_changed_notice"
  | "recovery_available";

export type OverstayCheckoutValidation = {
  reservationId: string;
  isOverstay: boolean;
  businessDate: string;
  scheduledCheckOutDate: string;
  overstayDays: number;
  chargeState: OverstayCheckoutChargeState;
  ledgerCharge: OverstayCharge | null;
  /** Ledger row exists for current Business Date. */
  businessDateEvaluated: boolean;
  chargeOnFolio: boolean;
  /** True when ledger is posted but folio integration is missing. */
  missingFolioIntegration: boolean;
  currentPolicy: OverstayPolicy;
  evaluationPolicy: OverstayPolicy | null;
  policyChangedAfterEvaluation: boolean;
  checkoutAllowed: boolean;
  checkoutBlockedReason: string | null;
  recoveryAvailable: boolean;
  recoveryReason: string | null;
  uxStatus: OverstayCheckoutUxStatus;
  messages: string[];
};

export type OverstayCheckoutPrepareResult = {
  validation: OverstayCheckoutValidation;
  canManageOverstay: boolean;
  canRecordPayment: boolean;
};

export type OverstayRecoveryResult = {
  outcome: "posted" | "pending" | "skipped" | "already" | "none";
  validation: OverstayCheckoutValidation;
};
