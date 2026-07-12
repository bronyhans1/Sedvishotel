export type DiscountRevenueMetrics = {
  rackRevenue: number;
  netRevenue: number;
  discountGiven: number;
  overrideAmount: number;
  averageDiscountPercent: number;
};

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
} & DiscountRevenueMetrics;

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
  discountByPricingMode: ChartDataPoint[];
  discountByOverrideReason: ChartDataPoint[];
  insights: RevenueInsights;
};
