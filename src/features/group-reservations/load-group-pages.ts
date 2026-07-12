import { redirect } from "next/navigation";

import { ACCESS_DENIED_PATH } from "@/lib/auth/route-guard";
import { getGroupReservationAccess } from "@/lib/auth/group-reservation-access";
import { getServiceContextForPage } from "@/lib/auth/service-context";
import { getGroupReservationService } from "@/lib/group-reservations/get-group-reservation-service";
import { getCorporateAccountService } from "@/lib/corporate/get-corporate-account-service";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { CorporateAccount } from "@/types/corporate-account";
import type { GroupOperationalIntelligence } from "@/types/group-operational-intelligence";
import type { GroupFinancialSummary, GroupReservation } from "@/types/group-reservation";

export type GroupListItem = GroupReservation & {
  corporateAccountName: string | null;
  outstandingBalance: number;
};

export async function loadGroupReservationsPageData() {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const { session, ctx } = await getServiceContextForPage();
  const access = getGroupReservationAccess(session);
  if (!access.canView) {
    redirect(ACCESS_DENIED_PATH);
  }

  const groupService = await getGroupReservationService();
  const corpService = await getCorporateAccountService();

  const groups = await groupService.getGroups(ctx, session);
  const corporateAccounts = access.canView
    ? await corpService.list(ctx, session, { status: "active" })
    : [];

  const items: GroupListItem[] = [];
  for (const group of groups) {
    const summary = await groupService.getSummary(ctx, session, group.id);
    const financial = await groupService.getFinancialSummary(ctx, session, group.id);
    items.push({
      ...group,
      corporateAccountName: summary?.corporateAccountName ?? null,
      outstandingBalance: financial?.outstandingBalance ?? 0,
    });
  }

  return { groups: items, access, corporateAccounts };
}

export type GroupWizardOptions = {
  corporateAccounts: CorporateAccount[];
  roomTypes: Array<{
    id: string;
    name: string;
    defaultPrice: number;
    pricingRules: import("@/types/pricing").RoomTypePricingRule[];
  }>;
};

export async function loadGroupWizardData(): Promise<GroupWizardOptions> {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const { session, ctx } = await getServiceContextForPage();
  const access = getGroupReservationAccess(session);
  if (!access.canCreate) {
    redirect(ACCESS_DENIED_PATH);
  }

  const corpService = await getCorporateAccountService();
  const corporateAccounts = await corpService.list(ctx, session, { status: "active" });

  const { getRoomTypeService } = await import("@/lib/room-types/get-room-type-service");
  const roomTypeService = await getRoomTypeService();
  const roomTypes = (await roomTypeService.list(ctx, session))
    .filter((rt) => rt.status === "active")
    .map((rt) => ({
      id: rt.id,
      name: rt.name,
      defaultPrice: rt.defaultPrice,
      pricingRules: rt.pricingRules,
    }));

  return { corporateAccounts, roomTypes };
}

export type GroupDetailData = {
  group: GroupReservation;
  summary: NonNullable<Awaited<ReturnType<Awaited<ReturnType<typeof getGroupReservationService>>["getSummary"]>>>;
  financial: GroupFinancialSummary | null;
  overview: Awaited<ReturnType<typeof import("@/lib/group-reservations/operations-overview").buildGroupOperationsOverview>>;
  timeline: Awaited<ReturnType<Awaited<ReturnType<typeof getGroupReservationService>>["getTimeline"]>>;
  blocks: import("@/types/reservation-block").ReservationBlock[];
  childFolios: Array<{
    id: string;
    folioNumber: string;
    guestName: string;
    roomNumber: string;
    outstandingBalance: number;
    reservationId: string;
  }>;
  access: ReturnType<typeof getGroupReservationAccess>;
  intelligence: GroupOperationalIntelligence;
  corporateAccount: CorporateAccount | null;
};

