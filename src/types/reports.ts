import type { ChartDataPoint } from "@/types/revenue";

export type OccupancyReport = {
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  reservedRooms: number;
  cleaningRooms: number;
  maintenanceRooms: number;
  occupancyPercentage: number;
  floorBreakdown: { floor: string; occupied: number; total: number }[];
};

export type RevenueReport = {
  daily: number;
  weekly: number;
  monthly: number;
  yearly: number;
  outstandingBalances: number;
  paidInvoices: number;
  unpaidInvoices: number;
};

export type GuestReport = {
  totalGuests: number;
  returningGuests: number;
  vipGuests: number;
  averageStayDuration: number;
};

export type ReservationReport = {
  pending: number;
  confirmed: number;
  checkedIn: number;
  checkedOut: number;
  cancelled: number;
  noShow: number;
};

export type PaymentReport = {
  byMethod: ChartDataPoint[];
  outstandingBalances: number;
  refundSummary: { count: number; amount: number };
  vatCollected: number;
  vatExemptRevenue: number;
  vatOverrideCount: number;
};

export type ReportCard = {
  id: string;
  title: string;
  description: string;
  href: string;
};

export type ReportsData = {
  cards: ReportCard[];
  occupancy: OccupancyReport;
  revenue: RevenueReport;
  guests: GuestReport;
  reservations: ReservationReport;
  payments: PaymentReport;
};
