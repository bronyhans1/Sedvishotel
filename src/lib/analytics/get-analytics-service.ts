import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseEnv } from "@/lib/supabase/config";
import { createServerClient } from "@/lib/supabase/server";
import { SupabaseActivityLogRepository } from "@/repositories/supabase/activity-log.repository";
import { SupabaseGuestRepository } from "@/repositories/supabase/guest.repository";
import { SupabaseInvoiceRepository } from "@/repositories/supabase/invoice.repository";
import { SupabasePaymentRepository } from "@/repositories/supabase/payment.repository";
import { SupabaseReservationRepository } from "@/repositories/supabase/reservation.repository";
import { SupabaseRoomRepository } from "@/repositories/supabase/room.repository";
import { AnalyticsService } from "@/services/analytics.service";

export async function getAnalyticsService(): Promise<AnalyticsService> {
  const client = supabaseEnv.serviceRoleKey
    ? createAdminClient()
    : await createServerClient();

  return new AnalyticsService(
    new SupabasePaymentRepository(client),
    new SupabaseInvoiceRepository(client),
    new SupabaseReservationRepository(client),
    new SupabaseRoomRepository(client),
    new SupabaseGuestRepository(client),
    new SupabaseActivityLogRepository(client)
  );
}
