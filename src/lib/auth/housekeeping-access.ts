import { sessionHasPermission } from "@/lib/auth/permissions";
import type { HousekeepingAccess } from "@/lib/auth/housekeeping-access.types";
import type { AuthSession } from "@/services/auth.service";

export function getHousekeepingAccess(session: AuthSession): HousekeepingAccess {
  const canView =
    sessionHasPermission(session, "housekeeping", "view") ||
    sessionHasPermission(session, "rooms", "view");
  const canManage =
    sessionHasPermission(session, "housekeeping", "edit") ||
    sessionHasPermission(session, "housekeeping", "manage");

  return { canView, canManage };
}

export function requireHousekeepingView(session: AuthSession): void {
  const access = getHousekeepingAccess(session);
  if (!access.canView) {
    throw new Error("Forbidden: housekeeping.view required");
  }
}
