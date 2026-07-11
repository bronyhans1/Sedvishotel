import type {
  DbShiftHandover,
  DbShiftHandoverIssue,
  DbShiftHandoverTask,
} from "@/types/database";
import type {
  ShiftHandover,
  ShiftHandoverIssue,
  ShiftHandoverTask,
} from "@/types/shift-handover";

type UserNameLookup = Map<string, string>;

function computeCashVariance(
  cashDrawerAmount: number,
  closingCash: number | null
): number | null {
  if (closingCash == null) return null;
  return Number((closingCash - cashDrawerAmount).toFixed(2));
}

export function mapDbShiftHandoverToShiftHandover(
  row: DbShiftHandover,
  userNames: UserNameLookup = new Map(),
  counts: { tasksCompleted?: number; issuesResolved?: number } = {}
): ShiftHandover {
  return {
    id: row.id,
    handoverNumber: row.handover_number,
    shiftType: row.shift_type,
    openedById: row.opened_by,
    openedByName: row.opened_by ? userNames.get(row.opened_by) ?? null : null,
    closedById: row.closed_by,
    closedByName: row.closed_by ? userNames.get(row.closed_by) ?? null : null,
    acknowledgedById: row.acknowledged_by,
    acknowledgedByName: row.acknowledged_by
      ? userNames.get(row.acknowledged_by) ?? null
      : null,
    openedAt: row.opened_at,
    closedAt: row.closed_at,
    acknowledgedAt: row.acknowledged_at,
    cashDrawerAmount: Number(row.cash_drawer_amount),
    closingCash: row.closing_cash != null ? Number(row.closing_cash) : null,
    cashVariance: computeCashVariance(
      Number(row.cash_drawer_amount),
      row.closing_cash != null ? Number(row.closing_cash) : null
    ),
    openingNotes: row.notes,
    closingNotes: row.closing_notes,
    pendingTasksSnapshot: row.pending_tasks,
    outstandingIssuesSnapshot: row.outstanding_issues,
    status: row.status,
    tasksCompletedCount: counts.tasksCompleted ?? 0,
    issuesResolvedCount: counts.issuesResolved ?? 0,
  };
}

export function mapDbShiftHandoverTaskToShiftHandoverTask(
  row: DbShiftHandoverTask,
  userNames: UserNameLookup = new Map()
): ShiftHandoverTask {
  return {
    id: row.id,
    description: row.description,
    status: row.status,
    shiftHandoverId: row.shift_handover_id,
    originShiftHandoverId: row.origin_shift_handover_id,
    createdById: row.created_by,
    createdByName: row.created_by ? userNames.get(row.created_by) ?? null : null,
    completedById: row.completed_by,
    completedByName: row.completed_by ? userNames.get(row.completed_by) ?? null : null,
    completedAt: row.completed_at,
    completedDuringShiftId: row.completed_during_shift_id,
    createdAt: row.created_at,
  };
}

export function mapDbShiftHandoverIssueToShiftHandoverIssue(
  row: DbShiftHandoverIssue,
  userNames: UserNameLookup = new Map()
): ShiftHandoverIssue {
  return {
    id: row.id,
    description: row.description,
    status: row.status,
    originShiftHandoverId: row.origin_shift_handover_id,
    createdById: row.created_by,
    createdByName: row.created_by ? userNames.get(row.created_by) ?? null : null,
    resolvedById: row.resolved_by,
    resolvedByName: row.resolved_by ? userNames.get(row.resolved_by) ?? null : null,
    resolvedAt: row.resolved_at,
    resolvedDuringShiftId: row.resolved_during_shift_id,
    createdAt: row.created_at,
  };
}

export function formatShiftTypeLabel(shiftType: ShiftHandover["shiftType"]): string {
  return shiftType.charAt(0).toUpperCase() + shiftType.slice(1);
}

export function parseMultilineItems(value?: string | null): string[] {
  if (!value?.trim()) return [];
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}
