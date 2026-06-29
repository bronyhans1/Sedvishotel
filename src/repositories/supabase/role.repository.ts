import type {
  IRoleRepository,
  RolePermissionGrant,
  RolePermissionUpsert,
} from "@/repositories/role.repository";
import type { SupabaseServerClient } from "@/lib/supabase/server";
import type { DbPermission, DbRole, DbRoleId } from "@/types/database";

type RolePermissionRow = {
  role_id: DbRoleId;
  permission_id: string;
  granted: boolean;
  permission: DbPermission | null;
};

export class SupabaseRoleRepository implements IRoleRepository {
  constructor(private readonly client: SupabaseServerClient) {}

  async getAllRoles(): Promise<DbRole[]> {
    const { data, error } = await this.client
      .from("roles")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      throw new Error(`Failed to list roles: ${error.message}`);
    }

    return data ?? [];
  }

  async getAllPermissions(): Promise<DbPermission[]> {
    const { data, error } = await this.client
      .from("permissions")
      .select("*")
      .order("module", { ascending: true })
      .order("action", { ascending: true });

    if (error) {
      throw new Error(`Failed to list permissions: ${error.message}`);
    }

    return data ?? [];
  }

  async getRolePermissionGrants(): Promise<RolePermissionGrant[]> {
    const { data, error } = await this.client
      .from("role_permissions")
      .select(
        `
        role_id,
        permission_id,
        granted,
        permission:permissions!role_permissions_permission_id_fkey (*)
      `
      );

    if (error) {
      throw new Error(`Failed to load role permissions: ${error.message}`);
    }

    return ((data ?? []) as unknown as RolePermissionRow[])
      .filter((row): row is RolePermissionRow & { permission: DbPermission } =>
        Boolean(row.permission)
      )
      .map((row) => ({
        roleId: row.role_id,
        permissionId: row.permission_id,
        module: row.permission.module,
        action: row.permission.action,
        granted: row.granted,
      }));
  }

  async countStaffByRole(): Promise<Record<DbRoleId, number>> {
    const { data, error } = await this.client
      .from("staff_profiles")
      .select("role_id");

    if (error) {
      throw new Error(`Failed to count staff by role: ${error.message}`);
    }

    const counts: Record<DbRoleId, number> = {
      admin: 0,
      manager: 0,
      receptionist: 0,
      housekeeping: 0,
    };

    for (const row of data ?? []) {
      const roleId = row.role_id as DbRoleId;
      if (roleId in counts) {
        counts[roleId] += 1;
      }
    }

    return counts;
  }

  async upsertRolePermissions(updates: RolePermissionUpsert[]): Promise<void> {
    if (updates.length === 0) {
      return;
    }

    const { error } = await this.client.from("role_permissions").upsert(
      updates.map((row) => ({
        role_id: row.roleId,
        permission_id: row.permissionId,
        granted: row.granted,
      })),
      { onConflict: "role_id,permission_id" }
    );

    if (error) {
      throw new Error(`Failed to update role permissions: ${error.message}`);
    }
  }
}
