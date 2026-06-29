import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseEnv } from "@/lib/supabase/config";
import { createServerClient } from "@/lib/supabase/server";
import { SupabaseActivityLogRepository } from "@/repositories/supabase/activity-log.repository";
import { SupabaseHousekeepingRepository } from "@/repositories/supabase/housekeeping.repository";
import { SupabaseNotificationRepository } from "@/repositories/supabase/notification.repository";
import { SupabaseReservationRepository } from "@/repositories/supabase/reservation.repository";
import { SupabaseRoomRepository } from "@/repositories/supabase/room.repository";
import { HousekeepingService } from "@/services/housekeeping.service";

export async function getHousekeepingService(): Promise<HousekeepingService> {
  const client = supabaseEnv.serviceRoleKey
    ? createAdminClient()
    : await createServerClient();

  return new HousekeepingService(
    new SupabaseRoomRepository(client),
    new SupabaseReservationRepository(client),
    new SupabaseHousekeepingRepository(client),
    new SupabaseActivityLogRepository(client),
    new SupabaseNotificationRepository(client)
  );
}
