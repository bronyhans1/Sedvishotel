import { notFound, redirect } from "next/navigation";

import { ACCESS_DENIED_PATH } from "@/lib/auth/route-guard";

import { getGuestAccess } from "@/lib/auth/guest-access";
import { getServiceContextForPage } from "@/lib/auth/service-context";
import { getGuestService } from "@/lib/guests/get-guest-service";
import { getReservationService } from "@/lib/reservations/get-reservation-service";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Reservation } from "@/types/reservation";

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

  const allReservations = await reservationService.listReservations(ctx, session);
  const guestReservations: Reservation[] = allReservations.filter(
    (r) => r.guestEmail.toLowerCase() === guest.email.toLowerCase()
  );

  return { guest, access, guestReservations };
}
