import { redirect } from "next/navigation";

import { ACCESS_DENIED_PATH } from "@/lib/auth/route-guard";

import { getStaysAccess } from "@/lib/auth/stays-access";
import { getCheckOutAccess } from "@/lib/auth/check-out-access";
import { getServiceContextForPage } from "@/lib/auth/service-context";
import { getTodayDateString } from "@/lib/dates/today";
import { getReservationService } from "@/lib/reservations/get-reservation-service";
import { loadCheckoutPolicy } from "@/lib/settings/checkout-policy";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function loadStaysPageData() {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const { session, ctx } = await getServiceContextForPage();

  const access = getStaysAccess(session);
  const checkoutAccess = getCheckOutAccess(session);
  if (!access.canView) {
    redirect(ACCESS_DENIED_PATH);
  }

  const today = getTodayDateString();
  const service = await getReservationService();

  const [activeStays, stayStats, checkoutPolicy] = await Promise.all([
    service.listActiveStays(ctx, session),
    service.getStayPageStats(ctx, session, today),
    loadCheckoutPolicy(),
  ]);

  return { activeStays, stayStats, access, checkoutAccess, checkoutPolicy };
}
