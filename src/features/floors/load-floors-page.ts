import { redirect } from "next/navigation";

import { ACCESS_DENIED_PATH } from "@/lib/auth/route-guard";
import { getFloorAccess } from "@/lib/auth/floor-access";
import { getServiceContextForPage } from "@/lib/auth/service-context";
import { computeFloorStats } from "@/lib/floors/stats";
import { getFloorService } from "@/lib/floors/get-floor-service";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function loadFloorsPageData() {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const { session, ctx } = await getServiceContextForPage();
  const access = getFloorAccess(session);
  if (!access.canView) {
    redirect(ACCESS_DENIED_PATH);
  }

  const service = await getFloorService();
  const floors = await service.listFloors(ctx, session);
  const stats = computeFloorStats(floors);

  return { floors, stats, access };
}
