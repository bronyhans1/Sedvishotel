import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseEnv } from "@/lib/supabase/config";
import { createServerClient } from "@/lib/supabase/server";
import { SupabaseActivityLogRepository } from "@/repositories/supabase/activity-log.repository";
import { SupabaseSettingsRepository } from "@/repositories/supabase/settings.repository";
import { SettingsService } from "@/services/settings.service";

export async function getSettingsService(): Promise<SettingsService> {
  const client = supabaseEnv.serviceRoleKey
    ? createAdminClient()
    : await createServerClient();

  return new SettingsService(
    new SupabaseSettingsRepository(client),
    new SupabaseActivityLogRepository(client)
  );
}
