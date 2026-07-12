import { sessionHasPermission } from "@/lib/auth/permissions";
import type { AuthSession } from "@/services/auth.service";

export type CorporateAccountAccess = {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canManage: boolean;
};

export function getCorporateAccountAccess(session: AuthSession): CorporateAccountAccess {
  return {
    canView: sessionHasPermission(session, "corporate_accounts", "view"),
    canCreate: sessionHasPermission(session, "corporate_accounts", "create"),
    canEdit: sessionHasPermission(session, "corporate_accounts", "edit"),
    canManage: sessionHasPermission(session, "corporate_accounts", "manage"),
  };
}
