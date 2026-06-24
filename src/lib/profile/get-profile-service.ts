import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseEnv } from "@/lib/supabase/config";
import { createServerClient } from "@/lib/supabase/server";
import { SupabaseActivityLogRepository } from "@/repositories/supabase/activity-log.repository";
import { SupabaseUserRepository } from "@/repositories/supabase/user.repository";
import { ProfileService } from "@/services/profile.service";

function getClient() {
  return supabaseEnv.serviceRoleKey
    ? Promise.resolve(createAdminClient())
    : createServerClient();
}

export async function getProfileService(): Promise<ProfileService> {
  const client = await getClient();
  const admin = supabaseEnv.serviceRoleKey ? createAdminClient() : undefined;
  const userRepo = new SupabaseUserRepository(client, admin);

  return new ProfileService(
    userRepo,
    new SupabaseActivityLogRepository(client),
    userRepo
  );
}
