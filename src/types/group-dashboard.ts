/**
 * Dashboard widget contracts for group / corporate (Wave 2 — no UI).
 */

export type GroupsInHouseWidget = {
  count: number;
  totalRooms: number;
  totalGuests: number;
  groups: Array<{
    groupId: string;
    groupNumber: string;
    groupName: string;
    roomsInHouse: number;
  }>;
};

export type GroupsArrivingTodayWidget = {
  count: number;
  totalExpectedRooms: number;
  groups: Array<{
    groupId: string;
    groupNumber: string;
    groupName: string;
    expectedRooms: number;
    arrivalDate: string;
  }>;
};

export type GroupsDepartingWidget = {
  count: number;
  groups: Array<{
    groupId: string;
    groupNumber: string;
    groupName: string;
    departureDate: string;
    roomsDeparting: number;
  }>;
};

export type CorporateOutstandingWidget = {
  totalOutstanding: number;
  accountCount: number;
  accounts: Array<{
    corporateAccountId: string;
    companyName: string;
    outstandingBalance: number;
    creditLimit: number | null;
  }>;
};

export type ReservationBlocksWidget = {
  activeBlockCount: number;
  expiringWithin24h: number;
  blocks: Array<{
    blockId: string;
    groupNumber: string;
    roomNumber: string;
    holdUntil: string;
    status: string;
  }>;
};

export type GroupHealthSummaryWidget = {
  healthy: number;
  attention: number;
  critical: number;
  total: number;
};

export type VipArrivalsWidget = {
  count: number;
  groups: Array<{
    groupId: string;
    groupNumber: string;
    groupName: string;
    vipCount: number;
  }>;
};

export type GroupDashboardContract = {
  groupsInHouse: GroupsInHouseWidget;
  groupsArrivingToday: GroupsArrivingTodayWidget;
  groupsDeparting: GroupsDepartingWidget;
  corporateOutstanding: CorporateOutstandingWidget;
  reservationBlocks: ReservationBlocksWidget;
  groupHealthSummary: GroupHealthSummaryWidget;
  vipArrivals: VipArrivalsWidget;
};
