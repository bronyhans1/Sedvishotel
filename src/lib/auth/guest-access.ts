import { sessionHasPermission } from "@/lib/auth/permissions";
import type { GuestAccess } from "@/lib/auth/guest-access.types";
import type { AuthSession } from "@/services/auth.service";

export function getGuestAccess(session: AuthSession): GuestAccess {
  const canView = sessionHasPermission(session, "guests", "view");
  const canCreate = sessionHasPermission(session, "guests", "create");
  const canEdit = sessionHasPermission(session, "guests", "edit");
  const canArchive =
    sessionHasPermission(session, "guests", "delete") ||
    sessionHasPermission(session, "guests", "manage");

  return { canView, canCreate, canEdit, canArchive };
}

export function requireGuestView(session: AuthSession): void {
  if (!sessionHasPermission(session, "guests", "view")) {
    throw new Error("Forbidden: guests.view required");
  }
}
