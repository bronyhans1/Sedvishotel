import { redirect } from "next/navigation";

import { ACCESS_DENIED_PATH } from "@/lib/auth/route-guard";

import { getGuestAccess } from "@/lib/auth/guest-access";
import { getServiceContextForPage } from "@/lib/auth/service-context";
import { computeGuestStats } from "@/lib/guests/stats";
import { getGuestService } from "@/lib/guests/get-guest-service";
import { getReservationService } from "@/lib/reservations/get-reservation-service";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function loadGuestsPageData() {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const { session, ctx } = await getServiceContextForPage();

  const access = getGuestAccess(session);
  if (!access.canView) {
    redirect(ACCESS_DENIED_PATH);
  }

  const guestService = await getGuestService();
  const reservationService = await getReservationService();

  const [guests, todayEvents] = await Promise.all([
    guestService.listGuests(ctx, session),
    reservationService.getTodayStayEventCounts(ctx, session),
  ]);

  const stats = computeGuestStats({
    guests,
    checkInsToday: todayEvents.checkInsToday,
    checkOutsToday: todayEvents.checkOutsToday,
  });

  return { guests, stats, access };
}
