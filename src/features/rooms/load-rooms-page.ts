import { redirect } from "next/navigation";

import { ACCESS_DENIED_PATH } from "@/lib/auth/route-guard";

import { getRoomAccess } from "@/lib/auth/room-access";
import { getServiceContextForPage } from "@/lib/auth/service-context";
import { mapFloorsToOptions } from "@/lib/floors/floor-options";
import { getFloorService } from "@/lib/floors/get-floor-service";
import { computeRoomStats } from "@/lib/occupancy";
import { getRoomService } from "@/lib/rooms/get-room-service";
import { mapRoomTypesToOptions } from "@/lib/rooms/room-type-options";
import { getRoomTypeService } from "@/lib/room-types/get-room-type-service";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function loadRoomsPageData() {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const { session, ctx } = await getServiceContextForPage();

  const access = getRoomAccess(session);
  if (!access.canView) {
    redirect(ACCESS_DENIED_PATH);
  }

  const service = await getRoomService();
  const roomTypeService = await getRoomTypeService();
  const floorService = await getFloorService();
  const [rooms, roomTypes, activeFloors] = await Promise.all([
    service.list(ctx, session),
    roomTypeService.list(ctx, session),
    floorService.listActiveFloorOptions(session),
  ]);
  const stats = computeRoomStats(rooms);
  const roomTypeOptions = mapRoomTypesToOptions(
    roomTypes,
    [...new Set(rooms.map((room) => room.roomTypeId))]
  );
  const floorOptions = mapFloorsToOptions(
    activeFloors.map((f) => ({
      id: f.id,
      name: f.name,
      displayOrder: f.displayOrder,
      description: "",
      active: true,
      roomCount: 0,
    })),
    [...new Set(rooms.map((room) => room.floorId))]
  );

  return { rooms, stats, access, roomTypeOptions, floorOptions };
}
