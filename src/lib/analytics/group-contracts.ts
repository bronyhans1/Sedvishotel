/**
 * Analytics/report backend contracts for group & corporate modules.
 */

import { mapDbCorporateAccountToCorporateAccount } from "@/lib/corporate/mapper";
import { mapDbGroupReservationToGroupReservation } from "@/lib/group-reservations/mapper";
import { mapDbReservationBlockToReservationBlock } from "@/lib/group-reservations/block-mapper";
import {
  getCorporateAccountService,
  getCorporateAccountServiceClient,
} from "@/lib/corporate/get-corporate-account-service";
import { SupabaseCorporateAccountRepository } from "@/repositories/supabase/corporate-account.repository";
import { SupabaseGroupReservationRepository } from "@/repositories/supabase/group-reservation.repository";
import { SupabaseReservationBlockRepository } from "@/repositories/supabase/reservation-block.repository";
import { buildGroupOperationalIntelligence } from "@/lib/group-reservations/operational-intelligence";
import { buildGroupOperationsOverview } from "@/lib/group-reservations/operations-overview";
import { summarizeGroupHealthSummary } from "@/lib/corporate/corporate-insights";
import { SupabaseGroupTimelineRepository } from "@/repositories/supabase/group-timeline.repository";
import { SupabaseGuestFolioRepository } from "@/repositories/supabase/guest-folio.repository";
import { SupabaseNotificationRepository } from "@/repositories/supabase/notification.repository";
import { getCurrentBusinessDate } from "@/lib/dates/business-date";
import {
  computeMasterFolioBalance,
  mapDbFolioEntriesToSettlement,
} from "@/lib/folio/master-folio-balance";
import { notifyCorporateCreditLimitReached } from "@/lib/notifications/group-notifications";
import { mapDbGroupTimelineEventToGroupTimelineEvent } from "@/lib/group-reservations/timeline-mapper";
import { sessionHasPermission } from "@/lib/auth/permissions";
import { getGroupReservationService } from "@/lib/group-reservations/get-group-reservation-service";
import type { GroupDashboardContract } from "@/types/group-dashboard";
import type { GroupReportsContract } from "@/types/group-reports";
import type { AuthSession } from "@/services/auth.service";
import type { ServiceContext } from "@/services/types";
import type {
  DbGuestFolioWithRelations,
  DbReservationWithRelations,
} from "@/types/database";
import type {
  GroupFinancialSummary,
  GroupReservationSummary,
} from "@/types/group-reservation";

export type GroupAnalyticsContracts = {
  reports: GroupReportsContract;
  dashboard: GroupDashboardContract;
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function groupByKey<T>(
  rows: T[],
  keyFn: (row: T) => string | null | undefined
): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const row of rows) {
    const key = keyFn(row);
    if (!key) continue;
    const list = map.get(key) ?? [];
    list.push(row);
    map.set(key, list);
  }
  return map;
}

/** Mirrors GuestFolioRepository.getByReservationId selection rules. */
function pickFolioForReservation(
  folios: DbGuestFolioWithRelations[]
): DbGuestFolioWithRelations | null {
  if (folios.length === 0) return null;
  const open = folios.find((folio) => folio.status === "open");
  if (open) return open;
  const withAccommodation = folios.filter((folio) =>
    (folio.entries ?? []).some((entry) => entry.entry_type === "accommodation")
  );
  if (withAccommodation.length > 0) return withAccommodation[0];
  return folios[0];
}

function countReservationsByStatus(rows: DbReservationWithRelations[]) {
  return {
    total: rows.length,
    checkedIn: rows.filter((r) => r.status === "checked_in").length,
    checkedOut: rows.filter(
      (r) => r.status === "checked_out" || r.status === "checked_out_early"
    ).length,
  };
}

