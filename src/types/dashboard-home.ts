import type { OccupancyMetrics } from "@/lib/occupancy";
import type { DashboardStats } from "@/types";
import type { Payment, PaymentStats } from "@/types/payment";
import type { Reservation } from "@/types/reservation";

export type DashboardActivityItem = {
  id: string;
  guest: string;
  room: string;
  action: string;
  time: string;
};

export type DashboardStaffLogItem = {
  id: string;
  user: string;
  action: string;
  time: string;
};

export type DashboardTaskItem = {
  id: string;
  label: string;
  href: string;
};

export type DashboardAlertItem = {
  id: string;
  message: string;
  severity: "low" | "medium" | "critical";
};

export type DashboardHomeData = {
  stats: DashboardStats;
  occupancy: OccupancyMetrics;
  paymentStats: PaymentStats;
  revenueMonth: number;
  pendingCheckIns: number;
  pendingCheckOuts: number;
  activeStays: number;
  recentPayments: Payment[];
  recentReservations: Reservation[];
  recentActivity: DashboardActivityItem[];
  staffLogs: DashboardStaffLogItem[];
  outstandingTasks: DashboardTaskItem[];
  operationalAlerts: DashboardAlertItem[];
  showFinancials: boolean;
};
