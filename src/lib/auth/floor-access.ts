import type { AuthSession } from "@/services/auth.service";
import { sessionHasPermission } from "@/lib/auth/permissions";
import type { FloorAccess } from "@/lib/auth/floor-access.types";

export function getFloorAccess(session: AuthSession): FloorAccess {
  const canView = sessionHasPermission(session, "floors", "view");
  const canCreate = sessionHasPermission(session, "floors", "create");
  const canEdit = sessionHasPermission(session, "floors", "edit");
  const canArchive = sessionHasPermission(session, "floors", "edit");
  const canManage = sessionHasPermission(session, "floors", "manage");
  const canDelete = sessionHasPermission(session, "floors", "delete");
  return { canView, canCreate, canEdit, canArchive, canManage, canDelete };
}
