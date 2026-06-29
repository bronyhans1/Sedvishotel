import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseEnv } from "@/lib/supabase/config";
import { createServerClient } from "@/lib/supabase/server";
import { SupabaseActivityLogRepository } from "@/repositories/supabase/activity-log.repository";
import { SupabaseUserRepository } from "@/repositories/supabase/user.repository";
import { StaffService } from "@/services/staff.service";

function getClient() {
  return supabaseEnv.serviceRoleKey
    ? Promise.resolve(createAdminClient())
    : createServerClient();
}

export async function getStaffService(): Promise<StaffService> {
  const client = await getClient();
  const admin = supabaseEnv.serviceRoleKey ? createAdminClient() : undefined;
  const userRepo = new SupabaseUserRepository(client, admin);

  return new StaffService(
    userRepo,
    new SupabaseActivityLogRepository(client),
    userRepo
  );
}