function buildFinancialFromPrefetch(
  groupId: string,
  group: ReturnType<typeof mapDbGroupReservationToGroupReservation>,
  reservationRows: DbReservationWithRelations[],
  foliosByReservationId: Map<string, DbGuestFolioWithRelations[]>,
  childrenByParentId: Map<string, DbGuestFolioWithRelations[]>
): GroupFinancialSummary {
  let masterFolioId: string | null = null;
  let masterEntries = mapDbFolioEntriesToSettlement([]);
  const childEntriesList: ReturnType<typeof mapDbFolioEntriesToSettlement>[] =
    [];

  if (group.masterReservationId) {
    const masterFolio = pickFolioForReservation(
      foliosByReservationId.get(group.masterReservationId) ?? []
    );
    if (masterFolio) {
      masterFolioId = masterFolio.id;
      masterEntries = mapDbFolioEntriesToSettlement(masterFolio.entries ?? []);
      const children = childrenByParentId.get(masterFolio.id) ?? [];
      for (const child of children) {
        childEntriesList.push(
          mapDbFolioEntriesToSettlement(child.entries ?? [])
        );
      }
    }
  } else {
    for (const reservation of reservationRows) {
      const folio = pickFolioForReservation(
        foliosByReservationId.get(reservation.id) ?? []
      );
      if (folio) {
        childEntriesList.push(
          mapDbFolioEntriesToSettlement(folio.entries ?? [])
        );
      }
    }
  }

  const balance = computeMasterFolioBalance(masterEntries, childEntriesList);
  return {
    groupId,
    totalCharges: balance.totalCharges,
    totalPayments: balance.totalPayments,
    outstandingBalance: balance.outstandingBalance,
    masterFolioId,
    childFolioCount: childEntriesList.length,
  };
}

