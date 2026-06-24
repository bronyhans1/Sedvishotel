import type { NightAudit } from "@/types/night-audit";

export function formatAuditDateLabel(auditDate: string): string {
  const date = new Date(`${auditDate}T12:00:00`);
  if (Number.isNaN(date.getTime())) return auditDate;
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatAuditTimestamp(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatAuditTimeOnly(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function buildNightAuditCsv(audit: NightAudit): string {
  const lines = [
    "SHMS Night Audit Export",
    `Audit Number,${audit.auditNumber}`,
    `Audit Date,${audit.auditDate}`,
    `Status,${audit.status}`,
    "",
    "Occupancy",
    `Rooms Occupied,${audit.roomsOccupied}`,
    `Rooms Available,${audit.roomsAvailable}`,
    `Rooms Cleaning,${audit.roomsCleaning}`,
    `Rooms Maintenance,${audit.roomsMaintenance}`,
    "",
    "Operations",
    `Check-ins,${audit.checkIns}`,
    `Check-outs,${audit.checkOuts}`,
    `Active Stays,${audit.activeStays}`,
    "",
    "Payment Totals",
    `Cash,${audit.cashTotal}`,
    `Mobile Money,${audit.mobileMoneyTotal}`,
    `Card,${audit.cardTotal}`,
    `Bank Transfer,${audit.bankTransferTotal}`,
    `Other,${audit.otherTotal}`,
    `Gross Revenue,${audit.grossRevenue}`,
    `Refunds,${audit.refundTotal}`,
    `Net Revenue,${audit.netRevenue}`,
    "",
    "Cash Variance",
    `Expected Cash,${audit.cashExpected ?? ""}`,
    `Counted Cash,${audit.cashCounted ?? ""}`,
    `Variance,${audit.cashVariance ?? ""}`,
    `Variance Notes,${audit.varianceNotes ?? ""}`,
    "",
    "Shift Link",
    `Shift Number,${audit.shiftHandoverNumber ?? ""}`,
    `Shift Type,${audit.shiftType ?? ""}`,
    "",
    "Closing",
    `Closed By,${audit.closedByName ?? ""}`,
    `Closed At,${audit.closedAt ?? ""}`,
    `Notes,${audit.notes ?? ""}`,
  ];
  return lines.join("\n");
}

export function auditToDisplaySnapshot(audit: NightAudit) {
  return {
    roomsOccupied: audit.roomsOccupied,
    roomsAvailable: audit.roomsAvailable,
    roomsCleaning: audit.roomsCleaning,
    roomsMaintenance: audit.roomsMaintenance,
    checkIns: audit.checkIns,
    checkOuts: audit.checkOuts,
    activeStays: audit.activeStays,
    cashTotal: audit.cashTotal,
    mobileMoneyTotal: audit.mobileMoneyTotal,
    cardTotal: audit.cardTotal,
    bankTransferTotal: audit.bankTransferTotal,
    otherTotal: audit.otherTotal,
    grossRevenue: audit.grossRevenue,
    refundTotal: audit.refundTotal,
    netRevenue: audit.netRevenue,
  };
}
