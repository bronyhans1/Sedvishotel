import { redirect } from "next/navigation";

import { ACCESS_DENIED_PATH } from "@/lib/auth/route-guard";
import { getLogsAccess } from "@/lib/auth/logs-access";
import { getServiceContextForPage } from "@/lib/auth/service-context";
import { getActivityLogService } from "@/lib/logs/get-activity-log-service";
import { parsePageParam } from "@/lib/pagination/pagination";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function loadLogsPageData(
  params: Record<string, string | string[] | undefined> = {}
) {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const { session, ctx } = await getServiceContextForPage();

  const access = getLogsAccess(session);
  if (!access.canView) {
    redirect(ACCESS_DENIED_PATH);
  }

  const requestedPage = parsePageParam(params.page);
  const search = typeof params.search === "string" ? params.search : "";
  const service = await getActivityLogService();
  const result = await service.listLogPage(ctx, session, {
    page: requestedPage,
    search,
  });

  if (result.page !== requestedPage) {
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (key === "page" || key === "search") continue;
      if (typeof value === "string" && value) qs.set(key, value);
    }
    if (result.search) qs.set("search", result.search);
    if (result.page > 1) qs.set("page", String(result.page));
    const query = qs.toString();
    redirect(query ? `/dashboard/logs?${query}` : "/dashboard/logs");
  }

  return { ...result, access };
}
