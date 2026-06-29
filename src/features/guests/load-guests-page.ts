import { redirect } from "next/navigation";

import { ACCESS_DENIED_PATH } from "@/lib/auth/route-guard";

import { getGuestAccess } from "@/lib/auth/guest-access";
import { getServiceContextForPage } from "@/lib/auth/service-context";
import { computeGuestStats } from "@/lib/guests/stats";
import { getGuestService } from "@/lib/guests/get-guest-service";
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

  const service = await getGuestService();
  const guests = await service.listGuests(ctx, session);
  const stats = computeGuestStats(guests);

  return { guests, stats, access };
}
