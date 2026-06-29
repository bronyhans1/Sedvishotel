import { sessionHasPermission } from "@/lib/auth/permissions";
import type { AdministrationAccess } from "@/lib/auth/administration-access";
import type { AuthSession } from "@/services/auth.service";

export type RolesAccess = AdministrationAccess;

/** Permission-driven roles access — dedicated roles module. */
export function getRolesAccess(session: AuthSession): RolesAccess {
  return {
    canView: sessionHasPermission(session, "roles", "view"),
    canManage: sessionHasPermission(session, "roles", "manage"),
  };
}
