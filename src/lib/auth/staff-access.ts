import {
  getAdministrationAccess,
  requireAdministrationView,
} from "@/lib/auth/administration-access";
import type { AdministrationAccess } from "@/lib/auth/administration-access";
import type { AuthSession } from "@/services/auth.service";

export type StaffAccess = AdministrationAccess;

export function getStaffAccess(session: AuthSession): StaffAccess {
  return getAdministrationAccess(session, "staff");
}

export function requireStaffView(session: AuthSession): void {
  requireAdministrationView(session, "staff");
}
