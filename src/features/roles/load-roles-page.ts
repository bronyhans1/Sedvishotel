import { redirect } from "next/navigation";

import { ACCESS_DENIED_PATH } from "@/lib/auth/route-guard";
import { getRolesAccess } from "@/lib/auth/roles-access";
import { getServiceContextForPage } from "@/lib/auth/service-context";
import { getRoleService } from "@/lib/roles/get-role-service";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function loadRolesPageData() {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const { session, ctx } = await getServiceContextForPage();
  const access = getRolesAccess(session);

  if (!access.canView) {
    redirect(ACCESS_DENIED_PATH);
  }

  const service = await getRoleService();
  const data = await service.getRolesPageData(ctx, session);

  return { ...data, access };
}
