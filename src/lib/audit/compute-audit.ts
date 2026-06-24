import { resolveFloorLabel } from "@/lib/rooms/mapper";
import { resolveMostPopularRoomTypeName } from "@/lib/audit/resolve-most-popular-room-type";
import type { IActivityLogRepository } from "@/repositories/activity-log.repository";
import type { IInvoiceRepository } from "@/repositories/invoice.repository";
import type { IPaymentRepository } from "@/repositories/payment.repository";
import type { IReservationRepository } from "@/repositories/reservation.repository";
import type { IRoomRepository } from "@/repositories/room.repository";
import type { IUserRepository } from "@/repositories/user.repository";
import type { AuditDashboardData } from "@/types/audit";
import type { ChartDataPoint } from "@/types/revenue";
import type { DbActivityLog } from "@/types/database";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function startOfToday(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function isToday(iso: string): boolean {
  return iso >= startOfToday();
}

function last7DayBuckets(): { key: string; label: string }[] {
  const buckets: { key: string; label: string }[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    buckets.push({
      key: d.toISOString().slice(0, 10),
      label: DAY_LABELS[d.getDay()],
    });
  }
  return buckets;
}

function staffActivityFromLogs(logs: DbActivityLog[]): ChartDataPoint[] {
  const counts = new Map<string, number>();
  for (const log of logs) {
    const name = log.user_name ?? "Unknown";
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([label, value]) => ({ label, value }));
}

function dailyCounts(
  rows: { created_at: string }[],
  buckets: { key: string; label: string }[]
): ChartDataPoint[] {
  const counts = new Map(buckets.map((b) => [b.key, 0]));
  for (const row of rows) {
    const key = row.created_at.slice(0, 10);
    if (counts.has(key)) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return buckets.map((b) => ({ label: b.label, value: counts.get(b.key) ?? 0 }));
}

function dailyPaymentTotals(
  rows: { created_at: string; amount: number }[],
  buckets: { key: string; label: string }[]
): ChartDataPoint[] {
  const totals = new Map(buckets.map((b) => [b.key, 0]));
  for (const row of rows) {
    const key = row.created_at.slice(0, 10);
    if (totals.has(key)) {
      totals.set(key, (totals.get(key) ?? 0) + Number(row.amount));
    }
  }
  return buckets.map((b) => ({ label: b.label, value: totals.get(b.key) ?? 0 }));
}

export async function computeAuditDashboardData(deps: {
  activityLogs: IActivityLogRepository;
  reservations: IReservationRepository;
  payments: IPaymentRepository;
  invoices: IInvoiceRepository;
  rooms: IRoomRepository;
  users: IUserRepository;
}): Promise<AuditDashboardData> {
  const [logPage, reservationRows, paymentRows, invoiceRows, roomRows, staffRows] =
    await Promise.all([
      deps.activityLogs.findAll(undefined, { page: 1, pageSize: 500 }),
      deps.reservations.getAll(),
      deps.payments.getAll(),
      deps.invoices.getAll(),
      deps.rooms.getAll(false),
      deps.users.findAllStaff(),
    ]);

  const logs = logPage.data;
  const buckets = last7DayBuckets();
  const today = new Date().toISOString().slice(0, 10);

  const reservationsToday = reservationRows.filter((r) =>
    isToday(r.created_at)
  ).length;
  const paymentsToday = paymentRows.filter((p) => isToday(p.created_at)).length;
  const revenueToday = paymentRows
    .filter((p) => isToday(p.created_at))
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const checkInsToday = reservationRows.filter(
    (r) => r.checked_in_at && isToday(r.checked_in_at)
  ).length;
  const checkOutsToday = reservationRows.filter(
    (r) => r.checked_out_at && isToday(r.checked_out_at)
  ).length;

  const staffActivityChart = staffActivityFromLogs(logs);
  const mostActiveStaff = staffActivityChart[0]?.label ?? "—";

  const paymentActivityChart = dailyPaymentTotals(paymentRows, buckets);
  const highestRevenueDay =
    [...paymentActivityChart].sort((a, b) => b.value - a.value)[0]?.label ?? "—";

  const reservationsActivityChart = dailyCounts(reservationRows, buckets);

  const floorCounts = new Map<string, number>();
  for (const room of roomRows) {
    if (room.status === "occupied") {
      floorCounts.set(
        resolveFloorLabel(room),
        (floorCounts.get(resolveFloorLabel(room)) ?? 0) + 1
      );
    }
  }
  const mostOccupiedFloor =
    [...floorCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  const mostPopularRoomType = resolveMostPopularRoomTypeName(reservationRows);

  const outstandingBalances = invoiceRows
    .filter((inv) => inv.status === "outstanding" || inv.status === "partial")
    .reduce((sum, inv) => sum + Number(inv.balance), 0);

  const inHouse = reservationRows.filter((r) => r.status === "checked_in").length;
  const pendingArrivals = reservationRows.filter(
    (r) => r.status === "confirmed" && r.check_in_date >= today
  ).length;

  const staffActivityScore = Math.min(
    100,
    Math.round((logs.filter((l) => isToday(l.created_at)).length / Math.max(staffRows.length, 1)) * 10)
  );

  return {
    kpis: {
      reservationsToday,
      paymentsToday,
      revenueToday,
      checkInsToday,
      checkOutsToday,
      staffActivityScore,
    },
    staffActivityChart,
    reservationsActivityChart,
    paymentActivityChart,
    insights: {
      mostActiveStaff,
      highestRevenueDay,
      mostOccupiedFloor,
      mostPopularRoomType,
      outstandingBalances,
      operationalSummary: `As of ${today}, ${inHouse} guests in-house with ${pendingArrivals} arrivals pending. ${staffRows.length} staff accounts active in the system.`,
    },
  };
}
