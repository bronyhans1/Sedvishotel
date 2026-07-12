/**
 * Analytics/report backend contracts for group & corporate modules.
 */

import { mapDbCorporateAccountToCorporateAccount } from "@/lib/corporate/mapper";
import { mapDbGroupReservationToGroupReservation } from "@/lib/group-reservations/mapper";
import { mapDbReservationBlockToReservationBlock } from "@/lib/group-reservations/block-mapper";
import { getCorporateAccountService, getCorporateAccountServiceClient } from "@/lib/corporate/get-corporate-account-service";
import { getGroupReservationService } from "@/lib/group-reservations/get-group-reservation-service";
import { SupabaseCorporateAccountRepository } from "@/repositories/supabase/corporate-account.repository";
import { SupabaseGroupReservationRepository } from "@/repositories/supabase/group-reservation.repository";
import { SupabaseReservationBlockRepository } from "@/repositories/supabase/reservation-block.repository";
import { buildGroupOperationalIntelligence } from "@/lib/group-reservations/operational-intelligence";
import { buildGroupOperationsOverview } from "@/lib/group-reservations/operations-overview";
import { summarizeGroupHealthSummary } from "@/lib/corporate/corporate-insights";
import { SupabaseGroupTimelineRepository } from "@/repositories/supabase/group-timeline.repository";
import type { GroupDashboardContract } from "@/types/group-dashboard";
import type { GroupReportsContract } from "@/types/group-reports";
import type { AuthSession } from "@/services/auth.service";
import type { ServiceContext } from "@/services/types";
import { sessionHasPermission } from "@/lib/auth/permissions";

