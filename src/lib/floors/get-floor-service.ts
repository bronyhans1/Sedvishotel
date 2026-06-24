import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseEnv } from "@/lib/supabase/config";
import { createServerClient } from "@/lib/supabase/server";
import { SupabaseActivityLogRepository } from "@/repositories/supabase/activity-log.repository";
import { SupabaseFloorRepository } from "@/repositories/supabase/floor.repository";
import { FloorService } from "@/services/floor.service";

export async function getFloorService(): Promise<FloorService> {
  const client = supabaseEnv.serviceRoleKey
    ? createAdminClient()
    : await createServerClient();

  return new FloorService(
    new SupabaseFloorRepository(client),
    new SupabaseActivityLogRepository(client)
  );
}
