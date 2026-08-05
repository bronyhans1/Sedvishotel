import { redirect } from "next/navigation";

import { ACCESS_DENIED_PATH } from "@/lib/auth/route-guard";

import { getServiceContextForPage } from "@/lib/auth/service-context";
import { getSettingsAccess } from "@/lib/auth/settings-access";
import { getCurrentOperatingDay } from "@/lib/dates/business-date";
import { getCalendarDateString } from "@/lib/dates/today";
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
  const isAdmin = session.roleId === "admin";
  const operatingDay = isAdmin ? await getCurrentOperatingDay() : null;

  return {
    settings,
    access,
    isAdmin,
    operatingDay,
    calendarDate: getCalendarDateString(),
  };
}
