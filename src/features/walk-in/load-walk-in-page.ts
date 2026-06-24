import { redirect } from "next/navigation";

import { ACCESS_DENIED_PATH } from "@/lib/auth/route-guard";

import { getWalkInAccess } from "@/lib/auth/walk-in-access";
import { getServiceContextForPage } from "@/lib/auth/service-context";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function loadWalkInPageData() {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const { session } = await getServiceContextForPage();

  const access = getWalkInAccess(session);
  if (!access.canView) {
    redirect(ACCESS_DENIED_PATH);
  }

  return { access };
}
