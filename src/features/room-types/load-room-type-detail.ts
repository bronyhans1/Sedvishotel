import { notFound, redirect } from "next/navigation";

import { ACCESS_DENIED_PATH } from "@/lib/auth/route-guard";

import { getRoomTypeAccess } from "@/lib/auth/room-type-access";
import { getServiceContextForPage } from "@/lib/auth/service-context";
import { getRoomTypeService } from "@/lib/room-types/get-room-type-service";
import { getRoomPhotoService } from "@/lib/room-photos/get-room-photo-service";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function loadRoomTypeDetail(id: string) {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const { session, ctx } = await getServiceContextForPage();

  const access = getRoomTypeAccess(session);
  if (!access.canView) {
    redirect(ACCESS_DENIED_PATH);
  }

  const service = await getRoomTypeService();
  const photoService = await getRoomPhotoService();
  const roomType = await service.getById(ctx, session, id);
  if (!roomType) {
    notFound();
  }

  const photos = await photoService.listRoomTypePhotos(
    ctx,
    session,
    roomType.uuid
  );

  return { roomType, access, photos };
}
