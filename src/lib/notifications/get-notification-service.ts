import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseEnv } from "@/lib/supabase/config";
import { createServerClient } from "@/lib/supabase/server";
import { SupabaseActivityLogRepository } from "@/repositories/supabase/activity-log.repository";
import { SupabaseNotificationRepository } from "@/repositories/supabase/notification.repository";
import { NotificationService } from "@/services/notification.service";

export async function getNotificationService(): Promise<NotificationService> {
  const client = supabaseEnv.serviceRoleKey
    ? createAdminClient()
    : await createServerClient();

  return new NotificationService(
    new SupabaseNotificationRepository(client),
    new SupabaseActivityLogRepository(client)
  );
}
