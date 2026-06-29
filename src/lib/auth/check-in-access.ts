import { sessionHasPermission } from "@/lib/auth/permissions";
import type { CheckInAccess } from "@/lib/auth/check-in-access.types";
import type { AuthSession } from "@/services/auth.service";

export function getCheckInAccess(session: AuthSession): CheckInAccess {
  const canView = sessionHasPermission(session, "check_in", "view");
  const canProcess =
    sessionHasPermission(session, "check_in", "edit") ||
    sessionHasPermission(session, "check_in", "manage");

  return { canView, canProcess };
}

export function requireCheckInView(session: AuthSession): void {
  if (!sessionHasPermission(session, "check_in", "view")) {
    throw new Error("Forbidden: check_in.view required");
  }
}
