import { computeRevenueData } from "@/lib/analytics/revenue";
import { roundCurrency } from "@/lib/payments/currency";
import { computeFloorBreakdown, computeOccupancyFromRooms } from "@/lib/occupancy";
import { resolveEffectiveCheckOutDate } from "@/lib/reservations/effective-checkout-date";
import type { Guest } from "@/types/guest";
import type { Invoice } from "@/types/invoice";
import type { Payment } from "@/types/payment";
import type { Reservation } from "@/types/reservation";
import type { ReportsData } from "@/types/reports";
import type { Room } from "@/types/room";
import { nightsBetween } from "@/lib/utils";

export const REPORT_CARDS: ReportsData["cards"] = [
  {
    id: "occupancy",
    title: "Occupancy Report",
    description: "Room utilization and floor breakdown",
    href: "/dashboard/reports#occupancy",
  },
  {
    id: "revenue",
    title: "Revenue Report",
    description: "Daily, weekly, monthly, and yearly revenue",
    href: "/dashboard/reports#revenue",
  },
  {
    id: "guests",
    title: "Guest Report",
    description: "Guest demographics and loyalty metrics",
    href: "/dashboard/reports#guests",
  },
  {
    id: "reservations",
    title: "Reservation Report",
    description: "Booking pipeline and status summary",
    href: "/dashboard/reports#reservations",
  },
  {
    id: "housekeeping",
    title: "Housekeeping Report",
    description: "Cleaning status and turnaround times",
    href: "/dashboard/housekeeping",
  },
  {
    id: "payments",
    title: "Payment Report",
    description: "Collections, balances, and refunds",
    href: "/dashboard/reports#payments",
  },
];

export function computeReportsData(input: {
  rooms: Room[];
  reservations: Reservation[];
  guests: Guest[];
  payments: Payment[];
  invoices: Invoice[];
}): ReportsData {
  const occupancy = computeOccupancyFromRooms(input.rooms);
  const revenue = computeRevenueData({
    payments: input.payments,
    invoices: input.invoices,
    reservations: input.reservations,
    rooms: input.rooms,
  });

  const stayDurations = input.reservations
    .filter((r) => r.status !== "cancelled")
    .map((r) =>
      nightsBetween(r.checkInDate, resolveEffectiveCheckOutDate(r))
    );
  const averageStayDuration =
    stayDurations.length > 0
      ? Math.round(
          (stayDurations.reduce((s, n) => s + n, 0) / stayDurations.length) * 10
        ) / 10
      : 0;

  const refundedPayments = input.payments.filter((p) => p.totalRefunded > 0);

  let vatCollected = 0;
  let vatExemptRevenue = 0;
  let vatOverrideCount = 0;
  for (const payment of input.payments) {
    for (const entry of payment.timeline) {
      if (entry.kind !== "payment" || entry.amount <= 0) continue;
      if (entry.vatApplied === false) {
        vatExemptRevenue = roundCurrency(vatExemptRevenue + entry.amount);
        vatOverrideCount += 1;
      } else if ((entry.vatAmount ?? 0) > 0) {
        vatCollected = roundCurrency(vatCollected + (entry.vatAmount ?? 0));
      }
    }
  }

  return {
    cards: REPORT_CARDS,
    occupancy: {
      totalRooms: occupancy.total,
      occupiedRooms: occupancy.occupied,
      availableRooms: occupancy.available,
      reservedRooms: occupancy.reserved,
      cleaningRooms: occupancy.cleaning,
      maintenanceRooms: occupancy.maintenance,
      occupancyPercentage: occupancy.occupancyRate,
      floorBreakdown: computeFloorBreakdown(input.rooms).map((f) => ({
        floor: f.floor,
        occupied: f.occupied,
        total: f.total,
      })),
    },
    revenue: {
      daily: revenue.kpis.revenueToday,
      weekly: revenue.kpis.revenueWeek,
      monthly: revenue.kpis.revenueMonth,
      yearly: revenue.kpis.revenueYear,
      outstandingBalances: revenue.kpis.outstandingBalances,
      paidInvoices: revenue.kpis.paidInvoices,
      unpaidInvoices: revenue.kpis.unpaidInvoices,
    },
    guests: {
      totalGuests: input.guests.length,
      returningGuests: input.guests.filter((g) => g.totalVisits > 1).length,
      vipGuests: input.guests.filter((g) => g.vipStatus).length,
      averageStayDuration,
    },
    reservations: {
      pending: input.reservations.filter((r) => r.status === "pending").length,
      confirmed: input.reservations.filter((r) => r.status === "confirmed").length,
      checkedIn: input.reservations.filter((r) => r.status === "checked_in").length,
      checkedOut: input.reservations.filter((r) => r.status === "checked_out").length,
      cancelled: input.reservations.filter((r) => r.status === "cancelled").length,
      noShow: input.reservations.filter((r) => r.status === "no_show").length,
    },
    payments: {
      byMethod: revenue.byPaymentMethod,
      outstandingBalances: revenue.kpis.outstandingBalances,
      refundSummary: {
        count: refundedPayments.length,
        amount: refundedPayments.reduce((sum, p) => sum + p.totalRefunded, 0),
      },
      vatCollected,
      vatExemptRevenue,
      vatOverrideCount,
    },
  };
}
