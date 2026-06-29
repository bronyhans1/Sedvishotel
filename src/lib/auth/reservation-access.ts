import { sessionHasPermission } from "@/lib/auth/permissions";
import type { ReservationAccess } from "@/lib/auth/reservation-access.types";
import type { AuthSession } from "@/services/auth.service";

export function getReservationAccess(session: AuthSession): ReservationAccess {
  const canView = sessionHasPermission(session, "reservations", "view");
  const canCreate = sessionHasPermission(session, "reservations", "create");
  const canEdit = sessionHasPermission(session, "reservations", "edit");
  const canCancel =
    sessionHasPermission(session, "reservations", "delete") ||
    sessionHasPermission(session, "reservations", "manage") ||
    sessionHasPermission(session, "reservations", "edit");

  return { canView, canCreate, canEdit, canCancel };
}

export function requireReservationView(session: AuthSession): void {
  if (!sessionHasPermission(session, "reservations", "view")) {
    throw new Error("Forbidden: reservations.view required");
  }
}
