import type { ChartDataPoint } from "@/types/revenue";

export type AuditKpis = {
  reservationsToday: number;
  paymentsToday: number;
  revenueToday: number;
  checkInsToday: number;
  checkOutsToday: number;
  staffActivityScore: number;
};

export type AuditInsights = {
  mostActiveStaff: string;
  highestRevenueDay: string;
  mostOccupiedFloor: string;
  mostPopularRoomType: string;
  outstandingBalances: number;
  operationalSummary: string;
};

export type AuditDashboardData = {
  kpis: AuditKpis;
  staffActivityChart: ChartDataPoint[];
  reservationsActivityChart: ChartDataPoint[];
  paymentActivityChart: ChartDataPoint[];
  insights: AuditInsights;
};
