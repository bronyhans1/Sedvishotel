import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseEnv } from "@/lib/supabase/config";
import { createServerClient } from "@/lib/supabase/server";
import { getReservationService } from "@/lib/reservations/get-reservation-service";
import { SupabaseActivityLogRepository } from "@/repositories/supabase/activity-log.repository";
import { SupabaseCorporateAccountRepository } from "@/repositories/supabase/corporate-account.repository";
import { SupabaseGroupReservationRepository } from "@/repositories/supabase/group-reservation.repository";
import { SupabaseGroupTimelineRepository } from "@/repositories/supabase/group-timeline.repository";
import { SupabaseGuestFolioRepository } from "@/repositories/supabase/guest-folio.repository";
import { SupabaseNotificationRepository } from "@/repositories/supabase/notification.repository";
import { SupabaseReservationBlockRepository } from "@/repositories/supabase/reservation-block.repository";
import { SupabaseReservationRepository } from "@/repositories/supabase/reservation.repository";
import { GroupReservationService } from "@/services/group-reservation.service";

export async function getGroupReservationService(): Promise<GroupReservationService> {
  const client = supabaseEnv.serviceRoleKey ? createAdminClient() : await createServerClient();
  const reservationService = await getReservationService();

  return new GroupReservationService(
    new SupabaseGroupReservationRepository(client),
    new SupabaseReservationRepository(client),
    reservationService,
    new SupabaseReservationBlockRepository(client),
    new SupabaseGuestFolioRepository(client),
    new SupabaseGroupTimelineRepository(client),
    new SupabaseCorporateAccountRepository(client),
    new SupabaseActivityLogRepository(client),
    new SupabaseNotificationRepository(client)
  );
}
