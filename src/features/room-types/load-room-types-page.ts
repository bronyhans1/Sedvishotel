import { redirect } from "next/navigation";

import { ACCESS_DENIED_PATH } from "@/lib/auth/route-guard";

import { getRoomTypeAccess } from "@/lib/auth/room-type-access";
import { getServiceContextForPage } from "@/lib/auth/service-context";
import { computeRoomTypeStats } from "@/lib/room-types/stats";
import { getRoomTypeService } from "@/lib/room-types/get-room-type-service";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function loadRoomTypesPageData() {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const { session, ctx } = await getServiceContextForPage();

  const access = getRoomTypeAccess(session);
  if (!access.canView) {
    redirect(ACCESS_DENIED_PATH);
  }

  const service = await getRoomTypeService();
  const roomTypes = await service.list(ctx, session);
  const stats = computeRoomTypeStats(roomTypes);

  return { roomTypes, stats, access };
}
