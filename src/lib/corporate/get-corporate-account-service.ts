import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseEnv } from "@/lib/supabase/config";
import { createServerClient } from "@/lib/supabase/server";
import { SupabaseActivityLogRepository } from "@/repositories/supabase/activity-log.repository";
import { SupabaseCorporateAccountRepository } from "@/repositories/supabase/corporate-account.repository";
import { SupabaseGroupReservationRepository } from "@/repositories/supabase/group-reservation.repository";
import { SupabaseInvoiceRepository } from "@/repositories/supabase/invoice.repository";
import { SupabasePaymentRepository } from "@/repositories/supabase/payment.repository";
import { CorporateAccountService } from "@/services/corporate-account.service";

export async function getCorporateAccountServiceClient() {
  return supabaseEnv.serviceRoleKey ? createAdminClient() : await createServerClient();
}

export async function getCorporateAccountService(): Promise<CorporateAccountService> {
  const client = await getCorporateAccountServiceClient();
  return new CorporateAccountService(
    new SupabaseCorporateAccountRepository(client),
    new SupabaseGroupReservationRepository(client),
    new SupabaseInvoiceRepository(client),
    new SupabasePaymentRepository(client),
    new SupabaseActivityLogRepository(client)
  );
}
