import type { AuthSession } from "@/services/auth.service";
import { sessionHasPermission } from "@/lib/auth/permissions";
import type { ProductCategoryAccess } from "@/lib/auth/product-category-access.types";

export function getProductCategoryAccess(
  session: AuthSession
): ProductCategoryAccess {
  const canView = sessionHasPermission(session, "product_categories", "view");
  const canCreate = sessionHasPermission(session, "product_categories", "create");
  const canEdit = sessionHasPermission(session, "product_categories", "edit");
  const canArchive = sessionHasPermission(session, "product_categories", "edit");
  const canRestore = sessionHasPermission(session, "product_categories", "edit");
  const canManage = sessionHasPermission(session, "product_categories", "manage");
  const canDelete = sessionHasPermission(session, "product_categories", "delete");
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
