import type { ShiftHandover } from "@/types/shift-handover";
import { formatShiftTypeLabel } from "@/lib/shift-handover/mapper";

export function buildShiftHandoverCsv(shift: ShiftHandover): string {
  const lines = [
    "SHMS Shift Handover Export",
    `Handover Number,${shift.handoverNumber}`,
    `Shift Type,${formatShiftTypeLabel(shift.shiftType)}`,
    `Status,${shift.status}`,
    `Opened By,${shift.openedByName ?? ""}`,
    `Opened At,${shift.openedAt}`,
    `Closed By,${shift.closedByName ?? ""}`,
    `Closed At,${shift.closedAt ?? ""}`,
    `Acknowledged By,${shift.acknowledgedByName ?? ""}`,
    `Acknowledged At,${shift.acknowledgedAt ?? ""}`,
    `Opening Cash,${shift.cashDrawerAmount}`,
    `Closing Cash,${shift.closingCash ?? ""}`,
    `Cash Variance,${shift.cashVariance ?? ""}`,
    `Opening Notes,${shift.openingNotes ?? ""}`,
    `Closing Notes,${shift.closingNotes ?? ""}`,
    `Pending Tasks Snapshot,${shift.pendingTasksSnapshot ?? ""}`,
    `Outstanding Issues Snapshot,${shift.outstandingIssuesSnapshot ?? ""}`,
    `Tasks Completed During Shift,${shift.tasksCompletedCount}`,
    `Issues Resolved During Shift,${shift.issuesResolvedCount}`,
  ];
  return lines.join("\n");
}

export function formatHandoverTimestamp(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
