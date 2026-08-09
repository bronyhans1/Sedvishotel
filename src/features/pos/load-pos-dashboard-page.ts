import { redirect } from "next/navigation";

import { ACCESS_DENIED_PATH } from "@/lib/auth/route-guard";
import { getPosAccess } from "@/lib/auth/pos-access";
import { getServiceContextForPage } from "@/lib/auth/service-context";
import { getCurrentBusinessDate } from "@/lib/dates/business-date";
import { getPosDashboardService } from "@/lib/pos/get-pos-dashboard-service";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function loadPosDashboardPageData() {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const { session, ctx } = await getServiceContextForPage();
  const access = getPosAccess(session);
  if (!access.canView) {
    redirect(ACCESS_DENIED_PATH);
  }

  const businessDate = await getCurrentBusinessDate();
  const dashboard = await getPosDashboardService();
  const summary = await dashboard.getBusinessDaySummary(
    ctx,
    session,
    businessDate
  );

  return { access, summary };
}
