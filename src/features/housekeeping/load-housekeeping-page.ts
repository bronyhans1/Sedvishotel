import { redirect } from "next/navigation";

import { ACCESS_DENIED_PATH } from "@/lib/auth/route-guard";

import { getHousekeepingAccess } from "@/lib/auth/housekeeping-access";
import { getServiceContextForPage } from "@/lib/auth/service-context";
import { getHousekeepingService } from "@/lib/housekeeping/get-housekeeping-service";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function loadHousekeepingPageData() {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const { session, ctx } = await getServiceContextForPage();

  const access = getHousekeepingAccess(session);
  if (!access.canView) {
    redirect(ACCESS_DENIED_PATH);
  }

  const service = await getHousekeepingService();
  const { tasks, stats } = await service.listTasks(ctx, session);

  return { tasks, stats, access };
}
