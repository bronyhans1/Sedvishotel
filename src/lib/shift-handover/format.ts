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
    `Cash Drawer Amount,${shift.cashDrawerAmount}`,
    `Closing Cash,${shift.closingCash ?? ""}`,
    `Notes,${shift.notes ?? ""}`,
    `Pending Tasks,${shift.pendingTasks ?? ""}`,
    `Outstanding Issues,${shift.outstandingIssues ?? ""}`,
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
