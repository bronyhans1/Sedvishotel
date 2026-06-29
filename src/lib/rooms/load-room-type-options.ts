import { sessionHasPermission } from "@/lib/auth/permissions";
import type { RoomAccess } from "@/lib/auth/room-access.types";
import {
  deriveRoomTypeOptionsFromRooms,
  mapRoomTypesToOptions,
} from "@/lib/rooms/room-type-options";
import type { RoomTypeService } from "@/services/room-type.service";
import type { AuthSession } from "@/services/auth.service";
import type { IRoomService } from "@/services/room.service";
import type { ServiceContext } from "@/services/types";
import type { Room, RoomTypeOption } from "@/types/room";

/**
 * Room type options for the Rooms module — does not require room_types.view
 * unless the administrator has granted that permission for full catalog access.
 */
export async function loadRoomTypeOptionsForRoomsModule(
  ctx: ServiceContext,
  session: AuthSession,
  rooms: Room[],
  access: RoomAccess,
  roomService: IRoomService,
  roomTypeService: RoomTypeService
): Promise<RoomTypeOption[]> {
  const ensureTypeIds = [...new Set(rooms.map((room) => room.roomTypeId))];

  if (access.canCreate || access.canEdit || access.canChangeStatus) {
    if (sessionHasPermission(session, "room_types", "view")) {
      const roomTypes = await roomTypeService.list(ctx, session);
      return mapRoomTypesToOptions(roomTypes, ensureTypeIds);
    }
    return roomService.listAssignableRoomTypeOptions(ctx, session, ensureTypeIds);
  }

  return deriveRoomTypeOptionsFromRooms(rooms);
}
