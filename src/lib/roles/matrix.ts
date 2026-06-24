import {
  PERMISSION_ACTIONS,
  PERMISSION_MODULES,
  permissionCode,
} from "@/lib/database/rbac";
import type { RolePermissionGrant } from "@/repositories/role.repository";
import type {
  PermissionAction,
  PermissionMatrix,
  PermissionModule,
  RoleDefinition,
  StaffRoleId,
} from "@/types/role";
import type {
  DbPermissionAction,
  DbPermissionModule,
  DbRole,
  DbRoleId,
} from "@/types/database";

export function buildPermissionMatrix(
  grants: RolePermissionGrant[]
): PermissionMatrix {
  const roles: StaffRoleId[] = [
    "admin",
    "manager",
    "receptionist",
    "housekeeping",
  ];

  const matrix = {} as PermissionMatrix;

  for (const mod of PERMISSION_MODULES) {
    matrix[mod.id as PermissionModule] = {} as PermissionMatrix[PermissionModule];
    for (const role of roles) {
      const actions = {} as Record<PermissionAction, boolean>;
      for (const action of PERMISSION_ACTIONS) {
        actions[action] = grants.some(
          (g) =>
            g.roleId === role &&
            g.module === mod.id &&
            g.action === action &&
            g.granted
        );
      }
      matrix[mod.id as PermissionModule][role] = actions;
    }
  }

  return matrix;
}

export function countPermissionsForRole(
  matrix: PermissionMatrix,
  roleId: StaffRoleId
): number {
  let count = 0;
  for (const mod of PERMISSION_MODULES) {
    for (const action of PERMISSION_ACTIONS) {
      if (matrix[mod.id as PermissionModule][roleId][action]) {
        count += 1;
      }
    }
  }
  return count;
}

export function mapDbRolesToDefinitions(
  roles: DbRole[],
  staffCounts: Record<DbRoleId, number>
): RoleDefinition[] {
  return roles.map((role) => ({
    id: role.id as StaffRoleId,
    name: role.name,
    description: role.description ?? "",
    usersAssigned: staffCounts[role.id as DbRoleId] ?? 0,
  }));
}

export { PERMISSION_ACTIONS, PERMISSION_MODULES };

export const ROLE_COLUMNS: StaffRoleId[] = [
  "admin",
  "manager",
  "receptionist",
  "housekeeping",
];

export function permissionCodesForRole(
  grants: RolePermissionGrant[],
  roleId: StaffRoleId
): string[] {
  return grants
    .filter((g) => g.roleId === roleId && g.granted)
    .map((g) => permissionCode(g.module, g.action));
}

export function matrixToPermissionUpserts(
  matrix: PermissionMatrix,
  permissions: Array<{ id: string; module: DbPermissionModule; action: DbPermissionAction }>
): Array<{ roleId: DbRoleId; permissionId: string; granted: boolean }> {
  const permissionIdByCode = new Map(
    permissions.map((p) => [permissionCode(p.module, p.action), p.id])
  );

  const updates: Array<{ roleId: DbRoleId; permissionId: string; granted: boolean }> =
    [];

  for (const mod of PERMISSION_MODULES) {
    for (const role of ROLE_COLUMNS) {
      for (const action of PERMISSION_ACTIONS) {
        const id = permissionIdByCode.get(permissionCode(mod.id, action));
        if (!id) continue;
        updates.push({
          roleId: role,
          permissionId: id,
          granted: matrix[mod.id as PermissionModule][role][action],
        });
      }
    }
  }

  return updates;
}
