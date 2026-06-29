import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseEnv } from "@/lib/supabase/config";
import { createServerClient } from "@/lib/supabase/server";
import { SupabaseActivityLogRepository } from "@/repositories/supabase/activity-log.repository";
import { SupabaseGuestFolioRepository } from "@/repositories/supabase/guest-folio.repository";
import { SupabaseInvoiceRepository } from "@/repositories/supabase/invoice.repository";
import { SupabasePaymentRepository } from "@/repositories/supabase/payment.repository";
import { SupabaseReservationRepository } from "@/repositories/supabase/reservation.repository";
import { GuestFolioService } from "@/services/guest-folio.service";
import type { SupabaseServerClient } from "@/lib/supabase/server";

export function createGuestFolioService(
  client: SupabaseServerClient
): GuestFolioService {
  return new GuestFolioService(
    new SupabaseGuestFolioRepository(client),
    new SupabaseReservationRepository(client),
    new SupabaseActivityLogRepository(client),
    new SupabaseInvoiceRepository(client),
    new SupabasePaymentRepository(client)
  );
}

export async function getGuestFolioServiceClient() {
  return supabaseEnv.serviceRoleKey
    ? createAdminClient()
    : await createServerClient();
}
