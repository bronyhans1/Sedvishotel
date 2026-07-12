import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseEnv } from "@/lib/supabase/config";
import { createServerClient } from "@/lib/supabase/server";
import { SupabaseActivityLogRepository } from "@/repositories/supabase/activity-log.repository";
import { SupabaseRoomTypePricingRuleRepository } from "@/repositories/supabase/room-type-pricing-rule.repository";
import { SupabaseRoomTypeRepository } from "@/repositories/supabase/room-type.repository";
import { RoomTypeService } from "@/services/room-type.service";

export async function getRoomTypeService(): Promise<RoomTypeService> {
  const client = supabaseEnv.serviceRoleKey
    ? createAdminClient()
    : await createServerClient();

  return new RoomTypeService(
    new SupabaseRoomTypeRepository(client),
    new SupabaseActivityLogRepository(client),
    new SupabaseRoomTypePricingRuleRepository(client)
  );
}