export async function loadGroupDetailPageData(groupId: string): Promise<GroupDetailData> {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const { session, ctx } = await getServiceContextForPage();
  const access = getGroupReservationAccess(session);
  if (!access.canView) {
    redirect(ACCESS_DENIED_PATH);
  }

  const groupService = await getGroupReservationService();
  const group = await groupService.getGroup(ctx, session, groupId);
  if (!group) {
    redirect("/dashboard/group-reservations");
  }

  const summary = await groupService.getSummary(ctx, session, groupId);
  if (!summary) {
    redirect("/dashboard/group-reservations");
  }

  const [financial, timeline] = await Promise.all([
    groupService.getFinancialSummary(ctx, session, groupId),
    groupService.getTimeline(ctx, session, groupId),
  ]);

  const { getCorporateAccountServiceClient } = await import(
    "@/lib/corporate/get-corporate-account-service"
  );
  const { buildGroupOperationsOverview } = await import(
    "@/lib/group-reservations/operations-overview"
  );
  const { SupabaseCorporateAccountRepository } = await import(
    "@/repositories/supabase/corporate-account.repository"
  );
  const { SupabaseGroupReservationRepository } = await import(
    "@/repositories/supabase/group-reservation.repository"
  );
  const { SupabaseReservationBlockRepository } = await import(
    "@/repositories/supabase/reservation-block.repository"
  );
  const { SupabaseGroupTimelineRepository } = await import(
    "@/repositories/supabase/group-timeline.repository"
  );
  const { mapDbReservationBlockToReservationBlock } = await import(
    "@/lib/group-reservations/block-mapper"
  );

  const { buildGroupOperationalIntelligence } = await import(
    "@/lib/group-reservations/operational-intelligence"
  );
  const { mapDbCorporateAccountToCorporateAccount } = await import("@/lib/corporate/mapper");

  const client = await getCorporateAccountServiceClient();
  const overview = await buildGroupOperationsOverview(
    {
      groups: new SupabaseGroupReservationRepository(client),
      blocks: new SupabaseReservationBlockRepository(client),
      timeline: new SupabaseGroupTimelineRepository(client),
      corporate: new SupabaseCorporateAccountRepository(client),
    },
    groupId,
    summary,
    financial,
    timeline
  );

  const blockRows = await new SupabaseReservationBlockRepository(client).listByGroup(groupId);
  const blocks = blockRows.map(mapDbReservationBlockToReservationBlock);

  let corporateAccount: CorporateAccount | null = null;
  if (group.corporateAccountId) {
    const corpRow = await new SupabaseCorporateAccountRepository(client).getById(
      group.corporateAccountId
    );
    corporateAccount = corpRow ? mapDbCorporateAccountToCorporateAccount(corpRow) : null;
  }

  const intelligence = buildGroupOperationalIntelligence(
    groupId,
    overview,
    blocks,
    timeline,
    financial,
    corporateAccount,
    0
  );

  let childFolios: GroupDetailData["childFolios"] = [];
  if (financial?.masterFolioId) {
    const { SupabaseGuestFolioRepository } = await import(
      "@/repositories/supabase/guest-folio.repository"
    );
    const { buildFolioSummary } = await import("@/lib/folio/balance");
    const { mapDbFolioEntriesToSettlement } = await import(
      "@/lib/folio/master-folio-balance"
    );
    const folioRepo = new SupabaseGuestFolioRepository(client);
    const children = await folioRepo.listChildFolios(financial.masterFolioId);
    childFolios = children.map((f) => {
      const entries = mapDbFolioEntriesToSettlement(f.entries ?? []);
      const summary = buildFolioSummary(entries);
      return {
        id: f.id,
        folioNumber: f.folio_number,
        guestName: f.guest?.full_name ?? "Guest",
        roomNumber: f.room?.room_number ?? "—",
        outstandingBalance: summary.outstandingBalance,
        reservationId: f.reservation_id,
      };
    });
  }

  return {
    group,
    summary,
    financial,
    overview,
    timeline,
    blocks,
    childFolios,
    access,
    intelligence,
    corporateAccount,
  };
}
