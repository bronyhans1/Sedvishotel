/**
 * Overstay Engine types (Phase 4).
 * Extends Hotel Policy — does not replace Late Check-Out pricing.
 */

export type OverstayChargeMode =
  | "none"
  | "one_additional_night"
  | "every_additional_night";

export type OverstayNightAuditMode =
  | "continue"
  | "acknowledge"
  | "require_manager";

export type OverstayChargeStatus =
  | "skipped"
  | "pending"
  | "approved"
  | "rejected"
  | "waived"
  | "posted";

/** Reception-facing financial status (no accounting internals). */
export type OverstayFinancialStatus =
  | "none"
  | "pending_charge"
  | "approved"
  | "waived"
  | "posted"
  | "rejected"
  | "skipped";

/**
 * Full lifecycle status for a stay relative to overstay ops + finance.
 * Builds on Phase 3 departure classification — does not replace it.
 */
export type OverstayLifecycleStatus =
  | "checked_in"
  | "expected_departure"
  | "late_checkout"
  | "overstay"
  | "overstay_charge_pending"
  | "charge_posted"
  | "waived"
  | "checked_out";

export type OverstayPolicy = {
  chargeMode: OverstayChargeMode;
  managerApprovalRequired: boolean;
  allowManualWaiver: boolean;
  autoCreatePendingCharge: boolean;
  nightAuditMode: OverstayNightAuditMode;
};

export const DEFAULT_OVERSTAY_POLICY: OverstayPolicy = {
  chargeMode: "none",
  managerApprovalRequired: false,
  allowManualWaiver: true,
  autoCreatePendingCharge: true,
  nightAuditMode: "acknowledge",
};

export type OverstayCharge = {
  id: string;
  reservationId: string;
  businessDate: string;
  roomNumber: string | null;
  chargeMode: OverstayChargeMode;
  status: OverstayChargeStatus;
  amount: number;
  currency: string;
  nightRate: number;
  overstayDays: number;
  policySnapshot: OverstayPolicy;
  folioEntryId: string | null;
  sourceReference: string;
  decisionNotes: string | null;
  createdById: string | null;
  approvedById: string | null;
  approvedAt: string | null;
  waivedById: string | null;
  waivedAt: string | null;
  rejectedById: string | null;
  rejectedAt: string | null;
  postedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OverstayProcessResult = {
  businessDate: string;
  evaluated: number;
  created: number;
  posted: number;
  pending: number;
  skipped: number;
  alreadyHandled: number;
  errors: Array<{ reservationId: string; message: string }>;
};

export type OverstayNightAuditWarning = {
  activeOverstayCount: number;
  projectedOverstayCount: number;
  mode: OverstayNightAuditMode;
  message: string;
  requiresAcknowledgement: boolean;
  requiresManager: boolean;
};

export const OVERSTAY_CHARGE_MODE_LABELS: Record<OverstayChargeMode, string> = {
  none: "No Automatic Charge",
  one_additional_night: "Charge One Additional Night",
  every_additional_night: "Charge Every Additional Night",
};

export const OVERSTAY_FINANCIAL_STATUS_LABELS: Record<
  OverstayFinancialStatus,
  string
> = {
  none: "No Charge",
  pending_charge: "Pending Charge",
  approved: "Approved",
  waived: "Waived",
  posted: "Posted",
  rejected: "Rejected",
  skipped: "Skipped",
};
