import { redirect } from "next/navigation";

import { ACCESS_DENIED_PATH } from "@/lib/auth/route-guard";

import { getGuestAccess } from "@/lib/auth/guest-access";
import { getServiceContextForPage } from "@/lib/auth/service-context";
import { getCurrentBusinessDate } from "@/lib/dates/business-date";
import { getCurrentTimeString } from "@/lib/dates/time";
import { computeGuestStats } from "@/lib/guests/stats";
import { getGuestService } from "@/lib/guests/get-guest-service";
import { resolveDepartureClassification } from "@/lib/reservations/departure-classification";
import { getReservationService } from "@/lib/reservations/get-reservation-service";
import { loadCheckoutPolicy } from "@/lib/settings/checkout-policy";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Guest, GuestOperationalStay } from "@/types/guest";

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

  const [guests, todayEvents, businessDate, checkoutPolicy, reservations] =
    await Promise.all([
      guestService.listGuests(ctx, session),
      reservationService.getTodayStayEventCounts(ctx, session),
      getCurrentBusinessDate(),
      loadCheckoutPolicy(),
      reservationService.listReservations(ctx, session),
    ]);

  const currentTime = getCurrentTimeString();
  const stayByGuestId = new Map<
    string,
    (typeof reservations)[number]
  >();
  for (const reservation of reservations) {
    if (reservation.status === "checked_in" && reservation.guestId) {
      stayByGuestId.set(reservation.guestId, reservation);
    }
  }

  const enriched: Guest[] = guests.map((guest) => {
    const stay = stayByGuestId.get(guest.id);
    if (!stay) {
      return { ...guest, operationalStay: null };
    }
    const resolved = resolveDepartureClassification({
      status: stay.status,
      checkInDate: stay.checkInDate,
      scheduledCheckOutDate: stay.checkOutDate,
      businessDate,
      currentTime,
      policyCheckOutTime: checkoutPolicy.checkOutTime,
    });
    const operationalStay: GuestOperationalStay = {
      classification:
        resolved.classification === "expected_departure" ||
        resolved.classification === "late_checkout" ||
        resolved.classification === "overstay" ||
        resolved.classification === "in_house"
          ? resolved.classification
          : "in_house",
      roomNumber: stay.roomNumber,
      label:
        resolved.classification === "in_house"
          ? "Current Stay"
          : resolved.shortLabel,
    };
    return { ...guest, operationalStay };
  });

  const stats = computeGuestStats({
    guests: enriched,
    checkInsToday: todayEvents.checkInsToday,
    checkOutsToday: todayEvents.checkOutsToday,
  });

  return { guests: enriched, stats, access };
}
