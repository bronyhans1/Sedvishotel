import { redirect } from "next/navigation";

import { ACCESS_DENIED_PATH } from "@/lib/auth/route-guard";

import { getServiceContextForPage } from "@/lib/auth/service-context";
import { getSettingsAccess } from "@/lib/auth/settings-access";
import { getSettingsService } from "@/lib/settings/get-settings-service";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function loadSettingsPageData() {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const { session, ctx } = await getServiceContextForPage();

  const access = getSettingsAccess(session);
  if (!access.canView) {
    redirect(ACCESS_DENIED_PATH);
  }

  const service = await getSettingsService();
  const settings = await service.getHotelSettings(ctx, session);

  return {
    settings,
    access,
    isAdmin: session.roleId === "admin",
  };
}
