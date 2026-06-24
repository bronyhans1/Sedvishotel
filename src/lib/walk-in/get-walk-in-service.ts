import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseEnv } from "@/lib/supabase/config";
import { createServerClient } from "@/lib/supabase/server";
import { SupabaseActivityLogRepository } from "@/repositories/supabase/activity-log.repository";
import { SupabaseGuestRepository } from "@/repositories/supabase/guest.repository";
import { SupabasePaymentRepository } from "@/repositories/supabase/payment.repository";
import { SupabaseReservationRepository } from "@/repositories/supabase/reservation.repository";
import { SupabaseRoomRepository } from "@/repositories/supabase/room.repository";
import { WalkInService } from "@/services/walk-in.service";

export async function getWalkInService(): Promise<WalkInService> {
  const client = supabaseEnv.serviceRoleKey
    ? createAdminClient()
    : await createServerClient();

  return new WalkInService(
    new SupabaseGuestRepository(client),
    new SupabaseReservationRepository(client),
    new SupabaseRoomRepository(client),
    new SupabasePaymentRepository(client),
    new SupabaseActivityLogRepository(client)
  );
}
