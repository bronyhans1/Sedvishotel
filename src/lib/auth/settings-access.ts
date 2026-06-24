import {
  getAdministrationAccess,
  requireAdministrationView,
} from "@/lib/auth/administration-access";
import type { AdministrationAccess } from "@/lib/auth/administration-access";
import type { AuthSession } from "@/services/auth.service";

export type SettingsAccess = AdministrationAccess;

export function getSettingsAccess(session: AuthSession): SettingsAccess {
  return getAdministrationAccess(session, "settings");
}

export function requireSettingsView(session: AuthSession): void {
  requireAdministrationView(session, "settings");
}
