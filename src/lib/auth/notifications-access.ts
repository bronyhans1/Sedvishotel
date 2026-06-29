import { sessionHasPermission } from "@/lib/auth/permissions";
import type { AdministrationAccess } from "@/lib/auth/administration-access";
import type { AuthSession } from "@/services/auth.service";

export type NotificationsAccess = AdministrationAccess;

/** Permission-driven — notifications.view for all operational staff; manage restricted. */
export function getNotificationsAccess(session: AuthSession): NotificationsAccess {
  return {
    canView: sessionHasPermission(session, "notifications", "view"),
    canManage: sessionHasPermission(session, "notifications", "manage"),
  };
}

export function requireNotificationsView(session: AuthSession): void {
  if (!getNotificationsAccess(session).canView) {
    throw new Error("Forbidden: notifications.view required");
  }
}
