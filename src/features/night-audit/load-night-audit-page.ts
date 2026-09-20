import { redirect } from "next/navigation";

import { ACCESS_DENIED_PATH } from "@/lib/auth/route-guard";
import { getNightAuditAccess } from "@/lib/auth/night-audit-access";
import { getServiceContextForPage } from "@/lib/auth/service-context";
import { buildNightAuditCommandCenter } from "@/lib/operational-integrity/build-command-center";
import { getNightAuditService } from "@/lib/night-audit/get-night-audit-service";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured, supabaseEnv } from "@/lib/supabase/config";
import { createServerClient } from "@/lib/supabase/server";
import { SupabaseActivityLogRepository } from "@/repositories/supabase/activity-log.repository";
import { SupabaseReservationRepository } from "@/repositories/supabase/reservation.repository";
import { SupabaseRoomRepository } from "@/repositories/supabase/room.repository";
import { SupabaseShiftHandoverRepository } from "@/repositories/supabase/shift-handover.repository";
import type { NightAuditPageData } from "@/types/night-audit";
import type {
  DbReservationWithRelations,
  DbRoomWithType,
} from "@/types/database";

/**
 * Request-scoped read set for Night Audit page load.
 * Exists only for this request — not cached across requests.
 */
type NightAuditPageReadSet = {
  reservations: DbReservationWithRelations[];
  rooms: DbRoomWithType[];
};

export async function loadNightAuditPageData(): Promise<
  NightAuditPageData & { access: ReturnType<typeof getNightAuditAccess> }
> {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const { session, ctx } = await getServiceContextForPage();
  const access = getNightAuditAccess(session);
  if (!access.canView) {
    redirect(ACCESS_DENIED_PATH);
  }

  const service = await getNightAuditService();
  const client = supabaseEnv.serviceRoleKey
    ? createAdminClient()
    : await createServerClient();

  const reservationRepo = new SupabaseReservationRepository(client);
  const roomRepo = new SupabaseRoomRepository(client);

  const [{ businessDate, currentAudit, blockedByOpenAudit }, history, readSet] =
    await Promise.all([
      service.resolveCurrentDay(ctx, session),
      service.listAudits(ctx, session),
      (async (): Promise<NightAuditPageReadSet> => {
        const [reservations, rooms] = await Promise.all([
          reservationRepo.getAll(),
          roomRepo.getAll(false),
        ]);
        return { reservations, rooms };
      })(),
    ]);

  const snapshotPrefetch = {
    reservations: readSet.reservations,
    rooms: readSet.rooms,
  };

  const snapshotDate =
    currentAudit?.auditDate ?? blockedByOpenAudit?.auditDate ?? businessDate;
  const liveSnapshot =
    currentAudit?.status === "open" || blockedByOpenAudit
      ? await service.generateSnapshot(
          ctx,
          session,
          snapshotDate,
          snapshotPrefetch
        )
      : currentAudit
        ? null
        : await service.generateSnapshot(
            ctx,
            session,
            businessDate,
            snapshotPrefetch
          );

  const overstayWarning =
    currentAudit?.status === "open"
      ? await service.getOverstayWarning(businessDate, readSet.reservations)
      : null;

  const lastClosedAudit =
    history.find((a) => a.status === "closed" && a.closedAt) ?? null;

  let commandCenter: NightAuditPageData["commandCenter"] = null;
  try {
    commandCenter = await buildNightAuditCommandCenter({
      businessDate,
      currentAudit,
      lastClosedAudit,
      reservations: reservationRepo,
      rooms: roomRepo,
      activityLogs: new SupabaseActivityLogRepository(client),
      shiftHandovers: new SupabaseShiftHandoverRepository(client),
      prefetchedReservations: readSet.reservations,
      prefetchedRooms: readSet.rooms,
    });
  } catch {
    commandCenter = null;
  }

  return {
    businessDate,
    currentAudit,
    blockedByOpenAudit,
    liveSnapshot,
    history,
    access,
    overstayWarning,
    commandCenter,
  };
}
