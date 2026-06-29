import type { BaseRepository } from "@/repositories/base.repository";
import type { DbPermission, DbRole, DbRoleId } from "@/types/database";

export type RolePermissionGrant = {
  roleId: DbRoleId;
  permissionId: string;
  module: DbPermission["module"];
  action: DbPermission["action"];
  granted: boolean;
};

export type RolePermissionUpsert = {
  roleId: DbRoleId;
  permissionId: string;
  granted: boolean;
};

export interface IRoleRepository {
  getAllRoles(): Promise<DbRole[]>;
  getAllPermissions(): Promise<DbPermission[]>;
  getRolePermissionGrants(): Promise<RolePermissionGrant[]>;
  countStaffByRole(): Promise<Record<DbRoleId, number>>;
  upsertRolePermissions(updates: RolePermissionUpsert[]): Promise<void>;
}

export type RoleRepository = IRoleRepository & BaseRepository;
