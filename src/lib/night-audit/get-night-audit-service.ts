import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseEnv } from "@/lib/supabase/config";
import { createServerClient } from "@/lib/supabase/server";
import { createGuestFolioService } from "@/lib/folio/create-guest-folio-service";
import { getReservationService } from "@/lib/reservations/get-reservation-service";
import { SupabaseActivityLogRepository } from "@/repositories/supabase/activity-log.repository";
import { SupabaseGuestFolioRepository } from "@/repositories/supabase/guest-folio.repository";
import { SupabaseHotelOperatingDayRepository } from "@/repositories/supabase/hotel-operating-day.repository";
import { SupabaseNightAuditRepository } from "@/repositories/supabase/night-audit.repository";
import { SupabaseOverstayChargeRepository } from "@/repositories/supabase/overstay-charge.repository";
import { SupabasePaymentRepository } from "@/repositories/supabase/payment.repository";
import { SupabasePosRepository } from "@/repositories/supabase/pos.repository";
import { SupabaseReservationRepository } from "@/repositories/supabase/reservation.repository";
import { SupabaseRoomRepository } from "@/repositories/supabase/room.repository";
import { SupabaseShiftHandoverRepository } from "@/repositories/supabase/shift-handover.repository";
import { SupabaseUserRepository } from "@/repositories/supabase/user.repository";
import { BusinessDateService } from "@/services/business-date.service";
import { NightAuditService } from "@/services/night-audit.service";
import { OverstayService } from "@/services/overstay.service";

export async function getNightAuditService(): Promise<NightAuditService> {
  const client = supabaseEnv.serviceRoleKey
    ? createAdminClient()
    : await createServerClient();

  const users = new SupabaseUserRepository(client);
  const activityLogs = new SupabaseActivityLogRepository(client);
  const reservations = new SupabaseReservationRepository(client);
  const businessDates = new BusinessDateService(
    new SupabaseHotelOperatingDayRepository(client),
    users,
    activityLogs
  );

  const overstays = new OverstayService(
    new SupabaseOverstayChargeRepository(client),
    reservations,
    createGuestFolioService(client),
    activityLogs
  );

  const reservationService = await getReservationService();

  return new NightAuditService(
    new SupabaseNightAuditRepository(client),
    new SupabaseShiftHandoverRepository(client),
    new SupabaseRoomRepository(client),
    reservations,
    new SupabasePaymentRepository(client),
    new SupabasePosRepository(client),
    users,
    activityLogs,
    businessDates,
    new SupabaseGuestFolioRepository(client),
    overstays,
    reservationService
  );
}
