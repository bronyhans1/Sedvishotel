import { sessionHasPermission } from "@/lib/auth/permissions";
import type { RoomAccess } from "@/lib/auth/room-access.types";
import type { AuthSession } from "@/services/auth.service";

export function getRoomAccess(session: AuthSession): RoomAccess {
  const canView = sessionHasPermission(session, "rooms", "view");
  const canCreate = sessionHasPermission(session, "rooms", "create");
  const canEdit =
    sessionHasPermission(session, "rooms", "edit") &&
    session.roleId !== "housekeeping";
  const canChangeStatus = sessionHasPermission(session, "rooms", "edit");
  const canArchive =
    sessionHasPermission(session, "rooms", "delete") ||
    sessionHasPermission(session, "rooms", "manage") ||
    (sessionHasPermission(session, "rooms", "edit") &&
      session.roleId !== "housekeeping");
  const canDelete = sessionHasPermission(session, "rooms", "delete");

  return { canView, canCreate, canEdit, canChangeStatus, canArchive, canDelete };
}

export function requireRoomView(session: AuthSession): void {
  if (!sessionHasPermission(session, "rooms", "view")) {
    throw new Error("Forbidden: rooms.view required");
  }
}
