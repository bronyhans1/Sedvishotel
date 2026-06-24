import { redirect } from "next/navigation";

import { ACCESS_DENIED_PATH } from "@/lib/auth/route-guard";
import { getShiftHandoverAccess } from "@/lib/auth/shift-handover-access";
import { getServiceContextForPage } from "@/lib/auth/service-context";
import { getShiftHandoverService } from "@/lib/shift-handover/get-shift-handover-service";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { ShiftHandoverPageData } from "@/types/shift-handover";

export async function loadShiftHandoverPageData(): Promise<
  ShiftHandoverPageData & { access: ReturnType<typeof getShiftHandoverAccess> }
> {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const { session, ctx } = await getServiceContextForPage();
  const access = getShiftHandoverAccess(session);
  if (!access.canView) {
    redirect(ACCESS_DENIED_PATH);
  }

  const service = await getShiftHandoverService();
  const [currentShift, history] = await Promise.all([
    service.getCurrentShift(ctx, session),
    service.listHandovers(ctx, session),
  ]);

  return { currentShift, history, access };
}
