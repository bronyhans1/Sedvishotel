import { mapDbStaffToUserProfile } from "@/lib/profile/mapper";
import { mapDbActivityLogToActivityLog } from "@/lib/logs/mapper";
import type { SupabaseUserRepository } from "@/repositories/supabase/user.repository";
import type { IActivityLogRepository } from "@/repositories/activity-log.repository";
import type { IUserRepository } from "@/repositories/user.repository";
import type { AuthSession } from "@/services/auth.service";
import { ServiceError } from "@/services/types";
import type { ServiceContext } from "@/services/types";
import { ActivityActionCodes } from "@/types/database/enums";
import type { ActivityLog } from "@/types/log";
import type {
  ChangeOwnPasswordInput,
  UpdateOwnProfileInput,
  UserProfile,
} from "@/types/profile";

export interface IProfileService {
  getOwnProfile(session: AuthSession): Promise<UserProfile>;
  updateOwnProfile(
    ctx: ServiceContext,
    session: AuthSession,
    input: UpdateOwnProfileInput
  ): Promise<UserProfile>;
  changeOwnPassword(
    ctx: ServiceContext,
    session: AuthSession,
    input: ChangeOwnPasswordInput
  ): Promise<void>;
  uploadOwnAvatar(
    ctx: ServiceContext,
    session: AuthSession,
    fileName: string,
    fileBuffer: ArrayBuffer,
    contentType: string
  ): Promise<UserProfile>;
  removeOwnAvatar(ctx: ServiceContext, session: AuthSession): Promise<UserProfile>;
  getOwnActivity(session: AuthSession): Promise<ActivityLog[]>;
}

export class ProfileService implements IProfileService {
  constructor(
    private readonly users: IUserRepository,
    private readonly activityLogs: IActivityLogRepository,
    private readonly userRepo?: SupabaseUserRepository
  ) {}

  private async resolveOwnProfile(session: AuthSession) {
    const row = await this.users.findStaffByUserId(session.userId);
    if (!row) {
      throw new ServiceError("Staff profile not found.", "NOT_FOUND", 404);
    }
    return row;
  }

  private async log(
    ctx: ServiceContext,
    session: AuthSession,
    input: { action: string; actionCode: string }
  ): Promise<void> {
    await this.activityLogs.create({
      userId: ctx.userId,
      userName: session.fullName,
      action: input.action,
      actionCode: input.actionCode,
      module: "profile",
      entityType: "user",
      entityId: session.userId,
    });
  }

  async getOwnProfile(session: AuthSession): Promise<UserProfile> {
    const row = await this.resolveOwnProfile(session);
    return mapDbStaffToUserProfile(row);
  }

  async updateOwnProfile(
    ctx: ServiceContext,
    session: AuthSession,
    input: UpdateOwnProfileInput
  ): Promise<UserProfile> {
    const existing = await this.resolveOwnProfile(session);

    if (!input.fullName.trim()) {
      throw new ServiceError("Full name is required.", "VALIDATION", 400);
    }
    if (!input.email.trim()) {
      throw new ServiceError("Email is required.", "VALIDATION", 400);
    }

    await this.users.updateUser(existing.user_id, {
      fullName: input.fullName.trim(),
      email: input.email.trim().toLowerCase(),
    });

    const updated = await this.users.updateStaffProfile(existing.id, {
      phone: input.phone.trim() || null,
      address: input.address?.trim() || null,
      emergencyContact: input.emergencyContact?.trim() || null,
      nextOfKin: input.nextOfKin?.trim() || null,
      nationality: input.nationality?.trim() || null,
      idNumber: input.idNumber?.trim() || null,
    });

    await this.log(ctx, session, {
      action: "Updated profile",
      actionCode: ActivityActionCodes.PROFILE_UPDATED,
    });

    return mapDbStaffToUserProfile(updated);
  }

  async changeOwnPassword(
    ctx: ServiceContext,
    session: AuthSession,
    input: ChangeOwnPasswordInput
  ): Promise<void> {
    if (input.newPassword.length < 8) {
      throw new ServiceError("Password must be at least 8 characters.", "VALIDATION", 400);
    }
    if (input.newPassword !== input.confirmPassword) {
      throw new ServiceError("Passwords do not match.", "VALIDATION", 400);
    }
    if (!this.userRepo) {
      throw new ServiceError(
        "Password change requires service configuration.",
        "CONFIG",
        500
      );
    }

    await this.userRepo.verifyCurrentPassword(session.email, input.currentPassword);
    await this.userRepo.updateAuthPassword(session.userId, input.newPassword);
    await this.users.setMustChangePassword(session.userId, false);

    await this.log(ctx, session, {
      action: "Changed password",
      actionCode: ActivityActionCodes.PROFILE_PASSWORD_CHANGED,
    });
  }

  async uploadOwnAvatar(
    ctx: ServiceContext,
    session: AuthSession,
    fileName: string,
    fileBuffer: ArrayBuffer,
    contentType: string
  ): Promise<UserProfile> {
    const existing = await this.resolveOwnProfile(session);

    if (!this.userRepo) {
      throw new ServiceError(
        "Avatar upload requires service configuration.",
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

    const updated = await this.users.updateStaffProfile(existing.id, { avatarUrl });

    await this.log(ctx, session, {
      action: "Updated profile photo",
      actionCode: ActivityActionCodes.PROFILE_PHOTO_UPDATED,
    });

    return mapDbStaffToUserProfile(updated);
  }

  async removeOwnAvatar(ctx: ServiceContext, session: AuthSession): Promise<UserProfile> {
    const existing = await this.resolveOwnProfile(session);
    const updated = await this.users.updateStaffProfile(existing.id, {
      avatarUrl: null,
    });

    await this.log(ctx, session, {
      action: "Removed profile photo",
      actionCode: ActivityActionCodes.PROFILE_PHOTO_UPDATED,
    });

    return mapDbStaffToUserProfile(updated);
  }

  async getOwnActivity(session: AuthSession): Promise<ActivityLog[]> {
    const result = await this.activityLogs.findAll(
      { userId: session.userId },
      { page: 1, pageSize: 30 }
    );
    return result.data.map(mapDbActivityLogToActivityLog);
  }
}
