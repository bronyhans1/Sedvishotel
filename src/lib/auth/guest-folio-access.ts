import type { GuestFolioAccess } from "@/lib/auth/guest-folio-access.types";
import { sessionHasPermission } from "@/lib/auth/permissions";
import type { AuthSession } from "@/services/auth.service";

export function getGuestFolioAccess(session: AuthSession): GuestFolioAccess {
  return {
    canView: sessionHasPermission(session, "guest_folio", "view"),
    canCreate: sessionHasPermission(session, "guest_folio", "create"),
    canEdit: sessionHasPermission(session, "guest_folio", "edit"),
    canDelete: sessionHasPermission(session, "guest_folio", "delete"),
    canManage: sessionHasPermission(session, "guest_folio", "manage"),
  };
}
