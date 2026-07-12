import { mapDbReservationBlockToReservationBlock } from "@/lib/group-reservations/block-mapper";
import { mapDbGroupReservationToGroupReservation } from "@/lib/group-reservations/mapper";
import { mapDbReservationToReservation } from "@/lib/reservations/mapper";
import type { ICorporateAccountRepository } from "@/repositories/corporate-account.repository";
import type { IGroupReservationRepository } from "@/repositories/group-reservation.repository";
import type { IGroupTimelineRepository } from "@/repositories/group-timeline.repository";
import type { IReservationBlockRepository } from "@/repositories/reservation-block.repository";
import type { GroupFinancialSummary, GroupReservationSummary } from "@/types/group-reservation";
import type { GroupTimelineEvent } from "@/types/group-timeline";
import type { Reservation } from "@/types/reservation";

export type GroupOperationsOverview = {
  group: GroupReservationSummary["group"];
  corporateAccountName: string | null;
  reservationCount: number;
  checkedInCount: number;
  checkedOutCount: number;
  remainingArrivals: number;
  roomsReserved: number;
  roomsAssigned: number;
  roomsOccupied: number;
  roomsRemaining: number;
  expectedGuests: number;
  adults: number;
  children: number;
  vipGuests: number;
  returningGuests: number;
  vipArrivalsToday: number;
  returningArrivalsToday: number;
  occupancyPercent: number;
  outstandingBalance: number;
  depositReceived: number;
  paymentsReceived: number;
  masterFolioBalance: number;
  openTasks: number;
  outstandingIssues: number;
  pendingCheckInsToday: number;
  pendingCheckOutsToday: number;
  upcomingDepartures: number;
  activeBlockCount: number;
  expiringBlocks: number;
  corporateCreditStatus: "ok" | "warning" | "exceeded" | "none";
  corporateOutstanding: number;
  corporateCreditLimit: number | null;
  recentActivity: GroupTimelineEvent[];
  reservations: Reservation[];
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function buildGroupOperationsOverview(
  deps: {
    groups: IGroupReservationRepository;
    blocks: IReservationBlockRepository;
    timeline: IGroupTimelineRepository;
    corporate: ICorporateAccountRepository;
  },
  groupId: string,
  summary: GroupReservationSummary,
  financial: GroupFinancialSummary | null,
  timelineEvents: GroupTimelineEvent[]
): Promise<GroupOperationsOverview> {
  const today = todayIso();
  const groupRow = await deps.groups.getById(groupId);
  const group = groupRow
    ? mapDbGroupReservationToGroupReservation(groupRow)
    : summary.group;

  const reservationRows = await deps.groups.listReservations(groupId);
  const reservations = reservationRows.map(mapDbReservationToReservation);

  const vipGuests = reservationRows.filter((r) => r.guest?.vip_status).length;
  const returningGuests = reservationRows.filter(
    (r) => (r.guest?.total_visits ?? 0) > 1
  ).length;
  const vipArrivalsToday = reservationRows.filter(
    (r) =>
      r.guest?.vip_status &&
      r.check_in_date === today &&
      r.status !== "cancelled" &&
      r.status !== "checked_out"
  ).length;
  const returningArrivalsToday = reservationRows.filter(
    (r) =>
      (r.guest?.total_visits ?? 0) > 1 &&
      r.check_in_date === today &&
      r.status !== "cancelled" &&
      r.status !== "checked_out"
  ).length;

  const issueCreated = timelineEvents.filter((e) => e.eventType === "issue_created").length;
  const issueClosed = timelineEvents.filter((e) => e.eventType === "issue_closed").length;
  const outstandingIssues = Math.max(0, issueCreated - issueClosed);

  const roomsAssigned = reservations.filter(
    (r) => r.roomNumber && r.status !== "cancelled"
  ).length;
  const roomsOccupied = reservations.filter((r) => r.status === "checked_in").length;
  const roomsReserved = summary.reservationCount;
  const roomsRemaining = Math.max(0, group.expectedRooms - roomsAssigned);

  const adults = reservations.reduce((s, r) => s + (r.adults ?? 0), 0);
  const children = reservations.reduce((s, r) => s + (r.children ?? 0), 0);

  const pendingCheckInsToday = reservations.filter(
    (r) =>
      (r.status === "confirmed" || r.status === "pending") &&
      r.checkInDate === today
  ).length;
  const pendingCheckOutsToday = reservations.filter(
    (r) => r.status === "checked_in" && r.checkOutDate === today
  ).length;
  const upcomingDepartures = reservations.filter(
    (r) => r.status === "checked_in" && r.checkOutDate > today
  ).length;

  const remainingArrivals = Math.max(
    0,
    group.expectedGuests - summary.checkedInCount - summary.checkedOutCount
  );

  const blockRows = await deps.blocks.listByGroup(groupId);
  const blocks = blockRows.map(mapDbReservationBlockToReservationBlock);
  const activeBlockCount = blocks.filter((b) => b.status === "blocked").length;
  const expiringBlocks = blocks.filter((b) => {
    if (b.status !== "blocked") return false;
    const hold = new Date(b.holdUntil).getTime();
    const in24h = Date.now() + 24 * 60 * 60 * 1000;
    return hold <= in24h;
  }).length;

  let corporateCreditStatus: GroupOperationsOverview["corporateCreditStatus"] = "none";
  let corporateOutstanding = 0;
  let corporateCreditLimit: number | null = null;

  if (group.corporateAccountId) {
    const corp = await deps.corporate.getById(group.corporateAccountId);
    if (corp) {
      corporateCreditLimit = corp.credit_limit != null ? Number(corp.credit_limit) : null;
      corporateOutstanding = financial?.outstandingBalance ?? 0;
      if (corporateCreditLimit != null) {
        if (corporateOutstanding > corporateCreditLimit) {
          corporateCreditStatus = "exceeded";
        } else if (corporateOutstanding > corporateCreditLimit * 0.8) {
          corporateCreditStatus = "warning";
        } else {
          corporateCreditStatus = "ok";
        }
      }
    }
  }

  const expectedGuests = group.expectedGuests || adults + children;
  const occupancyPercent =
    group.expectedRooms > 0
      ? Math.round((roomsOccupied / group.expectedRooms) * 100)
      : roomsReserved > 0
        ? Math.round((roomsOccupied / roomsReserved) * 100)
        : 0;

  return {
    group,
    corporateAccountName: summary.corporateAccountName,
    reservationCount: summary.reservationCount,
    checkedInCount: summary.checkedInCount,
    checkedOutCount: summary.checkedOutCount,
    remainingArrivals,
    roomsReserved,
    roomsAssigned,
    roomsOccupied,
    roomsRemaining,
    expectedGuests,
    adults,
    children,
    vipGuests,
    returningGuests,
    vipArrivalsToday,
    returningArrivalsToday,
    occupancyPercent,
    outstandingBalance: financial?.outstandingBalance ?? 0,
    depositReceived: financial?.totalPayments ?? 0,
    paymentsReceived: financial?.totalPayments ?? 0,
    masterFolioBalance: financial?.outstandingBalance ?? 0,
    openTasks: pendingCheckInsToday + pendingCheckOutsToday,
    outstandingIssues,
    pendingCheckInsToday,
    pendingCheckOutsToday,
    upcomingDepartures,
    activeBlockCount,
    expiringBlocks,
    corporateCreditStatus,
    corporateOutstanding,
    corporateCreditLimit,
    recentActivity: timelineEvents.slice(0, 8),
    reservations,
  };
}
