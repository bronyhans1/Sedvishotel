import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseEnv } from "@/lib/supabase/config";
import { createServerClient } from "@/lib/supabase/server";
import { SupabaseActivityLogRepository } from "@/repositories/supabase/activity-log.repository";
import { SupabaseShiftHandoverRepository } from "@/repositories/supabase/shift-handover.repository";
import { SupabaseUserRepository } from "@/repositories/supabase/user.repository";
import { ShiftHandoverService } from "@/services/shift-handover.service";

export async function getShiftHandoverService(): Promise<ShiftHandoverService> {
  const client = supabaseEnv.serviceRoleKey
    ? createAdminClient()
    : await createServerClient();

  return new ShiftHandoverService(
    new SupabaseShiftHandoverRepository(client),
    new SupabaseUserRepository(client),
    new SupabaseActivityLogRepository(client)
  );
}
