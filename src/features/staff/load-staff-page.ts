import { redirect } from "next/navigation";

import { ACCESS_DENIED_PATH } from "@/lib/auth/route-guard";

import { getStaffAccess } from "@/lib/auth/staff-access";
import { getServiceContextForPage } from "@/lib/auth/service-context";
import { getStaffService } from "@/lib/staff/get-staff-service";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function loadStaffPageData() {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const { session, ctx } = await getServiceContextForPage();

  const access = getStaffAccess(session);
  if (!access.canView) {
    redirect(ACCESS_DENIED_PATH);
  }

  const service = await getStaffService();
  const { staff, stats } = await service.listStaff(ctx, session);

  return { staff, stats, access };
}
