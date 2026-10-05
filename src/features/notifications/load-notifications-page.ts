import { redirect } from "next/navigation";

import { ACCESS_DENIED_PATH } from "@/lib/auth/route-guard";

import { getNotificationsAccess } from "@/lib/auth/notifications-access";
import { getServiceContextForPage } from "@/lib/auth/service-context";
import { getNotificationService } from "@/lib/notifications/get-notification-service";
import { parsePageParam } from "@/lib/pagination/pagination";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function loadNotificationsPageData(
  params: Record<string, string | string[] | undefined> = {}
) {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const { session, ctx } = await getServiceContextForPage();

  const access = getNotificationsAccess(session);
  if (!access.canView) {
    redirect(ACCESS_DENIED_PATH);
  }

  const requestedPage = parsePageParam(params.page);
  const service = await getNotificationService();
  const result = await service.listNotificationPage(ctx, session, {
    page: requestedPage,
  });

  if (result.readPage !== requestedPage) {
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (key === "page") continue;
      if (typeof value === "string" && value) qs.set(key, value);
    }
    if (result.readPage > 1) qs.set("page", String(result.readPage));
    const query = qs.toString();
    redirect(query ? `/dashboard/notifications?${query}` : "/dashboard/notifications");
  }

  return { ...result, access };
}
