import { redirect } from "next/navigation";

import { ACCESS_DENIED_PATH } from "@/lib/auth/route-guard";

import { getNotificationsAccess } from "@/lib/auth/notifications-access";
import { getServiceContextForPage } from "@/lib/auth/service-context";
import { getNotificationService } from "@/lib/notifications/get-notification-service";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function loadNotificationsPageData() {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const { session, ctx } = await getServiceContextForPage();

  const access = getNotificationsAccess(session);
  if (!access.canView) {
    redirect(ACCESS_DENIED_PATH);
  }

  const service = await getNotificationService();
  const notifications = await service.listNotifications(ctx, session);

  return { notifications, access };
}
