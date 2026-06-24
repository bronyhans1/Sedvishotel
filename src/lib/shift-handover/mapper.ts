import type { DbShiftHandover } from "@/types/database";
import type { ShiftHandover } from "@/types/shift-handover";

type UserNameLookup = Map<string, string>;

export function mapDbShiftHandoverToShiftHandover(
  row: DbShiftHandover,
  userNames: UserNameLookup = new Map()
): ShiftHandover {
  return {
    id: row.id,
    handoverNumber: row.handover_number,
    shiftType: row.shift_type,
    openedById: row.opened_by,
    openedByName: row.opened_by ? userNames.get(row.opened_by) ?? null : null,
    closedById: row.closed_by,
    closedByName: row.closed_by ? userNames.get(row.closed_by) ?? null : null,
    openedAt: row.opened_at,
    closedAt: row.closed_at,
    cashDrawerAmount: Number(row.cash_drawer_amount),
    closingCash: row.closing_cash != null ? Number(row.closing_cash) : null,
    notes: row.notes,
    pendingTasks: row.pending_tasks,
    outstandingIssues: row.outstanding_issues,
    status: row.status,
  };
}

export function formatShiftTypeLabel(shiftType: ShiftHandover["shiftType"]): string {
  return shiftType.charAt(0).toUpperCase() + shiftType.slice(1);
}
