import type { DbNightAudit, DbShiftHandover } from "@/types/database";
import type { NightAudit, NightAuditSnapshot } from "@/types/night-audit";

type UserNameLookup = Map<string, string>;

export function mapDbNightAuditToNightAudit(
  row: DbNightAudit,
  userNames: UserNameLookup = new Map(),
  shift: DbShiftHandover | null = null
): NightAudit {
  return {
    id: row.id,
    auditNumber: row.night_audit_number,
    auditDate: row.audit_date,
    openedAt: row.opened_at,
    closedAt: row.closed_at,
    openedById: row.opened_by,
    openedByName: row.opened_by ? userNames.get(row.opened_by) ?? null : null,
    closedById: row.closed_by,
    closedByName: row.closed_by ? userNames.get(row.closed_by) ?? null : null,
    status: row.status,
    roomsOccupied: row.rooms_occupied,
    roomsAvailable: row.rooms_available,
    roomsCleaning: row.rooms_cleaning,
    roomsMaintenance: row.rooms_maintenance,
    checkIns: row.check_ins,
    checkOuts: row.check_outs,
    activeStays: row.active_stays,
    cashTotal: Number(row.cash_total),
    mobileMoneyTotal: Number(row.mobile_money_total),
    cardTotal: Number(row.card_total),
    bankTransferTotal: Number(row.bank_transfer_total),
    otherTotal: Number(row.other_total),
    grossRevenue: Number(row.gross_revenue),
    refundTotal: Number(row.refund_total),
    netRevenue: Number(row.net_revenue),
    vatCollected: Number(row.vat_collected ?? 0),
    vatExemptRevenue: Number(row.vat_exempt_revenue ?? 0),
    vatOverrideCount: Number(row.vat_override_count ?? 0),
    cashExpected: row.cash_expected != null ? Number(row.cash_expected) : null,
    cashCounted: row.cash_counted != null ? Number(row.cash_counted) : null,
    cashVariance: row.cash_variance != null ? Number(row.cash_variance) : null,
    varianceNotes: row.variance_notes,
    notes: row.notes,
    reopenedAt: row.reopened_at,
    reopenedById: row.reopened_by,
    reopenedByName: row.reopened_by ? userNames.get(row.reopened_by) ?? null : null,
    reopenReason: row.reopen_reason,
    shiftHandoverId: row.shift_handover_id,
    shiftHandoverNumber: shift?.handover_number ?? null,
    shiftType: shift?.shift_type ?? null,
  };
}

export function snapshotToDbFields(
  snapshot: NightAuditSnapshot
): Pick<
  DbNightAudit,
  | "rooms_occupied"
  | "rooms_available"
  | "rooms_cleaning"
  | "rooms_maintenance"
  | "check_ins"
  | "check_outs"
  | "active_stays"
  | "cash_total"
  | "mobile_money_total"
  | "card_total"
  | "bank_transfer_total"
  | "other_total"
  | "gross_revenue"
  | "refund_total"
  | "net_revenue"
  | "vat_collected"
  | "vat_exempt_revenue"
  | "vat_override_count"
> {
  return {
    rooms_occupied: snapshot.roomsOccupied,
    rooms_available: snapshot.roomsAvailable,
    rooms_cleaning: snapshot.roomsCleaning,
    rooms_maintenance: snapshot.roomsMaintenance,
    check_ins: snapshot.checkIns,
    check_outs: snapshot.checkOuts,
    active_stays: snapshot.activeStays,
    cash_total: snapshot.cashTotal,
    mobile_money_total: snapshot.mobileMoneyTotal,
    card_total: snapshot.cardTotal,
    bank_transfer_total: snapshot.bankTransferTotal,
    other_total: snapshot.otherTotal,
    gross_revenue: snapshot.grossRevenue,
    refund_total: snapshot.refundTotal,
    net_revenue: snapshot.netRevenue,
    vat_collected: snapshot.vatCollected,
    vat_exempt_revenue: snapshot.vatExemptRevenue,
    vat_override_count: snapshot.vatOverrideCount,
  };
}
