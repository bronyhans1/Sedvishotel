import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseEnv } from "@/lib/supabase/config";
import { createServerClient } from "@/lib/supabase/server";
import { SupabaseActivityLogRepository } from "@/repositories/supabase/activity-log.repository";
import { SupabaseGuestRepository } from "@/repositories/supabase/guest.repository";
import { SupabaseReservationRepository } from "@/repositories/supabase/reservation.repository";
import { SupabaseRoomRepository } from "@/repositories/supabase/room.repository";
import { ReservationService } from "@/services/reservation.service";

export async function getReservationService(): Promise<ReservationService> {
  const client = supabaseEnv.serviceRoleKey
    ? createAdminClient()
    : await createServerClient();

  return new ReservationService(
    new SupabaseReservationRepository(client),
    new SupabaseGuestRepository(client),
    new SupabaseRoomRepository(client),
    new SupabaseActivityLogRepository(client)
  );
}
