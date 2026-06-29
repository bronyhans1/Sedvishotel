import type { BaseRepository } from "@/repositories/base.repository";
import type { DbRoleId, DbStaffWithUser, DbUser, DbUserStatus } from "@/types/database";

export interface CreateStaffAccountInput {
  email: string;
  fullName: string;
  roleId: DbRoleId;
  department?: string;
  phone?: string;
  employeeId?: string;
  temporaryPassword: string;
}

export interface UpdateStaffProfileInput {
  department?: string | null;
  phone?: string | null;
  roleId?: DbRoleId;
  employeeId?: string | null;
  avatarUrl?: string | null;
  notes?: string | null;
  address?: string | null;
  emergencyContact?: string | null;
  nextOfKin?: string | null;
  nationality?: string | null;
  idNumber?: string | null;
}

export interface UpdateUserInput {
  email?: string;
  fullName?: string;
  status?: DbUserStatus;
  mustChangePassword?: boolean;
}

export interface IUserRepository {
  findById(id: string): Promise<DbUser | null>;
  findStaffById(profileId: string): Promise<DbStaffWithUser | null>;
  findStaffByUserId(userId: string): Promise<DbStaffWithUser | null>;
  findAllStaff(roleId?: DbRoleId): Promise<DbStaffWithUser[]>;
  createStaffAccount(input: CreateStaffAccountInput): Promise<DbStaffWithUser>;
  updateUser(userId: string, data: UpdateUserInput): Promise<DbUser>;
  updateStaffProfile(
    profileId: string,
    data: UpdateStaffProfileInput
  ): Promise<DbStaffWithUser>;
  updateUserStatus(userId: string, status: DbUserStatus): Promise<DbUser>;
  setMustChangePassword(userId: string, value: boolean): Promise<DbUser>;
  /** Sets last_login_at after a successful sign-in (non-blocking on failure). */
  recordLastLogin(userId: string): Promise<void>;
  getPermissionsForUser(userId: string): Promise<string[]>;
  countStaff(): Promise<number>;
}

export type UserRepository = IUserRepository & BaseRepository;
