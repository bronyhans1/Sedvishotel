import { getServiceContextForPage } from "@/lib/auth/service-context";
import { getNotificationService } from "@/lib/notifications/get-notification-service";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Notification } from "@/types/notification";

export async function loadNavbarNotifications(): Promise<Notification[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const { session, ctx } = await getServiceContextForPage();
    const service = await getNotificationService();
    return service.listNotifications(ctx, session);
  } catch {
    return [];
  }
}
