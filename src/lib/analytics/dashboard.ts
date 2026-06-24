import { buildDashboardStats } from "@/lib/dashboard-stats";
import { getTodayDateString } from "@/lib/dates/today";
import { computeOccupancyFromRooms } from "@/lib/occupancy";
import { computePaymentStats } from "@/lib/payments/stats";
import type { DbActivityLog } from "@/types/database";
import type { DashboardHomeData } from "@/types/dashboard-home";
import type { Guest } from "@/types/guest";
import type { Invoice } from "@/types/invoice";
import type { Payment } from "@/types/payment";
import type { Reservation } from "@/types/reservation";
import type { Room } from "@/types/room";

function formatTime(value: string): string {
  return new Date(value).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function mapActivityFromReservation(reservation: Reservation): DashboardHomeData["recentActivity"][0] {
  const action =
    reservation.status === "checked_in"
      ? "Check-in"
      : reservation.status === "checked_out"
        ? "Check-out"
        : "Reservation";
  return {
    id: reservation.id,
    guest: reservation.guestName,
    room: reservation.roomNumber,
    action,
    time: formatTime(reservation.createdAt),
  };
}

function mapStaffLog(log: DbActivityLog): DashboardHomeData["staffLogs"][0] {
  return {
    id: log.id,
    user: log.user_name ?? "System",
    action: log.action,
    time: formatTime(log.created_at),
  };
}

export function computeDashboardHomeData(input: {
  rooms: Room[];
  reservations: Reservation[];
  payments: Payment[];
  invoices: Invoice[];
  guests: Guest[];
  activityLogs: DbActivityLog[];
  showFinancials: boolean;
  asOfDate?: string;
}): DashboardHomeData {
  const today = input.asOfDate ?? getTodayDateString();
  const occupancy = computeOccupancyFromRooms(input.rooms);
  const paymentStats = computePaymentStats(input.payments);

  const pendingCheckIns = input.reservations.filter(
    (r) =>
      r.status === "confirmed" &&
      r.checkInDate <= today
  ).length;

  const pendingCheckOuts = input.reservations.filter(
    (r) => r.status === "checked_in" && r.checkOutDate <= today
  ).length;

  const activeStays = input.reservations.filter(
    (r) => r.status === "checked_in"
  ).length;

  const checkInsToday = input.reservations.filter(
    (r) =>
      r.checkInDate === today &&
      r.status !== "cancelled" &&
      r.status !== "no_show"
  ).length;

  const checkOutsToday = input.reservations.filter(
    (r) => r.checkOutDate === today && r.status === "checked_in"
  ).length;

  const stats = buildDashboardStats({
    rooms: input.rooms,
    revenueToday: paymentStats.revenueToday,
    checkInsToday,
    checkOutsToday,
  });

  const recentPayments = [...input.payments]
    .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate))
    .slice(0, 5);

  const recentReservations = [...input.reservations]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  const recentActivity = recentReservations
    .slice(0, 4)
    .map(mapActivityFromReservation);

  const staffLogs = input.activityLogs.slice(0, 4).map(mapStaffLog);

  const outstandingTasks: DashboardHomeData["outstandingTasks"] = [];
  if (occupancy.cleaning > 0) {
    outstandingTasks.push({
      id: "cleaning",
      label: `${occupancy.cleaning} room(s) awaiting cleaning`,
      href: "/dashboard/housekeeping",
    });
  }
  if (pendingCheckOuts > 0) {
    outstandingTasks.push({
      id: "checkout",
      label: `${pendingCheckOuts} pending check-out(s)`,
      href: "/dashboard/check-out",
    });
  }
  if (paymentStats.outstandingBalances > 0) {
    outstandingTasks.push({
      id: "balances",
      label: "Review outstanding guest balances",
      href: "/dashboard/payments",
    });
  }

  const operationalAlerts: DashboardHomeData["operationalAlerts"] = [];
  if (paymentStats.outstandingBalances > 0 && input.showFinancials) {
    operationalAlerts.push({
      id: "balances",
      message: "Outstanding guest balances require attention",
      severity: "critical",
    });
  }
  if (occupancy.cleaning > 0) {
    operationalAlerts.push({
      id: "cleaning",
      message: `${occupancy.cleaning} room(s) awaiting inspection`,
      severity: "medium",
    });
  }
  if (pendingCheckIns > 0) {
    operationalAlerts.push({
      id: "checkin",
      message: `${pendingCheckIns} pending check-in(s) for today`,
      severity: "low",
    });
  }

  return {
    stats,
    occupancy,
    paymentStats,
    revenueMonth: paymentStats.revenueMonth,
    pendingCheckIns,
    pendingCheckOuts,
    activeStays,
    recentPayments,
    recentReservations,
    recentActivity,
    staffLogs,
    outstandingTasks,
    operationalAlerts,
    showFinancials: input.showFinancials,
  };
}
