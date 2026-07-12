import { sessionHasPermission } from "@/lib/auth/permissions";
import type { AuthSession } from "@/services/auth.service";

export type GroupReservationAccess = {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManage: boolean;
};

export function getGroupReservationAccess(session: AuthSession): GroupReservationAccess {
  return {
    canView: sessionHasPermission(session, "group_reservations", "view"),
    canCreate: sessionHasPermission(session, "group_reservations", "create"),
    canEdit: sessionHasPermission(session, "group_reservations", "edit"),
    canDelete: sessionHasPermission(session, "group_reservations", "delete"),
    canManage: sessionHasPermission(session, "group_reservations", "manage"),
  };
}
