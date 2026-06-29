import { redirect } from "next/navigation";

import { ACCESS_DENIED_PATH } from "@/lib/auth/route-guard";

import { getLogsAccess } from "@/lib/auth/logs-access";
import { getServiceContextForPage } from "@/lib/auth/service-context";
import { getActivityLogService } from "@/lib/logs/get-activity-log-service";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function loadLogsPageData() {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const { session, ctx } = await getServiceContextForPage();

  const access = getLogsAccess(session);
  if (!access.canView) {
    redirect(ACCESS_DENIED_PATH);
  }

  const service = await getActivityLogService();
  const { logs, stats } = await service.listLogs(ctx, session);

  return { logs, stats, access };
}
