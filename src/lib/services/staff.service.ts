import { getStaffAccess } from "@/lib/auth/staff-access";
import {
  computeStaffStats,
  generateTemporaryPassword,
  mapDbStaffToStaffMember,
} from "@/lib/staff/mapper";
import type { SupabaseUserRepository } from "@/repositories/supabase/user.repository";
import type { IActivityLogRepository } from "@/repositories/activity-log.repository";
import type { IUserRepository } from "@/repositories/user.repository";
import type { AuthSession } from "@/services/auth.service";
import { ServiceError } from "@/services/types";
import type { ServiceContext } from "@/services/types";
import { ActivityActionCodes } from "@/types/database/enums";
import type {
  CreateStaffInput,
  StaffMember,
  StaffStats,
  UpdateStaffInput,
} from "@/types/staff";

export interface IStaffService {
  listStaff(
    ctx: ServiceContext,
    session: AuthSession
  ): Promise<{ staff: StaffMember[]; stats: StaffStats }>;
  getStaffById(
    ctx: ServiceContext,
    session: AuthSession,
    profileId: string
  ): Promise<StaffMember | null>;
  createStaff(
    ctx: ServiceContext,
    session: AuthSession,
    input: CreateStaffInput
  ): Promise<{ member: StaffMember; temporaryPassword: string }>;
  updateStaff(
    ctx: ServiceContext,
    session: AuthSession,
    profileId: string,
    input: UpdateStaffInput
  ): Promise<StaffMember>;
  suspendStaff(
    ctx: ServiceContext,
    session: AuthSession,
    profileId: string
  ): Promise<StaffMember>;
  activateStaff(
    ctx: ServiceContext,
    session: AuthSession,
    profileId: string
  ): Promise<StaffMember>;
  resetPassword(
    ctx: ServiceContext,
    session: AuthSession,
    profileId: string
  ): Promise<{ temporaryPassword: string }>;
  uploadAvatar(
    ctx: ServiceContext,
    session: AuthSession,
    profileId: string,
    fileName: string,
    fileBuffer: ArrayBuffer,
    contentType: string
  ): Promise<StaffMember>;
  removeAvatar(
    ctx: ServiceContext,
    session: AuthSession,
    profileId: string
  ): Promise<StaffMember>;
}

export class StaffService implements IStaffService {
  constructor(
    private readonly users: IUserRepository,
    private readonly activityLogs: IActivityLogRepository,
    private readonly userRepo?: SupabaseUserRepository
  ) {}

  private requireManage(session: AuthSession): void {
    if (!getStaffAccess(session).canManage) {
      throw new ServiceError("Forbidden: staff management required.", "FORBIDDEN", 403);
    }
  }

  private requireView(session: AuthSession): void {
    if (!getStaffAccess(session).canView) {
      throw new ServiceError("Forbidden: staff.view required.", "FORBIDDEN", 403);
    }
  }

  private async resolveStaff(profileId: string) {
    const row = await this.users.findStaffById(profileId);
    if (!row) {
      throw new ServiceError("Staff member not found.", "NOT_FOUND", 404);
    }
    return row;
  }

