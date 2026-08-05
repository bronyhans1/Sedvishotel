import type {
  BusinessDayHealth,
  BusinessDayHealthFactor,
  BusinessDayHealthStatus,
  OperationalSmartWarning,
  OperationalTimelineEvent,
} from "@/types/operational-integrity";

function statusFromScore(score: number): BusinessDayHealthStatus {
  if (score >= 80) return "healthy";
  if (score >= 50) return "attention";
  return "action_required";
}

function statusLabel(status: BusinessDayHealthStatus): string {
  switch (status) {
    case "healthy":
      return "Healthy";
    case "attention":
      return "Attention";
    case "action_required":
      return "Action Required";
  }
}

export type BusinessDayHealthInput = {
  outstandingOverstays: number;
  pendingOverstayApprovals: number;
  openCorrectionSession: boolean;
  housekeepingPending: number;
  maintenanceBlocks: number;
  unbalancedShift: boolean;
  nightAuditPending: boolean;
  missingCashCount: boolean;
  lockDenialsToday?: number;
};

/** Pure derivation — no duplicate storage. */
export function deriveBusinessDayHealth(
  input: BusinessDayHealthInput
): BusinessDayHealth {
  let score = 100;
  const factors: BusinessDayHealthFactor[] = [];

  function hit(
    label: string,
    impact: number,
    status: BusinessDayHealthStatus
  ) {
    score -= impact;
    factors.push({ label, impact: -impact, status });
  }

  if (input.openCorrectionSession) {
    hit("Open correction session", 20, "attention");
  }
  if (input.pendingOverstayApprovals > 0) {
    hit(
      `${input.pendingOverstayApprovals} pending overstay approval(s)`,
      Math.min(25, input.pendingOverstayApprovals * 8),
      "action_required"
    );
  }
  if (input.outstandingOverstays > 0) {
    hit(
      `${input.outstandingOverstays} outstanding overstay(s)`,
      Math.min(20, input.outstandingOverstays * 5),
      "attention"
    );
  }
  if (input.nightAuditPending) {
    hit("Night Audit pending", 15, "attention");
  }
  if (input.missingCashCount) {
    hit("Missing cash count", 15, "action_required");
  }
  if (input.unbalancedShift) {
    hit("Unbalanced shift cash", 12, "attention");
  }
  if (input.housekeepingPending > 3) {
    hit("Housekeeping delays", 10, "attention");
  }
  if (input.maintenanceBlocks > 0) {
    hit(
      `${input.maintenanceBlocks} maintenance block(s)`,
      Math.min(15, input.maintenanceBlocks * 5),
      "attention"
    );
  }
  if ((input.lockDenialsToday ?? 0) > 0) {
    hit(
      `${input.lockDenialsToday} lock denial(s)`,
      Math.min(10, (input.lockDenialsToday ?? 0) * 2),
      "attention"
    );
  }

  score = Math.max(0, Math.min(100, score));
  const status = statusFromScore(score);
  return {
    status,
    label: statusLabel(status),
    score,
    factors,
  };
}

export function deriveOperationalSmartWarnings(input: {
  businessDate: string;
  calendarHour: number;
  warningHour: number;
  nightAuditOpen: boolean;
  correctionSessionOpenHours: number | null;
  correctionMaxHours: number;
  pendingApprovals: number;
  outstandingOverstays: number;
  outstandingCheckOuts: number;
}): OperationalSmartWarning[] {
  const warnings: OperationalSmartWarning[] = [];

  if (input.nightAuditOpen && input.calendarHour >= input.warningHour) {
    warnings.push({
      id: "bd-still-open",
      severity: "critical",
      message: `Business Day ${input.businessDate} is still open after ${input.warningHour}:00.`,
      href: "/dashboard/night-audit",
    });
  }

  if (
    input.correctionSessionOpenHours != null &&
    input.correctionSessionOpenHours > input.correctionMaxHours
  ) {
    warnings.push({
      id: "correction-too-long",
      severity: "medium",
      message: `Correction session open for ${input.correctionSessionOpenHours}h (policy max ${input.correctionMaxHours}h).`,
      href: "/dashboard/night-audit",
    });
  }

  if (input.nightAuditOpen) {
    warnings.push({
      id: "na-overdue",
      severity: "medium",
      message: "Night Audit is pending for the current Business Day.",
      href: "/dashboard/night-audit",
    });
  }

  if (input.pendingApprovals >= 2) {
    warnings.push({
      id: "pending-approvals",
      severity: "critical",
      message: `${input.pendingApprovals} pending overstay approvals require manager attention.`,
      href: "/dashboard/check-out",
    });
  }

  if (input.outstandingOverstays > 0) {
    warnings.push({
      id: "outstanding-overstays",
      severity: "medium",
      message: `${input.outstandingOverstays} outstanding overstay charge(s).`,
      href: "/dashboard/check-out",
    });
  }

  if (input.outstandingCheckOuts > 5) {
    warnings.push({
      id: "checkouts",
      severity: "low",
      message: `${input.outstandingCheckOuts} outstanding check-outs on the board.`,
      href: "/dashboard/check-out",
    });
  }

  return warnings;
}

/** Map activity log rows into operational timeline events (reuse Activity Log Engine). */
export function mapActivityLogsToTimeline(
  logs: Array<{
    id: string;
    created_at: string;
    action: string;
    action_code?: string | null;
    module: string;
    user_name?: string | null;
    metadata?: Record<string, unknown> | null;
  }>
): OperationalTimelineEvent[] {
  return logs.map((log) => ({
    id: log.id,
    at: log.created_at,
    label: log.action,
    module: log.module,
    actionCode: log.action_code ?? null,
    userName: log.user_name ?? null,
    metadata: log.metadata ?? undefined,
  }));
}
