import { redirect } from "next/navigation";

import { ACCESS_DENIED_PATH } from "@/lib/auth/route-guard";

import {
  buildGuestListQuery,
  parseGuestSearchParams,
} from "@/features/guests/lib/parse-guest-search-params";
import { getGuestAccess } from "@/lib/auth/guest-access";
import { getServiceContextForPage } from "@/lib/auth/service-context";
import { getCurrentBusinessDate } from "@/lib/dates/business-date";
import { getCurrentTimeString } from "@/lib/dates/time";
import { getGuestService } from "@/lib/guests/get-guest-service";
import { parsePageParam } from "@/lib/pagination/pagination";
import { resolveDepartureClassification } from "@/lib/reservations/departure-classification";
import { getReservationService } from "@/lib/reservations/get-reservation-service";
import { loadCheckoutPolicy } from "@/lib/settings/checkout-policy";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Guest, GuestOperationalStay, GuestStats } from "@/types/guest";

export async function loadGuestsPageData(
  params: Record<string, string | string[] | undefined> = {}
) {
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
  const filters = parseGuestSearchParams(params);
  const requestedPage = parsePageParam(params.page);
  const businessDate = await getCurrentBusinessDate();

  const [guestPage, todayEvents, checkoutPolicy] = await Promise.all([
    guestService.listGuestPage(ctx, session, {
      page: requestedPage,
      businessDate,
      filters,
    }),
    reservationService.getTodayStayEventCounts(ctx, session),
    loadCheckoutPolicy(),
  ]);

  if (guestPage.page !== requestedPage) {
    const query = buildGuestListQuery(filters, guestPage.page);
    redirect(query ? `/dashboard/guests?${query}` : "/dashboard/guests");
  }

  const currentTime = getCurrentTimeString();
  const stayByGuestId = new Map(guestPage.stays.map((stay) => [stay.guestId, stay]));
  const guests: Guest[] = guestPage.guests.map((guest) => {
    const stay = stayByGuestId.get(guest.id);
    if (!stay || stay.status !== "checked_in") {
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

  const stats: GuestStats = {
    ...guestPage.stats,
    checkInsToday: todayEvents.checkInsToday,
    checkOutsToday: todayEvents.checkOutsToday,
  };

  return {
    guests,
    total: guestPage.total,
    page: guestPage.page,
    pageSize: guestPage.pageSize,
    filters,
    stats,
    access,
  };
}
