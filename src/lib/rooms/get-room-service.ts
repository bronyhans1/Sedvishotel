import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseEnv } from "@/lib/supabase/config";
import { createServerClient } from "@/lib/supabase/server";
import { SupabaseActivityLogRepository } from "@/repositories/supabase/activity-log.repository";
import { SupabaseReservationRepository } from "@/repositories/supabase/reservation.repository";
import { SupabaseFloorRepository } from "@/repositories/supabase/floor.repository";
import { SupabaseRoomRepository } from "@/repositories/supabase/room.repository";
import { SupabaseRoomTypeRepository } from "@/repositories/supabase/room-type.repository";
import { RoomService } from "@/services/room.service";

export async function getRoomService(): Promise<RoomService> {
  const client = supabaseEnv.serviceRoleKey
    ? createAdminClient()
    : await createServerClient();

  return new RoomService(
    new SupabaseRoomRepository(client),
    new SupabaseRoomTypeRepository(client),
    new SupabaseFloorRepository(client),
    new SupabaseActivityLogRepository(client),
    new SupabaseReservationRepository(client)
  );
}
