import { loadTaxAndChargeSettings } from "@/lib/settings/pricing-settings";
import { createGuestFolioService, getGuestFolioServiceClient } from "@/lib/folio/create-guest-folio-service";
import { SupabaseActivityLogRepository } from "@/repositories/supabase/activity-log.repository";
import { SupabaseGuestRepository } from "@/repositories/supabase/guest.repository";
import { SupabaseNotificationRepository } from "@/repositories/supabase/notification.repository";
import { SupabaseRoomTypePricingRuleRepository } from "@/repositories/supabase/room-type-pricing-rule.repository";
import { SupabaseReservationRepository } from "@/repositories/supabase/reservation.repository";
import { SupabaseRoomRepository } from "@/repositories/supabase/room.repository";
import { ReservationService } from "@/services/reservation.service";

export async function getReservationService(): Promise<ReservationService> {
  const client = await getGuestFolioServiceClient();

  const pricingSettings = await loadTaxAndChargeSettings();

  const folios = createGuestFolioService(client);

  return new ReservationService(
    new SupabaseReservationRepository(client),
    new SupabaseGuestRepository(client),
    new SupabaseRoomRepository(client),
    new SupabaseActivityLogRepository(client),
    folios,
    new SupabaseNotificationRepository(client),
    pricingSettings,
    new SupabaseRoomTypePricingRuleRepository(client)
  );
}
