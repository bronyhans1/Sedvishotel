import { createGuestFolioService } from "@/lib/folio/create-guest-folio-service";
import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseEnv } from "@/lib/supabase/config";
import { createServerClient } from "@/lib/supabase/server";
import { SupabaseActivityLogRepository } from "@/repositories/supabase/activity-log.repository";
import { SupabasePosRepository } from "@/repositories/supabase/pos.repository";
import { SupabaseProductRepository } from "@/repositories/supabase/product.repository";
import { SupabaseReservationRepository } from "@/repositories/supabase/reservation.repository";
import { PosService } from "@/services/pos.service";

export async function getPosService(): Promise<PosService> {
  const client = supabaseEnv.serviceRoleKey
    ? createAdminClient()
    : await createServerClient();

  const folios = createGuestFolioService(client);

  return new PosService(
    new SupabasePosRepository(client),
    new SupabaseProductRepository(client),
    new SupabaseReservationRepository(client),
    new SupabaseActivityLogRepository(client),
    folios
  );
}
