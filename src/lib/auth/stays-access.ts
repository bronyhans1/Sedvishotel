import { sessionHasPermission } from "@/lib/auth/permissions";
import type { StaysAccess } from "@/lib/auth/stays-access.types";
import type { AuthSession } from "@/services/auth.service";

export function getStaysAccess(session: AuthSession): StaysAccess {
  const canView = sessionHasPermission(session, "active_stays", "view");
  return { canView };
}

export function requireStaysView(session: AuthSession): void {
  if (!sessionHasPermission(session, "active_stays", "view")) {
    throw new Error("Forbidden: active_stays.view required");
  }
}
