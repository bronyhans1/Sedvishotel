import { createGuestFolioService } from "@/lib/folio/create-guest-folio-service";
import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseEnv } from "@/lib/supabase/config";
import { createServerClient } from "@/lib/supabase/server";
import { SupabaseActivityLogRepository } from "@/repositories/supabase/activity-log.repository";
import { SupabaseInvoiceRepository } from "@/repositories/supabase/invoice.repository";
import { SupabasePaymentRepository } from "@/repositories/supabase/payment.repository";
import { SupabaseSettingsRepository } from "@/repositories/supabase/settings.repository";
import { SupabaseReservationRepository } from "@/repositories/supabase/reservation.repository";
import { PaymentService } from "@/services/payment.service";

export async function getPaymentService(): Promise<PaymentService> {
  const client = supabaseEnv.serviceRoleKey
    ? createAdminClient()
    : await createServerClient();

  const folios = createGuestFolioService(client);

  return new PaymentService(
    new SupabasePaymentRepository(client),
    new SupabaseReservationRepository(client),
    new SupabaseInvoiceRepository(client),
    new SupabaseActivityLogRepository(client),
    new SupabaseSettingsRepository(client),
    folios
  );
}
