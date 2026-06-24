import { sessionHasPermission } from "@/lib/auth/permissions";
import type { RoomTypeAccess } from "@/lib/auth/room-type-access.types";
import type { AuthSession } from "@/services/auth.service";

export function getRoomTypeAccess(session: AuthSession): RoomTypeAccess {
  const canView = sessionHasPermission(session, "room_types", "view");
  const canCreate = sessionHasPermission(session, "room_types", "create");
  const canEdit = sessionHasPermission(session, "room_types", "edit");
  const canArchive = sessionHasPermission(session, "room_types", "edit");
  const canDelete = sessionHasPermission(session, "room_types", "delete");

  return { canView, canCreate, canEdit, canArchive, canDelete };
}

export function requireRoomTypeView(session: AuthSession): void {
  if (!sessionHasPermission(session, "room_types", "view")) {
    throw new Error("Forbidden: room_types.view required");
  }
}
