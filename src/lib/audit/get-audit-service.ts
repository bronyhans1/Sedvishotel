import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseEnv } from "@/lib/supabase/config";
import { createServerClient } from "@/lib/supabase/server";
import { SupabaseActivityLogRepository } from "@/repositories/supabase/activity-log.repository";
import { SupabaseInvoiceRepository } from "@/repositories/supabase/invoice.repository";
import { SupabasePaymentRepository } from "@/repositories/supabase/payment.repository";
import { SupabaseReservationRepository } from "@/repositories/supabase/reservation.repository";
import { SupabaseRoomRepository } from "@/repositories/supabase/room.repository";
import { SupabaseUserRepository } from "@/repositories/supabase/user.repository";
import { AuditService } from "@/services/audit.service";

export async function getAuditService(): Promise<AuditService> {
  const client = supabaseEnv.serviceRoleKey
    ? createAdminClient()
    : await createServerClient();

  const admin = supabaseEnv.serviceRoleKey ? createAdminClient() : undefined;

  return new AuditService(
    new SupabaseActivityLogRepository(client),
    new SupabaseReservationRepository(client),
    new SupabasePaymentRepository(client),
    new SupabaseInvoiceRepository(client),
    new SupabaseRoomRepository(client),
    new SupabaseUserRepository(client, admin)
  );
}
