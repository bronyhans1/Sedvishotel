import { redirect } from "next/navigation";

import { ACCESS_DENIED_PATH } from "@/lib/auth/route-guard";
import { getNightAuditAccess } from "@/lib/auth/night-audit-access";
import { getServiceContextForPage } from "@/lib/auth/service-context";
import { getTodayDateString } from "@/lib/dates/today";
import { getNightAuditService } from "@/lib/night-audit/get-night-audit-service";
import { isSupabaseConfigured } from "@/lib/supabase/config";
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
  const businessDate = getTodayDateString();
  const [currentAudit, liveSnapshot, history] = await Promise.all([
    service.getCurrentAudit(ctx, session),
    service.generateSnapshot(ctx, session, businessDate),
    service.listAudits(ctx, session),
  ]);

  return { businessDate, currentAudit, liveSnapshot, history, access };
}
