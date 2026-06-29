import { getRolesAccess } from "@/lib/auth/roles-access";
import {
  buildPermissionMatrix,
  countPermissionsForRole,
  mapDbRolesToDefinitions,
  matrixToPermissionUpserts,
  permissionCodesForRole,
} from "@/lib/roles/matrix";
import type { IActivityLogRepository } from "@/repositories/activity-log.repository";
import type { IRoleRepository } from "@/repositories/role.repository";
import type { AuthSession } from "@/services/auth.service";
import { ServiceError } from "@/services/types";
import type { ServiceContext } from "@/services/types";
import { ActivityActionCodes } from "@/types/database/enums";
import type { PermissionMatrix, RoleDefinition, StaffRoleId } from "@/types/role";

export interface RolesPageData {
  roles: RoleDefinition[];
  matrix: PermissionMatrix;
  readOnly: boolean;
}

export interface IRoleService {
  getRolesPageData(ctx: ServiceContext, session: AuthSession): Promise<RolesPageData>;
  savePermissionMatrix(
    ctx: ServiceContext,
    session: AuthSession,
    matrix: PermissionMatrix
  ): Promise<PermissionMatrix>;
  getPermissionCountForRole(
    ctx: ServiceContext,
    session: AuthSession,
    roleId: StaffRoleId
  ): Promise<number>;
  getPermissionSummaryForRole(
    ctx: ServiceContext,
    session: AuthSession,
    roleId: StaffRoleId
  ): Promise<string[]>;
  getPermissionsForRole(
    ctx: ServiceContext,
    session: AuthSession,
    roleId: StaffRoleId
  ): Promise<string[]>;
}

export class RoleService implements IRoleService {
  constructor(
    private readonly roles: IRoleRepository,
    private readonly activityLogs: IActivityLogRepository
  ) {}

  private requireView(session: AuthSession): void {
    if (!getRolesAccess(session).canView) {
      throw new ServiceError(
        "You do not have permission to view roles.",
        "FORBIDDEN",
        403
      );
    }
  }

  private requireManage(session: AuthSession): void {
    if (!getRolesAccess(session).canManage) {
      throw new ServiceError(
        "You do not have permission to manage roles.",
        "FORBIDDEN",
        403
      );
    }
  }

  async getRolesPageData(
    _ctx: ServiceContext,
    session: AuthSession
  ): Promise<RolesPageData> {
    this.requireView(session);
    const access = getRolesAccess(session);

    const [roleRows, grants, staffCounts] = await Promise.all([
      this.roles.getAllRoles(),
      this.roles.getRolePermissionGrants(),
      this.roles.countStaffByRole(),
    ]);

    return {
      roles: mapDbRolesToDefinitions(roleRows, staffCounts),
      matrix: buildPermissionMatrix(grants),
      readOnly: !access.canManage,
    };
  }

  async savePermissionMatrix(
    ctx: ServiceContext,
    session: AuthSession,
    matrix: PermissionMatrix
  ): Promise<PermissionMatrix> {
    this.requireManage(session);

    const permissions = await this.roles.getAllPermissions();
    const updates = matrixToPermissionUpserts(matrix, permissions);
    await this.roles.upsertRolePermissions(updates);

    await this.activityLogs.create({
      userId: ctx.userId,
      userName: session.fullName,
      action: "Updated role permissions matrix",
      actionCode: ActivityActionCodes.SETTINGS_UPDATED,
      module: "staff",
      entityType: "role_permissions",
      metadata: { updatedGrants: updates.filter((u) => u.granted).length },
    });

    const grants = await this.roles.getRolePermissionGrants();
    return buildPermissionMatrix(grants);
  }

  async getPermissionCountForRole(
    _ctx: ServiceContext,
    session: AuthSession,
    roleId: StaffRoleId
  ): Promise<number> {
    this.requireView(session);
    const grants = await this.roles.getRolePermissionGrants();
    const matrix = buildPermissionMatrix(grants);
    return countPermissionsForRole(matrix, roleId);
  }

  async getPermissionSummaryForRole(
    _ctx: ServiceContext,
    session: AuthSession,
    roleId: StaffRoleId
  ): Promise<string[]> {
    const codes = await this.getPermissionsForRole(_ctx, session, roleId);
    return codes.slice(0, 12);
  }

  async getPermissionsForRole(
    _ctx: ServiceContext,
    session: AuthSession,
    roleId: StaffRoleId
  ): Promise<string[]> {
    this.requireView(session);
    const grants = await this.roles.getRolePermissionGrants();
    return permissionCodesForRole(grants, roleId);
  }
}
