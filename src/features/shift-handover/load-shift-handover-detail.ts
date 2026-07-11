import { notFound, redirect } from "next/navigation";

import { ACCESS_DENIED_PATH } from "@/lib/auth/route-guard";
import { getShiftHandoverAccess } from "@/lib/auth/shift-handover-access";
import { getServiceContextForPage } from "@/lib/auth/service-context";
import { getShiftHandoverService } from "@/lib/shift-handover/get-shift-handover-service";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function loadShiftHandoverDetail(handoverNumber: string) {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const { session, ctx } = await getServiceContextForPage();
  const access = getShiftHandoverAccess(session);
  if (!access.canView) {
    redirect(ACCESS_DENIED_PATH);
  }

  const service = await getShiftHandoverService();
  const pkg = await service.getHandoverPackage(ctx, session, handoverNumber);
  if (!pkg) {
    notFound();
  }

  return { ...pkg, access };
}
