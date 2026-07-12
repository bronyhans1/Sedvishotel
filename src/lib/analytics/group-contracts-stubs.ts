import type { GroupDashboardContract } from "@/types/group-dashboard";
import type { GroupReportsContract } from "@/types/group-reports";

export const EMPTY_GROUP_REPORTS: GroupReportsContract = {
  corporateRevenue: [],
  groupRevenue: [],
  corporateOutstanding: [],
  groupSizeMetrics: {
    averageGroupSize: 0,
    averageRoomsPerGroup: 0,
    totalGroups: 0,
  },
  upcomingGroups: [],
  currentGroups: [],
  historicalGroups: [],
};

export const EMPTY_GROUP_DASHBOARD: GroupDashboardContract = {
  groupsInHouse: { count: 0, totalRooms: 0, totalGuests: 0, groups: [] },
  groupsArrivingToday: { count: 0, totalExpectedRooms: 0, groups: [] },
  groupsDeparting: { count: 0, groups: [] },
  corporateOutstanding: { totalOutstanding: 0, accountCount: 0, accounts: [] },
  reservationBlocks: { activeBlockCount: 0, expiringWithin24h: 0, blocks: [] },
  groupHealthSummary: { healthy: 0, attention: 0, critical: 0, total: 0 },
  vipArrivals: { count: 0, groups: [] },
};