  private async log(
    ctx: ServiceContext,
    session: AuthSession,
    input: {
      action: string;
      actionCode: string;
      staffUserId: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<void> {
    await this.activityLogs.create({
      userId: ctx.userId,
      userName: session.fullName,
      action: input.action,
      actionCode: input.actionCode,
      module: "staff",
      entityType: "staff_profile",
      entityId: input.staffUserId,
      metadata: input.metadata,
    });
  }

  async listStaff(ctx: ServiceContext, session: AuthSession) {
    this.requireView(session);
    const rows = await this.users.findAllStaff();
    const staff = rows.map(mapDbStaffToStaffMember);
    return { staff, stats: computeStaffStats(staff) };
  }

  async getStaffById(_ctx: ServiceContext, session: AuthSession, profileId: string) {
    this.requireView(session);
    const row = await this.users.findStaffById(profileId);
    return row ? mapDbStaffToStaffMember(row) : null;
  }

  async createStaff(ctx: ServiceContext, session: AuthSession, input: CreateStaffInput) {
    this.requireManage(session);

    if (!input.temporaryPassword?.trim()) {
      throw new ServiceError(
        "Temporary password is required.",
        "VALIDATION",
        400
      );
    }
    if (input.temporaryPassword.length < 8) {
      throw new ServiceError(
        "Temporary password must be at least 8 characters.",
        "VALIDATION",
        400
      );
    }
    if (!input.employeeId?.trim()) {
      throw new ServiceError("Employee ID is required.", "VALIDATION", 400);
    }

    const row = await this.users.createStaffAccount({
      email: input.email,
      fullName: input.fullName,
      roleId: input.role,
      department: input.department,
      phone: input.phone,
      employeeId: input.employeeId.trim(),
      temporaryPassword: input.temporaryPassword,
    });

    await this.log(ctx, session, {
      action: `Created staff account for ${input.fullName}`,
      actionCode: ActivityActionCodes.STAFF_ACCOUNT_CREATED,
      staffUserId: row.user_id,
      metadata: { email: input.email, role: input.role },
    });

    return {
      member: mapDbStaffToStaffMember(row),
      temporaryPassword: input.temporaryPassword,
    };
  }

  async updateStaff(
    ctx: ServiceContext,
    session: AuthSession,
    profileId: string,
    input: UpdateStaffInput
  ) {
    this.requireManage(session);
    const existing = await this.resolveStaff(profileId);

    await this.users.updateUser(existing.user_id, {
      fullName: input.fullName,
      email: input.email,
      status: input.status === "suspended" ? "suspended" : "active",
    });

    const updated = await this.users.updateStaffProfile(profileId, {
      phone: input.phone || null,
      department: input.department || null,
      roleId: input.role,
    });

    await this.log(ctx, session, {
      action: `Updated staff profile for ${input.fullName}`,
      actionCode: ActivityActionCodes.STAFF_ACCOUNT_UPDATED,
      staffUserId: updated.user_id,
    });

    return mapDbStaffToStaffMember(updated);
  }

  async suspendStaff(ctx: ServiceContext, session: AuthSession, profileId: string) {
    this.requireManage(session);
    const existing = await this.resolveStaff(profileId);
    await this.users.updateUserStatus(existing.user_id, "suspended");

    const refreshed = await this.resolveStaff(profileId);
    await this.log(ctx, session, {
      action: `Suspended staff account ${existing.user.full_name}`,
      actionCode: ActivityActionCodes.STAFF_SUSPENDED,
      staffUserId: existing.user_id,
    });

    return mapDbStaffToStaffMember(refreshed);
  }

  async activateStaff(ctx: ServiceContext, session: AuthSession, profileId: string) {
    this.requireManage(session);
    const existing = await this.resolveStaff(profileId);
    await this.users.updateUserStatus(existing.user_id, "active");

    const refreshed = await this.resolveStaff(profileId);
    await this.log(ctx, session, {
      action: `Activated staff account ${existing.user.full_name}`,
      actionCode: ActivityActionCodes.STAFF_ACTIVATED,
      staffUserId: existing.user_id,
    });

    return mapDbStaffToStaffMember(refreshed);
  }

  async resetPassword(ctx: ServiceContext, session: AuthSession, profileId: string) {
    this.requireManage(session);
    const existing = await this.resolveStaff(profileId);
    const temporaryPassword = generateTemporaryPassword();

    if (!this.userRepo) {
      throw new ServiceError(
        "Password reset requires service role configuration.",
        "CONFIG",
        500
      );
    }

    await this.userRepo.resetAuthPassword(existing.user_id, temporaryPassword);

    await this.log(ctx, session, {
      action: `Reset password for ${existing.user.full_name}`,
      actionCode: ActivityActionCodes.STAFF_PASSWORD_RESET,
      staffUserId: existing.user_id,
      metadata: {
        staff_id: existing.user_id,
        reset_by: session.userId,
        timestamp: new Date().toISOString(),
      },
    });

    return { temporaryPassword };
  }

  async uploadAvatar(
    ctx: ServiceContext,
    session: AuthSession,
    profileId: string,
    fileName: string,
    fileBuffer: ArrayBuffer,
    contentType: string
  ) {
    this.requireManage(session);
    const existing = await this.resolveStaff(profileId);

    if (!this.userRepo) {
      throw new ServiceError(
        "Avatar upload requires service role configuration.",
        "CONFIG",
        500
      );
    }

    const avatarUrl = await this.userRepo.uploadStaffAvatar(
      existing.user_id,
      fileName,
      fileBuffer,
      contentType
    );

    const updated = await this.users.updateStaffProfile(profileId, { avatarUrl });
    return mapDbStaffToStaffMember(updated);
  }

  async removeAvatar(
    ctx: ServiceContext,
    session: AuthSession,
    profileId: string
  ) {
    this.requireManage(session);
    await this.resolveStaff(profileId);

    const updated = await this.users.updateStaffProfile(profileId, {
      avatarUrl: null,
    });

    await this.log(ctx, session, {
      action: `Removed avatar for ${updated.user.full_name}`,
      actionCode: ActivityActionCodes.STAFF_ACCOUNT_UPDATED,
      staffUserId: updated.user_id,
    });

    return mapDbStaffToStaffMember(updated);
  }
}
