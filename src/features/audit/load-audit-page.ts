import { redirect } from "next/navigation";

import { ACCESS_DENIED_PATH } from "@/lib/auth/route-guard";

import { getAuditAccess } from "@/lib/auth/audit-access";
import { getServiceContextForPage } from "@/lib/auth/service-context";
import { getAuditService } from "@/lib/audit/get-audit-service";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function loadAuditPageData() {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const { session, ctx } = await getServiceContextForPage();

  const access = getAuditAccess(session);
  if (!access.canView) {
    redirect(ACCESS_DENIED_PATH);
  }

  const service = await getAuditService();
  const data = await service.getDashboardData(ctx, session);

  return { data, access };
}