export type GroupAnalyticsContracts = {
  reports: GroupReportsContract;
  dashboard: GroupDashboardContract;
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function loadGroupDashboardContract(
  ctx: ServiceContext,
  session: AuthSession
): Promise<GroupDashboardContract> {
  const empty: GroupDashboardContract = {
    groupsInHouse: { count: 0, totalRooms: 0, totalGuests: 0, groups: [] },
    groupsArrivingToday: { count: 0, totalExpectedRooms: 0, groups: [] },
    groupsDeparting: { count: 0, groups: [] },
    corporateOutstanding: { totalOutstanding: 0, accountCount: 0, accounts: [] },
    reservationBlocks: { activeBlockCount: 0, expiringWithin24h: 0, blocks: [] },
    groupHealthSummary: { healthy: 0, attention: 0, critical: 0, total: 0 },
    vipArrivals: { count: 0, groups: [] },
  };

  if (!sessionHasPermission(session, "group_reservations", "view")) {
    return empty;
  }

  const client = await getCorporateAccountServiceClient();
  const groups = new SupabaseGroupReservationRepository(client);
  const blocks = new SupabaseReservationBlockRepository(client);
  const corporate = new SupabaseCorporateAccountRepository(client);
  const corpService = await getCorporateAccountService();

  const today = todayIso();
  const allGroups = (await groups.list()).map(mapDbGroupReservationToGroupReservation);

  const inHouse = allGroups.filter(
    (g) => g.status === "in_house" || g.status === "partially_checked_in"
  );
  const arriving = allGroups.filter(
    (g) => g.arrivalDate === today && g.status !== "cancelled" && g.status !== "closed"
  );
  const departing = allGroups.filter(
    (g) =>
      g.departureDate === today &&
      (g.status === "in_house" || g.status === "partially_checked_out")
  );

  const groupsInHouse = {
    count: inHouse.length,
    totalRooms: inHouse.reduce((s, g) => s + g.actualRooms, 0),
    totalGuests: inHouse.reduce((s, g) => s + g.actualGuests, 0),
    groups: inHouse.map((g) => ({
      groupId: g.id,
      groupNumber: g.groupNumber,
      groupName: g.groupName,
      roomsInHouse: g.actualRooms,
    })),
  };

  const groupsArrivingToday = {
    count: arriving.length,
    totalExpectedRooms: arriving.reduce((s, g) => s + g.expectedRooms, 0),
    groups: arriving.map((g) => ({
      groupId: g.id,
      groupNumber: g.groupNumber,
      groupName: g.groupName,
      expectedRooms: g.expectedRooms,
      arrivalDate: g.arrivalDate,
    })),
  };

  const groupsDeparting = {
    count: departing.length,
    groups: departing.map((g) => ({
      groupId: g.id,
      groupNumber: g.groupNumber,
      groupName: g.groupName,
      departureDate: g.departureDate,
      roomsDeparting: g.actualRooms,
    })),
  };

  let corporateOutstanding = empty.corporateOutstanding;
  if (sessionHasPermission(session, "corporate_accounts", "view")) {
    const corpRows = await corporate.list({ status: "active" });
    const accounts: GroupDashboardContract["corporateOutstanding"]["accounts"] = [];
    let totalOutstanding = 0;

    for (const row of corpRows) {
      const corp = mapDbCorporateAccountToCorporateAccount(row);
      const balance = await corpService.getOutstandingBalance(ctx, session, corp.id);
      if (balance > 0) {
        totalOutstanding += balance;
        accounts.push({
          corporateAccountId: corp.id,
          companyName: corp.companyName,
          outstandingBalance: balance,
          creditLimit: corp.creditLimit,
        });
      }
    }

    corporateOutstanding = {
      totalOutstanding,
      accountCount: accounts.length,
      accounts: accounts.slice(0, 5),
    };
  }

  const allBlocks = [];
  for (const g of allGroups) {
    const groupBlocks = (await blocks.listByGroup(g.id)).map(
      mapDbReservationBlockToReservationBlock
    );
    for (const b of groupBlocks) {
      if (b.status === "blocked") {
        allBlocks.push({ block: b, groupNumber: g.groupNumber });
      }
    }
  }

  const in24h = Date.now() + 24 * 60 * 60 * 1000;
  const expiringWithin24h = allBlocks.filter(
    (b) => new Date(b.block.holdUntil).getTime() <= in24h
  ).length;

  const reservationBlocks = {
    activeBlockCount: allBlocks.length,
    expiringWithin24h,
    blocks: allBlocks.slice(0, 8).map((b) => ({
      blockId: b.block.id,
      groupNumber: b.groupNumber,
      roomNumber: b.block.roomId.slice(0, 8),
      holdUntil: b.block.holdUntil,
      status: b.block.status,
    })),
  };

  const groupService = await getGroupReservationService();
  const timelineRepo = new SupabaseGroupTimelineRepository(client);
  const healthStatuses: Array<{ groupId: string; health: import("@/types/group-operational-intelligence").GroupHealthStatus }> = [];
  const vipArrivalGroups: GroupDashboardContract["vipArrivals"]["groups"] = [];

  for (const g of allGroups.filter((gr) => gr.arrivalDate === today || gr.status === "in_house")) {
    const summary = await groupService.getSummary(ctx, session, g.id);
    if (!summary) continue;
    const financial = await groupService.getFinancialSummary(ctx, session, g.id);
    const timelineEvents = await groupService.getTimeline(ctx, session, g.id);
    const overview = await buildGroupOperationsOverview(
      { groups, blocks, timeline: timelineRepo, corporate },
      g.id,
      summary,
      financial,
      timelineEvents
    );
    const blockRows = await blocks.listByGroup(g.id);
    const blockList = blockRows.map(mapDbReservationBlockToReservationBlock);
    const intel = buildGroupOperationalIntelligence(
      g.id,
      overview,
      blockList,
      timelineEvents,
      financial,
      null,
      0
    );
    healthStatuses.push({ groupId: g.id, health: intel.health.status });
    if (overview.vipArrivalsToday > 0) {
      vipArrivalGroups.push({
        groupId: g.id,
        groupNumber: g.groupNumber,
        groupName: g.groupName,
        vipCount: overview.vipArrivalsToday,
      });
    }
  }

  const groupHealthSummary = {
    ...summarizeGroupHealthSummary(healthStatuses),
    total: healthStatuses.length,
  };
  const vipArrivals = {
    count: vipArrivalGroups.reduce((s, g) => s + g.vipCount, 0),
    groups: vipArrivalGroups.slice(0, 8),
  };

  return {
    groupsInHouse,
    groupsArrivingToday,
    groupsDeparting,
    corporateOutstanding,
    reservationBlocks,
    groupHealthSummary,
    vipArrivals,
  };
}

export async function loadGroupReportsContract(
  ctx: ServiceContext,
  session: AuthSession
): Promise<GroupReportsContract> {
  const empty: GroupReportsContract = {
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

  if (!sessionHasPermission(session, "group_reservations", "view")) {
    return empty;
  }

  const client = await getCorporateAccountServiceClient();
  const groups = new SupabaseGroupReservationRepository(client);
  const corporate = new SupabaseCorporateAccountRepository(client);
  const groupService = await getGroupReservationService();
  const corpService = await getCorporateAccountService();

  const today = todayIso();
  const allGroupRows = await groups.list();
  const allGroups = allGroupRows.map(mapDbGroupReservationToGroupReservation);

  const groupRevenue = [];
  for (const g of allGroups.slice(0, 20)) {
    const financial = await groupService.getFinancialSummary(ctx, session, g.id);
    groupRevenue.push({
      groupId: g.id,
      groupNumber: g.groupNumber,
      groupName: g.groupName,
      revenue: financial?.totalCharges ?? 0,
      roomCount: g.actualRooms,
      guestCount: g.actualGuests,
    });
  }
  groupRevenue.sort((a, b) => b.revenue - a.revenue);

  const corporateRevenue = [];
  const corporateOutstanding = [];
  if (sessionHasPermission(session, "corporate_accounts", "view")) {
    const corpRows = await corporate.list({ status: "active" });
    for (const row of corpRows) {
      const corp = mapDbCorporateAccountToCorporateAccount(row);
      const linkedGroups = await corpService.getReservations(ctx, session, corp.id);
      const outstanding = await corpService.getOutstandingBalance(ctx, session, corp.id);
      let revenue = 0;
      for (const gr of linkedGroups) {
        const fin = await groupService.getFinancialSummary(ctx, session, gr.id);
        revenue += fin?.totalCharges ?? 0;
      }
      corporateRevenue.push({
        corporateAccountId: corp.id,
        companyName: corp.companyName,
        revenue,
        reservationCount: linkedGroups.length,
        groupCount: linkedGroups.length,
      });
      if (outstanding > 0) {
        corporateOutstanding.push({
          corporateAccountId: corp.id,
          companyName: corp.companyName,
          outstandingBalance: outstanding,
          creditLimit: corp.creditLimit,
          groupCount: linkedGroups.length,
        });
      }
    }
    corporateRevenue.sort((a, b) => b.revenue - a.revenue);
    corporateOutstanding.sort((a, b) => b.outstandingBalance - a.outstandingBalance);
  }

  const toReportRow = async (g: ReturnType<typeof mapDbGroupReservationToGroupReservation>) => {
    const summary = await groupService.getSummary(ctx, session, g.id);
    return {
      groupId: g.id,
      groupNumber: g.groupNumber,
      groupName: g.groupName,
      groupType: g.groupType,
      status: g.status,
      arrivalDate: g.arrivalDate,
      departureDate: g.departureDate,
      expectedRooms: g.expectedRooms,
      actualRooms: g.actualRooms,
      corporateAccountName: summary?.corporateAccountName ?? null,
    };
  };

  const upcomingGroups = (
    await Promise.all(
      allGroups
        .filter((g) => g.arrivalDate > today && g.status !== "cancelled")
        .slice(0, 10)
        .map(toReportRow)
    )
  ).flat();

  const currentGroups = (
    await Promise.all(
      allGroups
        .filter(
          (g) =>
            g.arrivalDate <= today &&
            g.departureDate >= today &&
            g.status !== "cancelled" &&
            g.status !== "closed"
        )
        .slice(0, 10)
        .map(toReportRow)
    )
  ).flat();

  const historicalGroups = (
    await Promise.all(
      allGroups
        .filter((g) => g.departureDate < today || g.status === "closed")
        .slice(0, 10)
        .map(toReportRow)
    )
  ).flat();

  const totalGroups = allGroups.length;
  const averageGroupSize =
    totalGroups > 0
      ? allGroups.reduce((s, g) => s + g.expectedGuests, 0) / totalGroups
      : 0;
  const averageRoomsPerGroup =
    totalGroups > 0
      ? allGroups.reduce((s, g) => s + g.expectedRooms, 0) / totalGroups
      : 0;

  return {
    corporateRevenue: corporateRevenue.slice(0, 10),
    groupRevenue: groupRevenue.slice(0, 10),
    corporateOutstanding: corporateOutstanding.slice(0, 10),
    groupSizeMetrics: {
      averageGroupSize: Math.round(averageGroupSize * 10) / 10,
      averageRoomsPerGroup: Math.round(averageRoomsPerGroup * 10) / 10,
      totalGroups,
    },
    upcomingGroups,
    currentGroups,
    historicalGroups,
  };
}

export async function getGroupAnalyticsContracts(
  ctx: ServiceContext,
  session: AuthSession
): Promise<GroupAnalyticsContracts> {
  const [reports, dashboard] = await Promise.all([
    loadGroupReportsContract(ctx, session),
    loadGroupDashboardContract(ctx, session),
  ]);
  return { reports, dashboard };
}

// Backward-compatible sync stub for imports that expect empty defaults
export { EMPTY_GROUP_REPORTS, EMPTY_GROUP_DASHBOARD } from "@/lib/analytics/group-contracts-stubs";
