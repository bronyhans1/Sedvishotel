import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseEnv } from "@/lib/supabase/config";
import { loadTaxAndChargeSettings } from "@/lib/settings/pricing-settings";
import { SupabaseActivityLogRepository } from "@/repositories/supabase/activity-log.repository";
import { SupabaseGuestRepository } from "@/repositories/supabase/guest.repository";
import { SupabaseNotificationRepository } from "@/repositories/supabase/notification.repository";
import { SupabaseReservationRepository } from "@/repositories/supabase/reservation.repository";
import { SupabaseRoomRepository } from "@/repositories/supabase/room.repository";
import { PublicBookingService } from "@/services/public-booking.service";

export async function getPublicBookingService(): Promise<PublicBookingService> {
  if (!supabaseEnv.serviceRoleKey) {
    throw new Error("Public booking requires SUPABASE_SERVICE_ROLE_KEY.");
  }

  const client = createAdminClient();
  const pricingSettings = await loadTaxAndChargeSettings();

  return new PublicBookingService(
    new SupabaseReservationRepository(client),
    new SupabaseGuestRepository(client),
    new SupabaseRoomRepository(client),
    new SupabaseNotificationRepository(client),
    new SupabaseActivityLogRepository(client),
    pricingSettings
  );
}
