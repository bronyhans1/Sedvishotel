import { notFound, redirect } from "next/navigation";

import { ACCESS_DENIED_PATH } from "@/lib/auth/route-guard";

import { getRoomAccess } from "@/lib/auth/room-access";
import { getServiceContextForPage } from "@/lib/auth/service-context";
import { mapFloorsToOptions } from "@/lib/floors/floor-options";
import { getFloorService } from "@/lib/floors/get-floor-service";
import { loadRoomTypeOptionsForRoomsModule } from "@/lib/rooms/load-room-type-options";
import { deriveRoomTypeOptionsFromRooms } from "@/lib/rooms/room-type-options";
import { getRoomService } from "@/lib/rooms/get-room-service";
import { getRoomTypeService } from "@/lib/room-types/get-room-type-service";
import { getRoomPhotoService } from "@/lib/room-photos/get-room-photo-service";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function loadRoomDetail(id: string) {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const { session, ctx } = await getServiceContextForPage();

  const access = getRoomAccess(session);
  if (!access.canView) {
    redirect(ACCESS_DENIED_PATH);
  }

  const service = await getRoomService();
  const floorService = await getFloorService();
  const photoService = await getRoomPhotoService();

  const detail = await service.getDetail(ctx, session, id);
  if (!detail) {
    notFound();
  }

  const needsAssignableTypes =
    access.canEdit || access.canChangeStatus;
  const roomTypeOptions = needsAssignableTypes
    ? await loadRoomTypeOptionsForRoomsModule(
        ctx,
        session,
        [detail.room],
        access,
        service,
        await getRoomTypeService()
      )
    : deriveRoomTypeOptionsFromRooms([detail.room]);

  const [activeFloors, displayGallery, roomPhotos] = await Promise.all([
    floorService.listActiveFloorOptions(session),
    photoService.getDisplayPhotos(
      ctx,
      session,
      detail.room.uuid,
      detail.room.roomTypeUuid
    ),
    photoService.listRoomPhotos(ctx, session, detail.room.uuid),
  ]);

  return {
    room: detail.room,
    access,
    activities: detail.activities,
    displayGallery,
    roomPhotos,
    roomTypeOptions,
    floorOptions: mapFloorsToOptions(
      activeFloors.map((f) => ({
        id: f.id,
        name: f.name,
        displayOrder: f.displayOrder,
        description: "",
        active: true,
        roomCount: 0,
      })),
      [detail.room.floorId]
    ),
  };
}
