export type RevenueKpis = {
  revenueToday: number;
  revenueWeek: number;
  revenueMonth: number;
  revenueYear: number;
  averageDailyRate: number;
  occupancyRate: number;
  outstandingBalances: number;
  paidInvoices: number;
  unpaidInvoices: number;
};

export type ChartDataPoint = {
  label: string;
  value: number;
};

export type RevenueInsights = {
  bestPerformingRoomType: string;
  highestRevenueDay: string;
  averageGuestSpend: number;
  mostPopularRoomType: string;
};

export type RevenueData = {
  kpis: RevenueKpis;
  monthlyTrend: ChartDataPoint[];
  weeklyTrend: ChartDataPoint[];
  byRoomType: ChartDataPoint[];
  byPaymentMethod: ChartDataPoint[];
  insights: RevenueInsights;
};
