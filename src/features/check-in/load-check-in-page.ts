import { redirect } from "next/navigation";

import { ACCESS_DENIED_PATH } from "@/lib/auth/route-guard";

import { getCheckInAccess } from "@/lib/auth/check-in-access";
import { getServiceContextForPage } from "@/lib/auth/service-context";
import { getTodayDateString } from "@/lib/dates/today";
import { getReservationService } from "@/lib/reservations/get-reservation-service";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function loadCheckInPageData() {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const { session, ctx } = await getServiceContextForPage();

  const access = getCheckInAccess(session);
  if (!access.canView) {
    redirect(ACCESS_DENIED_PATH);
  }

  const today = getTodayDateString();
  const service = await getReservationService();

  const [pendingCheckIns, stats] = await Promise.all([
    service.listPendingCheckIns(ctx, session, today),
    service.getCheckInPageStats(ctx, session, today),
  ]);

  return { pendingCheckIns, stats, access, today };
}
