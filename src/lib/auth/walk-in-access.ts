import { sessionHasPermission } from "@/lib/auth/permissions";
import type { WalkInAccess } from "@/lib/auth/walk-in-access.types";
import type { AuthSession } from "@/services/auth.service";

export function getWalkInAccess(session: AuthSession): WalkInAccess {
  const canView = sessionHasPermission(session, "walk_in", "view");
  const canComplete =
    sessionHasPermission(session, "walk_in", "create") ||
    sessionHasPermission(session, "walk_in", "manage");

  return { canView, canComplete };
}

export function requireWalkInView(session: AuthSession): void {
  if (!sessionHasPermission(session, "walk_in", "view")) {
    throw new Error("Forbidden: walk_in.view required");
  }
}
