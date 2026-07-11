import { notFound, redirect } from "next/navigation";

import { ACCESS_DENIED_PATH } from "@/lib/auth/route-guard";

import { getGuestAccess } from "@/lib/auth/guest-access";
import { getServiceContextForPage } from "@/lib/auth/service-context";
import { computeGuestProfileInsights } from "@/lib/guests/profile-insights";
import { getGuestService } from "@/lib/guests/get-guest-service";
import { getReservationService } from "@/lib/reservations/get-reservation-service";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function loadGuestDetail(id: string) {
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

  const guest = await guestService.getGuestById(ctx, session, id);
  if (!guest) {
    notFound();
  }

  const [guestReservations, spendContext] = await Promise.all([
    reservationService.listReservationsByGuestId(ctx, session, id),
    guestService.getGuestSpendContext(ctx, session, id),
  ]);

  const profileInsights = computeGuestProfileInsights(
    guest,
    guestReservations,
    spendContext.lifetimePosSpend,
    spendContext.paymentMethods
  );

  return { guest, access, guestReservations, profileInsights };
}
