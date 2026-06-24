import { mainNavigation, type NavItem } from "@/config/navigation";
import type { NavPermission } from "@/config/navigation.types";
import { permissionCode } from "@/lib/database/rbac";
import type { DbPermissionModule } from "@/types/database/enums";

function hasViewPermission(
  permissions: string[],
  module: DbPermissionModule
): boolean {
  return permissions.includes(permissionCode(module, "view"));
}

export function canViewNavPermission(
  permissions: string[],
  permission: NavPermission
): boolean {
  return hasViewPermission(permissions, permission);
}

/**
 * Returns navigation items the user may see based on live session permissions.
 * Parent groups (Rooms, Administration) are omitted when no child/link is visible.
 */
export function filterNavigation(permissions: string[]): NavItem[] {
  const filtered: NavItem[] = [];

  for (const item of mainNavigation) {
    if (item.children?.length) {
      const visibleChildren = item.children.filter((child) =>
        canViewNavPermission(permissions, child.permission)
      );
      if (visibleChildren.length === 0) continue;
      filtered.push({ ...item, children: visibleChildren });
      continue;
    }

    if (item.permission && canViewNavPermission(permissions, item.permission)) {
      filtered.push(item);
    }
  }

  return filtered;
}
