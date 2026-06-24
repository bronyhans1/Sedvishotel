import { MOCK_TODAY } from "@/config/mock-dates";
import { mockRevenueData } from "@/lib/mock-data/revenue";
import { reservationReport } from "@/lib/mock-data/reports";
import type { ChartDataPoint } from "@/types/revenue";

export const auditKpis = {
  reservationsToday: 5,
  paymentsToday: 4,
  revenueToday: mockRevenueData.kpis.revenueToday,
  checkInsToday: 3,
  checkOutsToday: 2,
  staffActivityScore: 87,
};

export const staffActivityChart: ChartDataPoint[] = [
  { label: "Alexandra", value: 24 },
  { label: "Kwabena", value: 18 },
  { label: "Efua", value: 32 },
  { label: "Adjoa", value: 28 },
  { label: "Samuel", value: 15 },
];

export const reservationsActivityChart: ChartDataPoint[] = [
  { label: "Mon", value: 3 },
  { label: "Tue", value: 5 },
  { label: "Wed", value: 4 },
  { label: "Thu", value: 6 },
  { label: "Fri", value: 8 },
  { label: "Sat", value: 7 },
  { label: "Sun", value: 4 },
];

export const paymentActivityChart: ChartDataPoint[] = [
  { label: "Mon", value: 2100 },
  { label: "Tue", value: 1375 },
  { label: "Wed", value: 3200 },
  { label: "Thu", value: 1850 },
  { label: "Fri", value: 4100 },
  { label: "Sat", value: 5200 },
  { label: "Sun", value: 2400 },
];

export const auditInsights = {
  mostActiveStaff: "Efua Mensah",
  highestRevenueDay: "Saturday",
  mostOccupiedFloor: "Second Floor",
  mostPopularRoomType: "Standard Double",
  outstandingBalances: 5481,
  operationalSummary: `As of ${MOCK_TODAY}, ${reservationReport.checkedIn} guests in-house with ${reservationReport.confirmed} arrivals pending. Housekeeping turnaround on track.`,
};
