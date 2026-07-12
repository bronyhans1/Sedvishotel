import { mapDbGroupReservationToGroupReservation } from "@/lib/group-reservations/mapper";
import type { CorporateAccount } from "@/types/corporate-account";
import type {
  CorporateExecutiveMetrics,
  CorporateOperationalIntelligence,
  CorporateTimelineEntry,
  CorporateTrendPoint,
  GroupHealthStatus,
} from "@/types/group-operational-intelligence";
import type { DbGroupReservation, DbInvoice, DbPayment } from "@/types/database";
import type { GroupReservationSummary } from "@/types/group-reservation";
import type { GroupTimelineEvent } from "@/types/group-timeline";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

export function buildCorporateExecutiveMetrics(
  account: CorporateAccount,
  outstandingBalance: number,
  groupRows: DbGroupReservation[],
  groupSummaries: GroupReservationSummary[],
  invoices: DbInvoice[],
  payments: DbPayment[],
  financialByGroup: Map<string, { charges: number; payments: number }>
): CorporateExecutiveMetrics {
  const today = todayIso();
  const groups = groupRows.map(mapDbGroupReservationToGroupReservation);
  const currentMonth = monthKey(today);

  let annualRevenue = 0;
  let monthlyRevenue = 0;
  let totalNights = 0;
  let totalGuests = 0;
  let totalSpend = 0;
  const roomTypeCounts = new Map<string, number>();
  const guestCounts = new Map<string, number>();
  const vipGuests = 0;
  const returningGuests = 0;

  for (const g of groups) {
    const fin = financialByGroup.get(g.id);
    const charges = fin?.charges ?? 0;
    annualRevenue += charges;
    totalSpend += charges;
    if (g.arrivalDate.startsWith(currentMonth) || g.departureDate.startsWith(currentMonth)) {
      monthlyRevenue += charges;
    }
    const nights = Math.max(
      1,
      Math.ceil(
        (new Date(g.departureDate).getTime() - new Date(g.arrivalDate).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    );
    totalNights += nights;
    totalGuests += g.actualGuests || g.expectedGuests;
  }

  const activeGroups = groups.filter(
    (g) => g.status === "in_house" || g.status === "partially_checked_in"
  ).length;
  const currentGroups = groups.filter(
    (g) =>
      g.arrivalDate <= today &&
      g.departureDate >= today &&
      g.status !== "cancelled" &&
      g.status !== "closed"
  ).length;
  const upcomingGroups = groups.filter(
    (g) => g.arrivalDate > today && g.status !== "cancelled"
  ).length;
  const completedGroups = groups.filter(
    (g) => g.status === "completed" || g.status === "closed"
  ).length;
  const cancelledGroups = groups.filter((g) => g.status === "cancelled").length;

  const sortedByDeparture = [...groups].sort((a, b) =>
    b.departureDate.localeCompare(a.departureDate)
  );
  const sortedByArrival = [...groups]
    .filter((g) => g.arrivalDate >= today && g.status !== "cancelled")
    .sort((a, b) => a.arrivalDate.localeCompare(b.arrivalDate));

  const creditUsed = outstandingBalance;
  const creditRemaining =
    account.creditLimit != null ? Math.max(0, account.creditLimit - creditUsed) : null;

  void invoices;
  void payments;
  void groupSummaries;

  return {
    totalReservations: groups.reduce((s, g) => s + g.actualRooms, 0),
    activeGroups,
    annualRevenue,
    monthlyRevenue,
    outstandingBalance,
    creditUsed,
    creditRemaining,
    averageStay: groups.length > 0 ? Math.round((totalNights / groups.length) * 10) / 10 : 0,
    averageGroupSize: groups.length > 0 ? Math.round((totalGuests / groups.length) * 10) / 10 : 0,
    averageSpend: groups.length > 0 ? Math.round((totalSpend / groups.length) * 100) / 100 : 0,
    currentGroups,
    upcomingGroups,
    completedGroups,
    cancelledGroups,
    lastStay: sortedByDeparture[0]?.departureDate ?? null,
    nextArrival: sortedByArrival[0]?.arrivalDate ?? null,
    mostUsedRoomType:
      roomTypeCounts.size > 0
        ? [...roomTypeCounts.entries()].sort((a, b) => b[1] - a[1])[0][0]
        : null,
    mostFrequentGuest:
      guestCounts.size > 0
        ? [...guestCounts.entries()].sort((a, b) => b[1] - a[1])[0][0]
        : null,
    vipGuests,
    returningGuests,
  };
}

export function buildCorporateTrends(
  groups: DbGroupReservation[],
  financialByGroup: Map<string, { charges: number; payments: number }>
): CorporateTrendPoint[] {
  const byMonth = new Map<string, CorporateTrendPoint>();

  for (const row of groups) {
    const g = mapDbGroupReservationToGroupReservation(row);
    const key = monthKey(g.arrivalDate);
    const fin = financialByGroup.get(g.id);
    const existing = byMonth.get(key) ?? {
      label: key,
      revenue: 0,
      reservations: 0,
      outstanding: 0,
      averageSpend: 0,
    };
    existing.reservations += 1;
    existing.revenue += fin?.charges ?? 0;
    existing.outstanding += Math.max(0, (fin?.charges ?? 0) - (fin?.payments ?? 0));
    byMonth.set(key, existing);
  }

  return [...byMonth.values()]
    .map((p) => ({
      ...p,
      averageSpend: p.reservations > 0 ? Math.round((p.revenue / p.reservations) * 100) / 100 : 0,
    }))
    .sort((a, b) => a.label.localeCompare(b.label))
    .slice(-6);
}

const FINANCIAL_EVENTS = new Set([
  "payment_recorded",
  "deposit_paid",
  "invoice_generated",
  "receipt_printed",
  "refund",
  "pos_room_charge",
]);

const ROOM_EVENTS = new Set(["room_assigned", "room_changed", "block_created", "block_released"]);

export function buildCorporateTimeline(
  groupTimelines: Array<{ groupId: string; groupNumber: string; events: GroupTimelineEvent[] }>,
  payments: DbPayment[],
  invoices: DbInvoice[]
): CorporateTimelineEntry[] {
  const entries: CorporateTimelineEntry[] = [];

  for (const { groupId, groupNumber, events } of groupTimelines) {
    for (const e of events) {
      let category: CorporateTimelineEntry["category"] = "operational";
      if (FINANCIAL_EVENTS.has(e.eventType)) category = "financial";
      else if (e.eventType.includes("guest")) category = "guests";
      else if (ROOM_EVENTS.has(e.eventType)) category = "rooms";
      else if (e.eventType.includes("invoice") || e.eventType.includes("receipt"))
        category = "documents";

      entries.push({
        id: e.id,
        category,
        eventType: e.eventType,
        label: `${groupNumber} — ${e.eventType.replace(/_/g, " ")}`,
        description: e.description,
        createdAt: e.createdAt,
        href: `/dashboard/group-reservations/${groupId}?tab=timeline`,
      });
    }
  }

  for (const p of payments.slice(0, 20)) {
    entries.push({
      id: `payment-${p.id}`,
      category: "financial",
      eventType: "payment_recorded",
      label: `Payment ${p.reference}`,
      description: `Payment recorded — ${Number(p.amount).toFixed(2)}`,
      createdAt: p.created_at,
      href: `/dashboard/payments/${p.id}`,
    });
  }

  for (const inv of invoices.slice(0, 20)) {
    entries.push({
      id: `invoice-${inv.id}`,
      category: "documents",
      eventType: "invoice_generated",
      label: `Invoice ${inv.invoice_number}`,
      description: `Invoice generated — ${Number(inv.total_amount).toFixed(2)}`,
      createdAt: inv.created_at,
      href: `/dashboard/invoices/${inv.id}`,
    });
  }

  return entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 50);
}

export function buildCorporateOperationalIntelligence(
  account: CorporateAccount,
  outstandingBalance: number,
  groupRows: DbGroupReservation[],
  groupSummaries: GroupReservationSummary[],
  invoices: DbInvoice[],
  payments: DbPayment[],
  financialByGroup: Map<string, { charges: number; payments: number }>,
  groupTimelines: Array<{ groupId: string; groupNumber: string; events: GroupTimelineEvent[] }>
): CorporateOperationalIntelligence {
  const metrics = buildCorporateExecutiveMetrics(
    account,
    outstandingBalance,
    groupRows,
    groupSummaries,
    invoices,
    payments,
    financialByGroup
  );
  const trends = buildCorporateTrends(groupRows, financialByGroup);
  const timeline = buildCorporateTimeline(groupTimelines, payments, invoices);

  let health: GroupHealthStatus = "healthy";
  if (outstandingBalance > 0 && account.creditLimit != null && outstandingBalance > account.creditLimit) {
    health = "critical";
  } else if (outstandingBalance > 0) {
    health = "attention";
  }

  return { metrics, trends, timeline, health, account };
}

export function summarizeGroupHealthSummary(
  groups: Array<{ groupId: string; health: GroupHealthStatus }>
): { healthy: number; attention: number; critical: number } {
  return {
    healthy: groups.filter((g) => g.health === "healthy").length,
    attention: groups.filter((g) => g.health === "attention").length,
    critical: groups.filter((g) => g.health === "critical").length,
  };
}
