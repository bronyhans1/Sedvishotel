import { PAYMENT_METHOD_LABELS } from "@/lib/analytics/payment-labels";
import { computeDiscountAnalytics } from "@/lib/analytics/discount-analytics";
import { computeOccupancyRate } from "@/lib/occupancy";
import type { Invoice } from "@/types/invoice";
import type { Payment } from "@/types/payment";
import type { Reservation } from "@/types/reservation";
import type { ChartDataPoint, RevenueData, DiscountRevenueMetrics } from "@/types/revenue";
import type { Room } from "@/types/room";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isCountablePayment(payment: Payment): boolean {
  return payment.netPaid > 0;
}

function paymentNetRevenue(payment: Payment): number {
  return payment.netPaid;
}

function paymentRevenueInRange(
  payments: Payment[],
  start: Date,
  end?: Date
): number {
  return payments
    .filter(isCountablePayment)
    .filter((p) => {
      const d = new Date(p.paymentDate);
      return d >= start && (!end || d <= end);
    })
    .reduce((sum, p) => sum + paymentNetRevenue(p), 0);
}

export function computeRevenueData(input: {
  payments: Payment[];
  invoices: Invoice[];
  reservations: Reservation[];
  rooms: Room[];
  asOf?: Date;
}): RevenueData {
  const now = input.asOf ?? new Date();
  const today = now.toISOString().slice(0, 10);
  const weekStart = startOfWeek(now);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const countable = input.payments.filter(isCountablePayment);

  const revenueToday = countable
    .filter((p) => p.paymentDate === today)
    .reduce((sum, p) => sum + paymentNetRevenue(p), 0);

  const revenueWeek = paymentRevenueInRange(input.payments, weekStart);
  const revenueMonth = paymentRevenueInRange(input.payments, monthStart);
  const revenueYear = paymentRevenueInRange(input.payments, yearStart);

  const outstandingBalances = input.reservations
    .filter((r) => r.status !== "cancelled")
    .reduce((sum, r) => sum + r.balance, 0);

  const paidInvoices = input.invoices.filter((i) => i.status === "paid").length;
  const unpaidInvoices = input.invoices.filter(
    (i) => i.status === "outstanding" || i.status === "partial"
  ).length;

  const monthlyTrend: ChartDataPoint[] = [];
  for (let i = 5; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(
      monthDate.getFullYear(),
      monthDate.getMonth() + 1,
      0,
      23,
      59,
      59
    );
    monthlyTrend.push({
      label: MONTH_LABELS[monthDate.getMonth()],
      value: paymentRevenueInRange(input.payments, monthDate, monthEnd),
    });
  }

  const weeklyTrend: ChartDataPoint[] = WEEKDAY_LABELS.map((label, index) => {
    const dayOffset = index === 0 ? 6 : index - 1;
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + dayOffset);
    const dayStr = day.toISOString().slice(0, 10);
    const value = countable
      .filter((p) => p.paymentDate === dayStr)
      .reduce((sum, p) => sum + paymentNetRevenue(p), 0);
    return { label, value };
  });

  const reservationById = new Map(
    input.reservations.map((r) => [r.id, r])
  );

  const roomTypeTotals = new Map<string, number>();
  for (const payment of countable) {
    const reservation = reservationById.get(payment.reservationId);
    const typeName = reservation?.roomTypeName ?? "Unknown";
    roomTypeTotals.set(typeName, (roomTypeTotals.get(typeName) ?? 0) + paymentNetRevenue(payment));
  }

  const byRoomType: ChartDataPoint[] = [...roomTypeTotals.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  const methodTotals = new Map<string, number>();
  for (const payment of input.payments) {
    if (payment.timeline.length > 0) {
      for (const entry of payment.timeline) {
        const label = PAYMENT_METHOD_LABELS[entry.method] ?? entry.method;
        methodTotals.set(label, (methodTotals.get(label) ?? 0) + entry.amount);
      }
      continue;
    }

    if (!isCountablePayment(payment)) continue;
    const label = PAYMENT_METHOD_LABELS[payment.method] ?? payment.method;
    methodTotals.set(label, (methodTotals.get(label) ?? 0) + paymentNetRevenue(payment));
  }

  const byPaymentMethod: ChartDataPoint[] = [...methodTotals.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  const soldNights = input.reservations
    .filter((r) => r.status !== "cancelled")
    .reduce((sum, r) => sum + r.numberOfNights, 0);
  const roomRevenue = input.reservations
    .filter((r) => r.status !== "cancelled")
    .reduce((sum, r) => sum + r.subtotal, 0);
  const averageDailyRate =
    soldNights > 0 ? Math.round(roomRevenue / soldNights) : 0;

  const roomTypeReservationCounts = new Map<string, number>();
  for (const reservation of input.reservations) {
    if (reservation.status === "cancelled") continue;
    roomTypeReservationCounts.set(
      reservation.roomTypeName,
      (roomTypeReservationCounts.get(reservation.roomTypeName) ?? 0) + 1
    );
  }

  const guestSpend = new Map<string, number>();
  for (const payment of countable) {
    guestSpend.set(
      payment.guestId,
      (guestSpend.get(payment.guestId) ?? 0) + paymentNetRevenue(payment)
    );
  }
  const averageGuestSpend =
    guestSpend.size > 0
      ? Math.round(
          [...guestSpend.values()].reduce((s, v) => s + v, 0) / guestSpend.size
        )
      : 0;

  const bestPerformingRoomType =
    byRoomType[0]?.label ?? "—";
  const highestRevenueDay =
    [...weeklyTrend].sort((a, b) => b.value - a.value)[0]?.label ?? "—";
  const mostPopularRoomType =
    [...roomTypeReservationCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ??
    "—";

  const discountAnalytics = computeDiscountAnalytics(input.reservations);
  const discountMetrics: DiscountRevenueMetrics = {
    rackRevenue: discountAnalytics.rackRevenue,
    netRevenue: discountAnalytics.netRevenue,
    discountGiven: discountAnalytics.discountGiven,
    overrideAmount: discountAnalytics.overrideAmount,
    averageDiscountPercent: discountAnalytics.averageDiscountPercent,
  };

  return {
    kpis: {
      revenueToday,
      revenueWeek,
      revenueMonth,
      revenueYear,
      averageDailyRate,
      occupancyRate: computeOccupancyRate(input.rooms),
      outstandingBalances,
      paidInvoices,
      unpaidInvoices,
      ...discountMetrics,
    },
    monthlyTrend,
    weeklyTrend,
    byRoomType,
    byPaymentMethod,
    discountByPricingMode: discountAnalytics.byPricingMode,
    discountByOverrideReason: discountAnalytics.byOverrideReason,
    insights: {
      bestPerformingRoomType,
      highestRevenueDay,
      averageGuestSpend,
      mostPopularRoomType,
    },
  };
}
