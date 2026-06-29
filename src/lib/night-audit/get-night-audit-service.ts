import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseEnv } from "@/lib/supabase/config";
import { createServerClient } from "@/lib/supabase/server";
import { SupabaseActivityLogRepository } from "@/repositories/supabase/activity-log.repository";
import { SupabaseGuestFolioRepository } from "@/repositories/supabase/guest-folio.repository";
import { SupabaseNightAuditRepository } from "@/repositories/supabase/night-audit.repository";
import { SupabasePaymentRepository } from "@/repositories/supabase/payment.repository";
import { SupabasePosRepository } from "@/repositories/supabase/pos.repository";
import { SupabaseReservationRepository } from "@/repositories/supabase/reservation.repository";
import { SupabaseRoomRepository } from "@/repositories/supabase/room.repository";
import { SupabaseShiftHandoverRepository } from "@/repositories/supabase/shift-handover.repository";
import { SupabaseUserRepository } from "@/repositories/supabase/user.repository";
import { NightAuditService } from "@/services/night-audit.service";

export async function getNightAuditService(): Promise<NightAuditService> {
  const client = supabaseEnv.serviceRoleKey
    ? createAdminClient()
    : await createServerClient();

  return new NightAuditService(
    new SupabaseNightAuditRepository(client),
    new SupabaseShiftHandoverRepository(client),
    new SupabaseRoomRepository(client),
    new SupabaseReservationRepository(client),
    new SupabasePaymentRepository(client),
    new SupabasePosRepository(client),
    new SupabaseUserRepository(client),
    new SupabaseActivityLogRepository(client),
    new SupabaseGuestFolioRepository(client)
  );
}
