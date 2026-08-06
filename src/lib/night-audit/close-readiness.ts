import type { NightAuditTimingAssessment } from "@/lib/night-audit/audit-window";
import type { NightAuditWindowPolicy } from "@/lib/night-audit/audit-window";

export type ReadinessTone = "green" | "yellow" | "red";

export type ReadinessItem = {
  id: string;
  category: "financial" | "front_desk" | "housekeeping" | "operations" | "revenue";
  label: string;
  detail: string;
  tone: ReadinessTone;
  /** Soft signal only unless hotel policy marks blocking. */
  blocking: boolean;
};

export type CloseReadinessVerdict = "ready" | "ready_with_warnings" | "not_ready";

export type NightAuditCloseReadiness = {
  verdict: CloseReadinessVerdict;
  headline: string;
  summary: string;
  items: ReadinessItem[];
  blockingCount: number;
  warningCount: number;
  timing: NightAuditTimingAssessment;
  window: NightAuditWindowPolicy;
};

export type CloseReadinessInput = {
  cashCountedEntered: boolean;
  correctionSessionOpen: boolean;
  pendingCheckOuts: number;
  outstandingOverstayApprovals: number;
  openFoliosEstimate: number;
  outstandingChargesEstimate: number;
  shiftOpen: boolean;
  shiftBalanced: boolean;
  housekeepingCleaning: number;
  expectedArrivals: number;
  expectedArrivalsPending: number;
  timing: NightAuditTimingAssessment;
  window: NightAuditWindowPolicy;
  dayClosed: boolean;
};

export function buildNightAuditCloseReadiness(
  input: CloseReadinessInput
): NightAuditCloseReadiness {
  if (input.dayClosed) {
    return {
      verdict: "ready",
      headline: "CLOSED",
      summary: "Night Audit for this Business Date is already closed.",
      items: [],
      blockingCount: 0,
      warningCount: 0,
      timing: input.timing,
      window: input.window,
    };
  }

  const items: ReadinessItem[] = [
    {
      id: "cash",
      category: "financial",
      label: "Cash count",
      detail: input.cashCountedEntered
        ? "Cash count entered for close"
        : "Cash count not yet entered (required at close)",
      tone: input.cashCountedEntered ? "green" : "yellow",
      blocking: false,
    },
    {
      id: "correction",
      category: "operations",
      label: "Correction sessions",
      detail: input.correctionSessionOpen
        ? "Open Correction Session — resolve or close before finalizing ops"
        : "No open Correction Session",
      tone: input.correctionSessionOpen ? "yellow" : "green",
      blocking: false,
    },
    {
      id: "departures",
      category: "front_desk",
      label: "Pending check-outs",
      detail:
        input.pendingCheckOuts === 0
          ? "No outstanding departures"
          : `${input.pendingCheckOuts} guest(s) still expected to check out`,
      tone: input.pendingCheckOuts === 0 ? "green" : "yellow",
      blocking: false,
    },
    {
      id: "overstay",
      category: "revenue",
      label: "Overstay approvals",
      detail:
        input.outstandingOverstayApprovals === 0
          ? "No pending overstay approvals"
          : `${input.outstandingOverstayApprovals} overstay approval(s) outstanding`,
      tone: input.outstandingOverstayApprovals === 0 ? "green" : "yellow",
      blocking: false,
    },
    {
      id: "folios",
      category: "financial",
      label: "Open folios",
      detail:
        input.openFoliosEstimate === 0
          ? "No outstanding open folio signal"
          : `${input.openFoliosEstimate} folio balance concern(s)`,
      tone: input.openFoliosEstimate === 0 ? "green" : "yellow",
      blocking: false,
    },
    {
      id: "charges",
      category: "revenue",
      label: "Outstanding charges",
      detail:
        input.outstandingChargesEstimate === 0
          ? "No outstanding charge signal"
          : `${input.outstandingChargesEstimate} outstanding charge signal(s)`,
      tone: input.outstandingChargesEstimate === 0 ? "green" : "yellow",
      blocking: false,
    },
    {
      id: "shift",
      category: "operations",
      label: "Shift status",
      detail: !input.shiftOpen
        ? "No open shift"
        : input.shiftBalanced
          ? "Open shift appears balanced"
          : "Open shift cash may be unbalanced",
      tone: !input.shiftOpen || input.shiftBalanced ? "green" : "yellow",
      blocking: false,
    },
    {
      id: "hk",
      category: "housekeeping",
      label: "Housekeeping",
      detail:
        input.housekeepingCleaning === 0
          ? "No rooms in cleaning"
          : `${input.housekeepingCleaning} room(s) still cleaning`,
      tone: input.housekeepingCleaning === 0 ? "green" : "yellow",
      blocking: false,
    },
    {
      id: "arrivals",
      category: "front_desk",
      label: "Expected arrivals",
      detail:
        input.expectedArrivalsPending === 0
          ? input.expectedArrivals === 0
            ? "No arrivals expected today"
            : "Expected arrivals reviewed / none pending"
          : `${input.expectedArrivalsPending} of ${input.expectedArrivals} arrival(s) still pending`,
      tone: input.expectedArrivalsPending === 0 ? "green" : "yellow",
      blocking: false,
    },
    {
      id: "timing",
      category: "operations",
      label: "Night Audit window",
      detail: input.timing.message,
      tone:
        input.timing.classification === "on_time"
          ? "green"
          : input.timing.classification === "early" ||
              input.timing.classification === "late"
            ? "yellow"
            : "red",
      blocking: input.timing.classification === "too_early",
    },
  ];

  // Too early without override is the soft "not ready" for governance display
  const blockingCount = items.filter((i) => i.blocking).length;
  const warningCount = items.filter((i) => i.tone === "yellow").length;

  let verdict: CloseReadinessVerdict = "ready";
  if (blockingCount > 0) {
    verdict = "not_ready";
  } else if (warningCount > 0 || input.timing.classification !== "on_time") {
    verdict = "ready_with_warnings";
  }

  const headlines: Record<CloseReadinessVerdict, string> = {
    ready: "READY TO CLOSE",
    ready_with_warnings: "READY WITH WARNINGS",
    not_ready: "NOT READY",
  };

  const summaries: Record<CloseReadinessVerdict, string> = {
    ready: "Everything required looks complete. Night Audit can be run.",
    ready_with_warnings:
      "Night Audit may be run. Review warnings below before closing the Business Date.",
    not_ready:
      "Blocking governance requirements still exist (e.g. too early without manager override).",
  };

  return {
    verdict,
    headline: headlines[verdict],
    summary: summaries[verdict],
    items,
    blockingCount,
    warningCount,
    timing: input.timing,
    window: input.window,
  };
}