export async function loadGroupDashboardContract(
  _ctx: ServiceContext,
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
  const timelineRepo = new SupabaseGroupTimelineRepository(client);
  const folios = new SupabaseGuestFolioRepository(client);
  const notifications = new SupabaseNotificationRepository(client);

  const today = todayIso();
  const businessDate = await getCurrentBusinessDate();
  const allGroupRows = await groups.list();
  const allGroups = allGroupRows.map(mapDbGroupReservationToGroupReservation);
  const allGroupIds = allGroups.map((g) => g.id);

  const inHouse = allGroups.filter(
    (g) => g.status === "in_house" || g.status === "partially_checked_in"
  );
  const arriving = allGroups.filter(
    (g) =>
      g.arrivalDate === today &&
      g.status !== "cancelled" &&
      g.status !== "closed"
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

  const focusGroups = allGroups.filter(
    (gr) => gr.arrivalDate === today || gr.status === "in_house"
  );
  const focusIds = focusGroups.map((g) => g.id);

  const corpLinkedGroups = allGroups.filter((g) => Boolean(g.corporateAccountId));
  const reservationGroupIds = [
    ...new Set([...focusIds, ...corpLinkedGroups.map((g) => g.id)]),
  ];

  const [allBlockRows, reservationRows, timelineRows] = await Promise.all([
    blocks.listByGroupIds(allGroupIds),
    groups.listReservationsByGroupIds(reservationGroupIds),
    timelineRepo.listByGroupIds(focusIds),
  ]);

  const blocksByGroupId = groupByKey(
    allBlockRows,
    (b) => b.group_reservation_id
  );
  const reservationsByGroupId = groupByKey(
    reservationRows,
    (r) => r.group_reservation_id
  );
  const timelinesByGroupId = groupByKey(
    timelineRows,
    (t) => t.group_reservation_id
  );

  let corporateOutstanding = empty.corporateOutstanding;
  if (sessionHasPermission(session, "corporate_accounts", "view")) {
    const corpRows = await corporate.list({ status: "active" });
    const accounts: GroupDashboardContract["corporateOutstanding"]["accounts"] =
      [];
    let totalOutstanding = 0;

    for (const row of corpRows) {
      const corp = mapDbCorporateAccountToCorporateAccount(row);
      const linked = corpLinkedGroups.filter(
        (g) => g.corporateAccountId === corp.id
      );
      let balance = 0;
      for (const g of linked) {
        const rows = reservationsByGroupId.get(g.id) ?? [];
        for (const reservation of rows) {
          balance += Number(reservation.balance ?? 0);
        }
      }
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

  const groupNumberById = new Map(allGroups.map((g) => [g.id, g.groupNumber]));
  const allBlocks: Array<{
    block: ReturnType<typeof mapDbReservationBlockToReservationBlock>;
    groupNumber: string;
  }> = [];
  for (const row of allBlockRows) {
    const mapped = mapDbReservationBlockToReservationBlock(row);
    if (mapped.status !== "blocked") continue;
    allBlocks.push({
      block: mapped,
      groupNumber: groupNumberById.get(row.group_reservation_id) ?? "",
    });
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

  const folioReservationIds = new Set<string>();
  for (const g of focusGroups) {
    if (g.masterReservationId) {
      folioReservationIds.add(g.masterReservationId);
    } else {
      for (const r of reservationsByGroupId.get(g.id) ?? []) {
        folioReservationIds.add(r.id);
      }
    }
  }

  const folioRows = await folios.listByReservationIds([...folioReservationIds]);
  const foliosByReservationId = groupByKey(folioRows, (f) => f.reservation_id);

  const masterFolioIds: string[] = [];
  for (const g of focusGroups) {
    if (!g.masterReservationId) continue;
    const master = pickFolioForReservation(
      foliosByReservationId.get(g.masterReservationId) ?? []
    );
    if (master) masterFolioIds.push(master.id);
  }
  const childFolioRows = await folios.listChildFoliosByParentIds(masterFolioIds);
  const childrenByParentId = groupByKey(
    childFolioRows,
    (f) => f.parent_folio_id
  );

  const corpIds = [
    ...new Set(
      focusGroups
        .map((g) => g.corporateAccountId)
        .filter((id): id is string => Boolean(id))
    ),
  ];
  const corpRowsForFocus = await corporate.getByIds(corpIds);
  const corpById = new Map(corpRowsForFocus.map((c) => [c.id, c]));

  const healthStatuses: Array<{
    groupId: string;
    health: import("@/types/group-operational-intelligence").GroupHealthStatus;
  }> = [];
  const vipArrivalGroups: GroupDashboardContract["vipArrivals"]["groups"] = [];

  for (const g of focusGroups) {
    const reservationRowsForGroup = reservationsByGroupId.get(g.id) ?? [];
    const counts = countReservationsByStatus(reservationRowsForGroup);
    const blockList = (blocksByGroupId.get(g.id) ?? []).map(
      mapDbReservationBlockToReservationBlock
    );
    const corpRow = g.corporateAccountId
      ? (corpById.get(g.corporateAccountId) ?? null)
      : null;

    const summary: GroupReservationSummary = {
      group: g,
      reservationCount: counts.total,
      blockCount: blockList.filter((b) => b.status === "blocked").length,
      checkedInCount: counts.checkedIn,
      checkedOutCount: counts.checkedOut,
      corporateAccountName: corpRow?.company_name ?? null,
    };

    const financial = buildFinancialFromPrefetch(
      g.id,
      g,
      reservationRowsForGroup,
      foliosByReservationId,
      childrenByParentId
    );

    if (
      corpRow?.credit_limit != null &&
      financial.outstandingBalance > Number(corpRow.credit_limit)
    ) {
      await notifyCorporateCreditLimitReached(notifications, {
        corporateAccountId: corpRow.id,
        companyName: corpRow.company_name,
        outstandingBalance: financial.outstandingBalance,
        creditLimit: Number(corpRow.credit_limit),
      });
    }

    const timelineEvents = (timelinesByGroupId.get(g.id) ?? []).map(
      mapDbGroupTimelineEventToGroupTimelineEvent
    );

    const overview = await buildGroupOperationsOverview(
      { groups, blocks, timeline: timelineRepo, corporate },
      g.id,
      summary,
      financial,
      timelineEvents,
      businessDate,
      {
        group: g,
        reservationRows: reservationRowsForGroup,
        blocks: blockList,
        corporate: corpRow,
        businessDate,
      }
    );

    const intel = buildGroupOperationalIntelligence(
      g.id,
      overview,
      blockList,
      timelineEvents,
      financial,
      corpRow ? mapDbCorporateAccountToCorporateAccount(corpRow) : null,
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
  const corporateOutstandingList = [];
  if (sessionHasPermission(session, "corporate_accounts", "view")) {
    const corpRows = await corporate.list({ status: "active" });
    for (const row of corpRows) {
      const corp = mapDbCorporateAccountToCorporateAccount(row);
      const linkedGroups = await corpService.getReservations(ctx, session, corp.id);
      const outstanding = await corpService.getOutstandingBalance(
        ctx,
        session,
        corp.id
      );
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
        corporateOutstandingList.push({
          corporateAccountId: corp.id,
          companyName: corp.companyName,
          outstandingBalance: outstanding,
          creditLimit: corp.creditLimit,
          groupCount: linkedGroups.length,
        });
      }
    }
    corporateRevenue.sort((a, b) => b.revenue - a.revenue);
    corporateOutstandingList.sort(
      (a, b) => b.outstandingBalance - a.outstandingBalance
    );
  }

  const toReportRow = async (
    g: ReturnType<typeof mapDbGroupReservationToGroupReservation>
  ) => {
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
    corporateOutstanding: corporateOutstandingList.slice(0, 10),
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

export { EMPTY_GROUP_REPORTS, EMPTY_GROUP_DASHBOARD } from "@/lib/analytics/group-contracts-stubs";
