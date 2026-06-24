import { redirect } from "next/navigation";

import { ACCESS_DENIED_PATH } from "@/lib/auth/route-guard";

import { getCheckOutAccess } from "@/lib/auth/check-out-access";
import { getServiceContextForPage } from "@/lib/auth/service-context";
import { getTodayDateString } from "@/lib/dates/today";
import { getReservationService } from "@/lib/reservations/get-reservation-service";
import { loadCheckoutPolicy } from "@/lib/settings/checkout-policy";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function loadCheckOutPageData() {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const { session, ctx } = await getServiceContextForPage();

  const access = getCheckOutAccess(session);
  if (!access.canView) {
    redirect(ACCESS_DENIED_PATH);
  }

  const today = getTodayDateString();
  const service = await getReservationService();

  const [checkedInReservations, stats, checkoutPolicy] = await Promise.all([
    service.listCheckedInReservations(ctx, session),
    service.getCheckOutPageStats(ctx, session, today),
    loadCheckoutPolicy(),
  ]);

  return { checkedInReservations, stats, access, today, checkoutPolicy };
}
