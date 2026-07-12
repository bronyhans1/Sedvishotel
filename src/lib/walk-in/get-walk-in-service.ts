import { createGuestFolioService, getGuestFolioServiceClient } from "@/lib/folio/create-guest-folio-service";
import { SupabaseActivityLogRepository } from "@/repositories/supabase/activity-log.repository";
import { SupabaseGuestRepository } from "@/repositories/supabase/guest.repository";
import { SupabasePaymentRepository } from "@/repositories/supabase/payment.repository";
import { SupabaseReservationRepository } from "@/repositories/supabase/reservation.repository";
import { SupabaseRoomRepository } from "@/repositories/supabase/room.repository";
import { SupabaseRoomTypePricingRuleRepository } from "@/repositories/supabase/room-type-pricing-rule.repository";
import { SupabaseSettingsRepository } from "@/repositories/supabase/settings.repository";
import { WalkInService } from "@/services/walk-in.service";

export async function getWalkInService(): Promise<WalkInService> {
  const client = await getGuestFolioServiceClient();

  const folios = createGuestFolioService(client);

  return new WalkInService(
    new SupabaseGuestRepository(client),
    new SupabaseReservationRepository(client),
    new SupabaseRoomRepository(client),
    new SupabasePaymentRepository(client),
    new SupabaseActivityLogRepository(client),
    new SupabaseSettingsRepository(client),
    folios,
    new SupabaseRoomTypePricingRuleRepository(client)
  );
}
