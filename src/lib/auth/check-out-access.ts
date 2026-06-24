import { sessionHasPermission } from "@/lib/auth/permissions";
import type { CheckOutAccess } from "@/lib/auth/check-out-access.types";
import type { AuthSession } from "@/services/auth.service";

export function getCheckOutAccess(session: AuthSession): CheckOutAccess {
  const canView = sessionHasPermission(session, "check_out", "view");
  const canProcess =
    sessionHasPermission(session, "check_out", "edit") ||
    sessionHasPermission(session, "check_out", "manage");

  return { canView, canProcess };
}

export function requireCheckOutView(session: AuthSession): void {
  if (!sessionHasPermission(session, "check_out", "view")) {
    throw new Error("Forbidden: check_out.view required");
  }
}
