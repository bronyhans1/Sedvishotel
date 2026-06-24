import {
  getAdministrationAccess,
  requireAdministrationView,
} from "@/lib/auth/administration-access";
import type { AdministrationAccess } from "@/lib/auth/administration-access";
import type { AuthSession } from "@/services/auth.service";

export type AuditAccess = AdministrationAccess;

export function getAuditAccess(session: AuthSession): AuditAccess {
  return getAdministrationAccess(session, "audit");
}

export function requireAuditView(session: AuthSession): void {
  requireAdministrationView(session, "audit");
}
