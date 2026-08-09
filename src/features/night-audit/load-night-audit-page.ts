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
  const [{ businessDate, currentAudit, blockedByOpenAudit }, history] =
    await Promise.all([
      service.resolveCurrentDay(ctx, session),
      service.listAudits(ctx, session),
    ]);

  const snapshotDate =
    currentAudit?.auditDate ?? blockedByOpenAudit?.auditDate ?? businessDate;
  const liveSnapshot =
    currentAudit?.status === "open" || blockedByOpenAudit
      ? await service.generateSnapshot(ctx, session, snapshotDate)
      : currentAudit
        ? null
        : await service.generateSnapshot(ctx, session, businessDate);

  const overstayWarning =
    currentAudit?.status === "open"
      ? await service.getOverstayWarning(businessDate)
      : null;

  const client = supabaseEnv.serviceRoleKey
    ? createAdminClient()
    : await createServerClient();

  const lastClosedAudit =
    history.find((a) => a.status === "closed" && a.closedAt) ?? null;

  let commandCenter: NightAuditPageData["commandCenter"] = null;
  try {
    commandCenter = await buildNightAuditCommandCenter({
      businessDate,
      currentAudit,
      lastClosedAudit,
      reservations: new SupabaseReservationRepository(client),
      rooms: new SupabaseRoomRepository(client),
      activityLogs: new SupabaseActivityLogRepository(client),
      shiftHandovers: new SupabaseShiftHandoverRepository(client),
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
