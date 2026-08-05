import { createGuestFolioService } from "@/lib/folio/create-guest-folio-service";
import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseEnv } from "@/lib/supabase/config";
import { createServerClient } from "@/lib/supabase/server";
import { SupabaseActivityLogRepository } from "@/repositories/supabase/activity-log.repository";
import { SupabaseOverstayChargeRepository } from "@/repositories/supabase/overstay-charge.repository";
import { SupabaseReservationRepository } from "@/repositories/supabase/reservation.repository";
import { OverstayService } from "@/services/overstay.service";

export async function getOverstayService(): Promise<OverstayService> {
  const client = supabaseEnv.serviceRoleKey
    ? createAdminClient()
    : await createServerClient();

  return new OverstayService(
    new SupabaseOverstayChargeRepository(client),
    new SupabaseReservationRepository(client),
    createGuestFolioService(client),
    new SupabaseActivityLogRepository(client)
  );
}
