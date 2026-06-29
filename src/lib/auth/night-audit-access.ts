import { sessionHasPermission } from "@/lib/auth/permissions";
import type { NightAuditAccess } from "@/lib/auth/night-audit-access.types";
import type { AuthSession } from "@/services/auth.service";

export function getNightAuditAccess(session: AuthSession): NightAuditAccess {
  const canView = sessionHasPermission(session, "night_audit", "view");
  const canRunAudit = sessionHasPermission(session, "night_audit", "create");
  const canReopen = session.roleId === "admin";
  return { canView, canRunAudit, canReopen };
}
