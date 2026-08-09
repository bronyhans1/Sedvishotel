/**
 * Business Day Lock Manager & Correction Session types (Phase 5/6).
 */

export type CorrectionSessionStatus = "open" | "review" | "closed";

export type BusinessDayWriteOperation =
  | "manual_accommodation"
  | "manual_room_charge"
  | "manual_folio_entry"
  | "manual_folio_credit"
  | "inventory_adjustment"
  | "manual_payment"
  | "revenue_correction"
  | "operational_posting";

export type LockPolicy = {
  blockInventoryAdjustments: boolean;
  blockManualPayments: boolean;
  businessDayOpenWarningHour: number;
  correctionSessionMaxHours: number;
};

export const DEFAULT_LOCK_POLICY: LockPolicy = {
  blockInventoryAdjustments: true,
  blockManualPayments: true,
  businessDayOpenWarningHour: 6,
  correctionSessionMaxHours: 8,
};

export type BusinessDayLockDecision = {
  allowed: boolean;
  businessDate: string;
  dayClosed: boolean;
  hasOpenCorrectionSession: boolean;
  correctionSessionId: string | null;
  reason: string;
  requiresCorrectionSession: boolean;
};

export type CorrectionSession = {
  id: string;
  sessionNumber: string;
  businessDate: string;
  nightAuditId: string | null;
  status: CorrectionSessionStatus;
  reason: string;
  openedById: string | null;
  openedByName: string | null;
  openedAt: string;
  closedById: string | null;
  closedByName: string | null;
  closedAt: string | null;
  durationMinutes: number | null;
  correctionsCount: number;
  financialImpact: number;
  reviewNotes: string | null;
};

export type BusinessDayHealthStatus = "healthy" | "attention" | "action_required";

export type BusinessDayHealthFactor = {
  label: string;
  impact: number;
  status: BusinessDayHealthStatus;
};

export type BusinessDayHealth = {
  status: BusinessDayHealthStatus;
  label: string;
  score: number;
  factors: BusinessDayHealthFactor[];
};

export type OperationalSmartWarning = {
  id: string;
  severity: "low" | "medium" | "critical";
  message: string;
  href?: string;
};

export type OperationalTimelineEvent = {
  id: string;
  at: string;
  label: string;
  module: string;
  actionCode: string | null;
  userName: string | null;
  metadata?: Record<string, unknown>;
};

export type NightAuditCommandCenter = {
  businessDate: string;
  businessDayStatus: "open" | "closed";
  nightAuditStatus: "open" | "closed" | "none";
  correctionSession: CorrectionSession | null;
  health: BusinessDayHealth;
  warnings: OperationalSmartWarning[];
  pendingOverstayApprovals: number;
  outstandingCheckOuts: number;
  expectedArrivals: number;
  openMaintenanceBlocks: number;
  openHousekeepingIssues: number;
  timeline: OperationalTimelineEvent[];
  /** Enterprise Operational Governance */
  wallClock: string;
  calendarDate: string;
  auditWindow: import("@/lib/night-audit/audit-window").NightAuditWindowPolicy;
  timing: import("@/lib/night-audit/audit-window").NightAuditTimingAssessment;
  countdown: import("@/lib/night-audit/audit-window").CountdownCardState;
  readiness: import("@/lib/night-audit/close-readiness").NightAuditCloseReadiness;
  reminderStage: 0 | 1 | 2 | 3 | 4 | 5;
  reminderMessage: string | null;
  lastCompletedAudit: {
    businessDate: string;
    auditNumber: string;
    closedAt: string;
    completedLate: boolean;
    delayMinutes: number;
    delayLabel: string | null;
    scheduledCalendarDate: string;
    scheduledTime: string;
  } | null;
  nextAudit: {
    closesBusinessDate: string;
    scheduledCalendarDate: string;
    scheduledTime: string;
    uxStatus: import("@/lib/night-audit/audit-window").NightAuditUxStatus;
    label: string;
    summary: string;
  };
};
