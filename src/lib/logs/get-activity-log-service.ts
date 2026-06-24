import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseEnv } from "@/lib/supabase/config";
import { createServerClient } from "@/lib/supabase/server";
import { SupabaseActivityLogRepository } from "@/repositories/supabase/activity-log.repository";
import { ActivityLogService } from "@/services/activity-log.service";

export async function getActivityLogService(): Promise<ActivityLogService> {
  const client = supabaseEnv.serviceRoleKey
    ? createAdminClient()
    : await createServerClient();

  return new ActivityLogService(new SupabaseActivityLogRepository(client));
}
