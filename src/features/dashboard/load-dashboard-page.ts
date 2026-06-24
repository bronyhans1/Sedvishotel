import { redirect } from "next/navigation";

import { getAnalyticsAccess } from "@/lib/auth/analytics-access";
import { getServiceContextForPage } from "@/lib/auth/service-context";
import { getAnalyticsService } from "@/lib/analytics/get-analytics-service";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function loadDashboardPageData() {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const { session, ctx } = await getServiceContextForPage();

  const access = getAnalyticsAccess(session);
  if (!access.canViewDashboard) {
    redirect("/login");
  }

  const service = await getAnalyticsService();
  const data = await service.getDashboardData(ctx, session);

  return { data, access };
}
