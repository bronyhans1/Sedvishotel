import { getServiceContextForPage } from "@/lib/auth/service-context";
import { getNotificationService } from "@/lib/notifications/get-notification-service";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { NotificationBellData } from "@/types/notification";

const EMPTY_BELL: NotificationBellData = { preview: [], unreadCount: 0 };

export async function loadNavbarNotifications(): Promise<NotificationBellData> {
  if (!isSupabaseConfigured()) {
    return EMPTY_BELL;
  }

  try {
    const { session, ctx } = await getServiceContextForPage();
    const service = await getNotificationService();
    return service.listNotificationBell(ctx, session);
  } catch {
    return EMPTY_BELL;
  }
}
