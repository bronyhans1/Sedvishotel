import type { AuthSession } from "@/services/auth.service";
import { sessionHasPermission } from "@/lib/auth/permissions";
import type { InventoryAccess } from "@/lib/auth/inventory-access.types";

export function getInventoryAccess(session: AuthSession): InventoryAccess {
  return {
    canView: sessionHasPermission(session, "inventory", "view"),
    canCreate: sessionHasPermission(session, "inventory", "create"),
    canEdit: sessionHasPermission(session, "inventory", "edit"),
    canDelete: sessionHasPermission(session, "inventory", "delete"),
    canManage: sessionHasPermission(session, "inventory", "manage"),
  };
}
