import { sessionHasPermission } from "@/lib/auth/permissions";
import type { AuthSession } from "@/services/auth.service";
import type { DbPermissionModule } from "@/types/database";

export type AdministrationAccess = {
  canView: boolean;
  canManage: boolean;
};

/**
 * Phase 9 RBAC for administration modules:
 * - Admin: full access
 * - Manager: view only
 * - Receptionist / Housekeeping: no access
 */
export function getAdministrationAccess(
  session: AuthSession,
  module: DbPermissionModule
): AdministrationAccess {
  if (session.roleId === "receptionist" || session.roleId === "housekeeping") {
    return { canView: false, canManage: false };
  }

  const canView = sessionHasPermission(session, module, "view");

  if (session.roleId === "manager") {
    return { canView, canManage: false };
  }

  const canManage =
    sessionHasPermission(session, module, "manage") ||
    sessionHasPermission(session, module, "edit") ||
    sessionHasPermission(session, module, "create");

  return { canView, canManage };
}

export function requireAdministrationView(
  session: AuthSession,
  module: DbPermissionModule
): void {
  const access = getAdministrationAccess(session, module);
  if (!access.canView) {
    throw new Error(`Forbidden: ${module}.view required`);
  }
}
