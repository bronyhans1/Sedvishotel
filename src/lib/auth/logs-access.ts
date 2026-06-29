import {
  getAdministrationAccess,
  requireAdministrationView,
} from "@/lib/auth/administration-access";
import type { AdministrationAccess } from "@/lib/auth/administration-access";
import type { AuthSession } from "@/services/auth.service";

export type LogsAccess = AdministrationAccess;

export function getLogsAccess(session: AuthSession): LogsAccess {
  return getAdministrationAccess(session, "activity_logs");
}

export function requireLogsView(session: AuthSession): void {
  requireAdministrationView(session, "activity_logs");
}
