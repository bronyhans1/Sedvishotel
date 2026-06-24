import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseEnv } from "@/lib/supabase/config";
import { createServerClient } from "@/lib/supabase/server";
import { SupabaseActivityLogRepository } from "@/repositories/supabase/activity-log.repository";
import { SupabaseRoleRepository } from "@/repositories/supabase/role.repository";
import { RoleService } from "@/services/role.service";

export async function getRoleService(): Promise<RoleService> {
  const client = supabaseEnv.serviceRoleKey
    ? createAdminClient()
    : await createServerClient();

  return new RoleService(
    new SupabaseRoleRepository(client),
    new SupabaseActivityLogRepository(client)
  );
}
