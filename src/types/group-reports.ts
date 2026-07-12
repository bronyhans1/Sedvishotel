/**
 * Report contracts for group / corporate analytics (Wave 2 — no UI).
 */

export type CorporateRevenueReportRow = {
  corporateAccountId: string;
  companyName: string;
  revenue: number;
  reservationCount: number;
  groupCount: number;
};

export type GroupRevenueReportRow = {
  groupId: string;
  groupNumber: string;
  groupName: string;
  revenue: number;
  roomCount: number;
  guestCount: number;
};

export type CorporateOutstandingRow = {
  corporateAccountId: string;
  companyName: string;
  outstandingBalance: number;
  creditLimit: number | null;
  groupCount: number;
};

export type GroupSizeMetric = {
  averageGroupSize: number;
  averageRoomsPerGroup: number;
  totalGroups: number;
};

export type GroupListReportRow = {
  groupId: string;
  groupNumber: string;
  groupName: string;
  groupType: string;
  status: string;
  arrivalDate: string;
  departureDate: string;
  expectedRooms: number;
  actualRooms: number;
  corporateAccountName: string | null;
};

export type GroupReportsContract = {
  corporateRevenue: CorporateRevenueReportRow[];
  groupRevenue: GroupRevenueReportRow[];
  corporateOutstanding: CorporateOutstandingRow[];
  groupSizeMetrics: GroupSizeMetric;
  upcomingGroups: GroupListReportRow[];
  currentGroups: GroupListReportRow[];
  historicalGroups: GroupListReportRow[];
};
