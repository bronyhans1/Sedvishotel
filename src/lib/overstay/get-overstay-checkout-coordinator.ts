import { createGuestFolioService } from "@/lib/folio/create-guest-folio-service";
import { getOverstayService } from "@/lib/overstay/get-overstay-service";
import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseEnv } from "@/lib/supabase/config";
import { createServerClient } from "@/lib/supabase/server";
import { SupabaseReservationRepository } from "@/repositories/supabase/reservation.repository";
import { OverstayCheckoutCoordinator } from "@/services/overstay-checkout-coordinator.service";

export async function getOverstayCheckoutCoordinator(): Promise<OverstayCheckoutCoordinator> {
  const client = supabaseEnv.serviceRoleKey
    ? createAdminClient()
    : await createServerClient();

  const [overstays, folios] = await Promise.all([
    getOverstayService(),
    Promise.resolve(createGuestFolioService(client)),
  ]);

  return new OverstayCheckoutCoordinator(
    new SupabaseReservationRepository(client),
    overstays,
    folios
  );
}
