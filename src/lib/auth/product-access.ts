import type { AuthSession } from "@/services/auth.service";
import { sessionHasPermission } from "@/lib/auth/permissions";
import type { ProductAccess } from "@/lib/auth/product-access.types";

export function getProductAccess(session: AuthSession): ProductAccess {
  const canView = sessionHasPermission(session, "products", "view");
  const canCreate = sessionHasPermission(session, "products", "create");
  const canEdit = sessionHasPermission(session, "products", "edit");
  const canArchive = sessionHasPermission(session, "products", "edit");
  const canRestore = sessionHasPermission(session, "products", "edit");
  const canManage = sessionHasPermission(session, "products", "manage");
  const canDelete = sessionHasPermission(session, "products", "delete");
  return {
    canView,
    canCreate,
    canEdit,
    canArchive,
    canRestore,
    canDelete,
    canManage,
  };
}
