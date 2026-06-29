import { redirect } from "next/navigation";

import { ACCESS_DENIED_PATH } from "@/lib/auth/route-guard";

import { getAnalyticsAccess } from "@/lib/auth/analytics-access";
import { getServiceContextForPage } from "@/lib/auth/service-context";
import { getAnalyticsService } from "@/lib/analytics/get-analytics-service";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function loadReportsPageData() {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const { session, ctx } = await getServiceContextForPage();

  const access = getAnalyticsAccess(session);
  if (!access.canViewReports) {
    redirect(ACCESS_DENIED_PATH);
  }

  const service = await getAnalyticsService();
  const data = await service.getReportsData(ctx, session);

  return { data, access };
}
