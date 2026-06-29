import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseEnv } from "@/lib/supabase/config";
import { createServerClient } from "@/lib/supabase/server";
import { SupabaseActivityLogRepository } from "@/repositories/supabase/activity-log.repository";
import { SupabaseInvoiceRepository } from "@/repositories/supabase/invoice.repository";
import { SupabaseReservationRepository } from "@/repositories/supabase/reservation.repository";
import { InvoiceService } from "@/services/invoice.service";

export async function getInvoiceService(): Promise<InvoiceService> {
  const client = supabaseEnv.serviceRoleKey
    ? createAdminClient()
    : await createServerClient();

  return new InvoiceService(
    new SupabaseInvoiceRepository(client),
    new SupabaseReservationRepository(client),
    new SupabaseActivityLogRepository(client)
  );
}
