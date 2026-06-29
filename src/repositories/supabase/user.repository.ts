import { authDebug } from "@/lib/auth/debug-log";
import type { SupabaseAdminClient } from "@/lib/supabase/admin";
import { supabaseEnv } from "@/lib/supabase/config";
import type { SupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { permissionCode } from "@/lib/database/rbac";
import type {
  CreateStaffAccountInput,
  IUserRepository,
  UpdateStaffProfileInput,
  UpdateUserInput,
} from "@/repositories/user.repository";
import type {
  DbPermission,
  DbPermissionAction,
  DbPermissionModule,
  DbRole,
  DbRoleId,
  DbStaffProfile,
  DbStaffWithUser,
  DbUser,
  DbUserStatus,
} from "@/types/database";

type StaffProfileWithRelations = DbStaffProfile & {
  user: DbUser | null;
  role: DbRole | null;
};

type RolePermissionWithPermission = {
  granted: boolean;
  permission: DbPermission | null;
};

export class SupabaseUserRepository implements IUserRepository {
  constructor(
    private readonly client: SupabaseServerClient,
    private readonly adminClient?: SupabaseAdminClient
  ) {}

  async findById(id: string): Promise<DbUser | null> {
    authDebug("UserRepository.findById", { id, filterColumn: "users.id" });

    const { data, error } = await this.client
      .from("users")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    authDebug("UserRepository.findById.result", {
      id,
      error: error?.message ?? null,
      found: Boolean(data),
      status: data?.status ?? null,
    });

    if (error) {
      throw new Error(`Failed to load user: ${error.message}`);
    }

    return data;
  }

  async findStaffById(profileId: string): Promise<DbStaffWithUser | null> {
    const { data: staffRow, error: staffError } = await this.client
      .from("staff_profiles")
      .select("*")
      .eq("id", profileId)
      .maybeSingle();

    if (staffError) {
      throw new Error(`Failed to load staff profile: ${staffError.message}`);
    }

    if (!staffRow) {
      return null;
    }

    return this.hydrateStaffRow(staffRow);
  }

  async findStaffByUserId(userId: string): Promise<DbStaffWithUser | null> {
    authDebug("UserRepository.findStaffByUserId", {
      userId,
      filterColumn: "staff_profiles.user_id",
    });

    const { data: staffRow, error: staffError } = await this.client
      .from("staff_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (staffError) {
      throw new Error(`Failed to load staff profile: ${staffError.message}`);
    }

    if (!staffRow) {
      return null;
    }

    return this.hydrateStaffRow(staffRow);
  }

  private async hydrateStaffRow(staffRow: DbStaffProfile): Promise<DbStaffWithUser | null> {
    const userId = staffRow.user_id;
    const [{ data: user, error: userError }, { data: role, error: roleError }] =
      await Promise.all([
        this.client.from("users").select("*").eq("id", userId).maybeSingle(),
        this.client
          .from("roles")
          .select("*")
          .eq("id", staffRow.role_id)
          .maybeSingle(),
      ]);

    if (userError) {
      throw new Error(`Failed to load user for staff profile: ${userError.message}`);
    }
    if (roleError) {
      throw new Error(`Failed to load role for staff profile: ${roleError.message}`);
    }
    if (!user || !role) {
      return null;
    }

    return { ...staffRow, user, role };
  }

  async findAllStaff(roleId?: DbRoleId): Promise<DbStaffWithUser[]> {
    let query = this.client.from("staff_profiles").select(
      `
        *,
        user:users!staff_profiles_user_id_fkey (*),
        role:roles!staff_profiles_role_id_fkey (*)
      `
    );

    if (roleId) {
      query = query.eq("role_id", roleId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to list staff: ${error.message}`);
    }

    return ((data ?? []) as unknown as StaffProfileWithRelations[])
      .filter((row): row is StaffProfileWithRelations & { user: DbUser; role: DbRole } =>
        Boolean(row.user && row.role)
      )
      .map((row) => ({ ...row, user: row.user, role: row.role }));
  }

  async createStaffAccount(input: CreateStaffAccountInput): Promise<DbStaffWithUser> {
    const admin = this.requireAdminClient();
    const email = input.email.trim().toLowerCase();

    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password: input.temporaryPassword,
      email_confirm: true,
      user_metadata: { full_name: input.fullName.trim() },
    });

    if (authError || !authData.user) {
      throw new Error(
        `Failed to create auth user: ${authError?.message ?? "unknown error"}`
      );
    }

    const userId = authData.user.id;

    const { error: userError } = await admin.from("users").insert({
      id: userId,
      email,
      full_name: input.fullName.trim(),
      status: "active",
      must_change_password: true,
    });

    if (userError) {
      await admin.auth.admin.deleteUser(userId);
      throw new Error(`Failed to create user row: ${userError.message}`);
    }

    const employeeId =
      input.employeeId?.trim() ||
      `EMP-${new Date().getFullYear()}-${Date.now().toString(36).slice(-5).toUpperCase()}`;

    const { data: profileRow, error: profileError } = await admin
      .from("staff_profiles")
      .insert({
        user_id: userId,
        role_id: input.roleId,
        department: input.department?.trim() || null,
        phone: input.phone?.trim() || null,
        employee_id: employeeId,
        hire_date: new Date().toISOString().slice(0, 10),
        notes: null,
        avatar_url: null,
      })
      .select("*")
      .single();

    if (profileError || !profileRow) {
      await admin.from("users").delete().eq("id", userId);
      await admin.auth.admin.deleteUser(userId);
      throw new Error(`Failed to create staff profile: ${profileError?.message}`);
    }

    const staff = await this.findStaffById(profileRow.id);
    if (!staff) {
      throw new Error("Staff profile created but could not be loaded.");
    }

    return staff;
  }

  async updateUser(userId: string, data: UpdateUserInput): Promise<DbUser> {
    const payload: Record<string, unknown> = {};
    if (data.email !== undefined) payload.email = data.email.trim().toLowerCase();
    if (data.fullName !== undefined) payload.full_name = data.fullName.trim();
    if (data.status !== undefined) payload.status = data.status;
    if (data.mustChangePassword !== undefined) {
      payload.must_change_password = data.mustChangePassword;
    }

    const { data: row, error } = await this.client
      .from("users")
      .update(payload)
      .eq("id", userId)
      .select("*")
      .single();

    if (error || !row) {
      throw new Error(`Failed to update user: ${error?.message}`);
    }

    return row;
  }

  async updateStaffProfile(
    profileId: string,
    data: UpdateStaffProfileInput
  ): Promise<DbStaffWithUser> {
    const payload: Record<string, unknown> = {};
    if (data.department !== undefined) payload.department = data.department;
    if (data.phone !== undefined) payload.phone = data.phone;
    if (data.roleId !== undefined) payload.role_id = data.roleId;
    if (data.employeeId !== undefined) payload.employee_id = data.employeeId;
    if (data.avatarUrl !== undefined) payload.avatar_url = data.avatarUrl;
    if (data.notes !== undefined) payload.notes = data.notes;
    if (data.address !== undefined) payload.address = data.address;
    if (data.emergencyContact !== undefined) payload.emergency_contact = data.emergencyContact;
    if (data.nextOfKin !== undefined) payload.next_of_kin = data.nextOfKin;
    if (data.nationality !== undefined) payload.nationality = data.nationality;
    if (data.idNumber !== undefined) payload.id_number = data.idNumber;

    const { error } = await this.client
      .from("staff_profiles")
      .update(payload)
      .eq("id", profileId);

    if (error) {
      throw new Error(`Failed to update staff profile: ${error.message}`);
    }

    const staff = await this.findStaffById(profileId);
    if (!staff) {
      throw new Error("Staff profile not found after update.");
    }

    return staff;
  }

  async updateUserStatus(userId: string, status: DbUserStatus): Promise<DbUser> {
    return this.updateUser(userId, { status });
  }

  async setMustChangePassword(userId: string, value: boolean): Promise<DbUser> {
    return this.updateUser(userId, { mustChangePassword: value });
  }

  async recordLastLogin(userId: string): Promise<void> {
    const lastLoginAt = new Date().toISOString();

    const { data, error } = await this.client
      .from("users")
      .update({ last_login_at: lastLoginAt })
      .eq("id", userId)
      .select("id, last_login_at")
      .single();

    if (error) {
      authDebug("UserRepository.recordLastLogin.failed", {
        userId,
        error: error.message,
        hint: "Ensure SUPABASE_SERVICE_ROLE_KEY is set or users UPDATE RLS policy exists",
      });
      return;
    }

    authDebug("UserRepository.recordLastLogin.ok", {
      userId,
      last_login_at: data?.last_login_at ?? lastLoginAt,
    });
  }

  async countStaff(): Promise<number> {
    const { count, error } = await this.client
      .from("staff_profiles")
      .select("*", { count: "exact", head: true });

    if (error) {
      throw new Error(`Failed to count staff: ${error.message}`);
    }

    return count ?? 0;
  }

  async getPermissionsForUser(userId: string): Promise<string[]> {
    const staff = await this.findStaffByUserId(userId);
    if (!staff) {
      return [];
    }

    const { data, error } = await this.client
      .from("role_permissions")
      .select(
        `
        granted,
        permission:permissions!role_permissions_permission_id_fkey (*)
      `
      )
      .eq("role_id", staff.role_id)
      .eq("granted", true);

    if (error) {
      throw new Error(`Failed to resolve permissions: ${error.message}`);
    }

    return ((data ?? []) as unknown as RolePermissionWithPermission[])
      .map((row) => {
        if (!row.permission) {
          return null;
        }
        return permissionCode(row.permission.module, row.permission.action);
      })
      .filter((code): code is string => Boolean(code));
  }

  async hasPermissionRpc(
    module: DbPermissionModule,
    action: DbPermissionAction
  ): Promise<boolean> {
    const { data, error } = await this.client.rpc("has_permission", {
      p_module: module,
      p_action: action,
    });

    if (error) {
      throw new Error(`Permission check failed: ${error.message}`);
    }

    return Boolean(data);
  }

  async getCurrentStaffRoleRpc(): Promise<DbRoleId | null> {
    const { data, error } = await this.client.rpc("current_staff_role");

    if (error) {
      throw new Error(`Failed to resolve staff role: ${error.message}`);
    }

    return (data as DbRoleId | null) ?? null;
  }

  async resetAuthPassword(userId: string, temporaryPassword: string): Promise<void> {
    const admin = this.requireAdminClient();
    const { error } = await admin.auth.admin.updateUserById(userId, {
      password: temporaryPassword,
    });

    if (error) {
      throw new Error(`Failed to reset password: ${error.message}`);
    }

    await this.setMustChangePassword(userId, true);
  }

  async verifyCurrentPassword(email: string, password: string): Promise<void> {
    const url = supabaseEnv.url;
    const anonKey = supabaseEnv.anonKey;
    if (!url || !anonKey) {
      throw new Error("Supabase is not configured.");
    }

    const verifier = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error } = await verifier.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      throw new Error("Current password is incorrect.");
    }
  }

  async updateAuthPassword(userId: string, newPassword: string): Promise<void> {
    const admin = this.requireAdminClient();
    const { error } = await admin.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (error) {
      throw new Error(`Failed to update password: ${error.message}`);
    }
  }

  async uploadStaffAvatar(
    userId: string,
    filePath: string,
    fileBuffer: ArrayBuffer,
    contentType: string
  ): Promise<string> {
    const admin = this.requireAdminClient();
    const path = `${userId}/${filePath}`;

    const { error: uploadError } = await admin.storage
      .from("staff-avatars")
      .upload(path, fileBuffer, { upsert: true, contentType });

    if (uploadError) {
      throw new Error(`Failed to upload avatar: ${uploadError.message}`);
    }

    const { data } = admin.storage.from("staff-avatars").getPublicUrl(path);
    return data.publicUrl;
  }

  private requireAdminClient(): SupabaseAdminClient {
    if (!this.adminClient) {
      throw new Error(
        "Admin client required for staff account operations. Set SUPABASE_SERVICE_ROLE_KEY."
      );
    }
    return this.adminClient;
  }
}
