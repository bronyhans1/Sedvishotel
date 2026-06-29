import type { PosAccess } from "@/lib/auth/pos-access.types";
import { sessionHasPermission } from "@/lib/auth/permissions";
import type { AuthSession } from "@/services/auth.service";

export function getPosAccess(session: AuthSession): PosAccess {
  return {
    canView: sessionHasPermission(session, "pos", "view"),
    canCreate: sessionHasPermission(session, "pos", "create"),
    canEdit: sessionHasPermission(session, "pos", "edit"),
    canDelete: sessionHasPermission(session, "pos", "delete"),
    canManage: sessionHasPermission(session, "pos", "manage"),
    canOverrideVat:
      session.permissions.includes("payments.override_vat") ||
      sessionHasPermission(session, "payments", "override_vat"),
  };
}
