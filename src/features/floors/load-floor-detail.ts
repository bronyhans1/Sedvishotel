import { notFound, redirect } from "next/navigation";

import { ACCESS_DENIED_PATH } from "@/lib/auth/route-guard";
import { getFloorAccess } from "@/lib/auth/floor-access";
import { getServiceContextForPage } from "@/lib/auth/service-context";
import { getFloorService } from "@/lib/floors/get-floor-service";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function loadFloorDetail(id: string) {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const { session, ctx } = await getServiceContextForPage();
  const access = getFloorAccess(session);
  if (!access.canView) {
    redirect(ACCESS_DENIED_PATH);
  }

  const service = await getFloorService();
  const floor = await service.getFloorById(ctx, session, id);
  if (!floor) {
    notFound();
  }

  return { floor, access };
}
