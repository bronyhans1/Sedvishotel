import { authDebug } from "@/lib/auth/debug-log";
import type { SupabaseServerClient } from "@/lib/supabase/server";
import type { IActivityLogRepository } from "@/repositories/activity-log.repository";
import type { IUserRepository } from "@/repositories/user.repository";
import { ServiceError } from "@/services/types";
import type { DbPermissionAction, DbPermissionModule, DbRoleId, DbStaffWithUser } from "@/types/database";
import { ActivityActionCodes } from "@/types/database/enums";

export interface AuthSession {
  userId: string;
  email: string;
  fullName: string;
  roleId: DbRoleId;
  permissions: string[];
  mustChangePassword: boolean;
  avatarUrl?: string | null;
}

export interface IAuthService {
  signIn(email: string, password: string): Promise<AuthSession>;
  signOut(): Promise<void>;
  getSession(): Promise<AuthSession | null>;
  getCurrentUser(): Promise<AuthSession | null>;
  hasPermission(
    session: AuthSession,
    module: DbPermissionModule,
    action: DbPermissionAction
  ): boolean;
  requirePermission(
    session: AuthSession,
    module: DbPermissionModule,
    action: DbPermissionAction
  ): void;
  hasPermissionRls(
    module: DbPermissionModule,
    action: DbPermissionAction
  ): Promise<boolean>;
  requirePermissionRls(
    module: DbPermissionModule,
    action: DbPermissionAction
  ): Promise<void>;
  changePassword(newPassword: string): Promise<void>;
  createStaffUser(input: Parameters<IUserRepository["createStaffAccount"]>[0]): Promise<unknown>;
}

export class AuthService implements IAuthService {
  constructor(
    private readonly users: IUserRepository,
    private readonly supabase: SupabaseServerClient,
    private readonly activityLogs?: IActivityLogRepository
  ) {}

  async signIn(email: string, password: string): Promise<AuthSession> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      throw new ServiceError(
        error.message === "Invalid login credentials"
          ? "Invalid email or password."
          : error.message,
        "AUTH_SIGN_IN_FAILED",
        401
      );
    }

    if (!data.user) {
      throw new ServiceError("Sign in failed.", "AUTH_SIGN_IN_FAILED", 401);
    }

    authDebug("AuthService.signIn", {
      authUserId: data.user.id,
      authEmail: data.user.email ?? email,
    });

    const session = await this.buildSession(data.user.id, data.user.email ?? email);

    authDebug("AuthService.signIn.success", {
      authUserId: data.user.id,
      roleId: session.roleId,
      permissionCount: session.permissions.length,
    });

    await this.users.recordLastLogin(data.user.id);

    try {
      await this.activityLogs?.create({
        userId: data.user.id,
        userName: session.fullName,
        action: "Logged in",
        actionCode: ActivityActionCodes.AUTH_LOGIN,
        module: "auth",
        entityType: "user",
        entityId: data.user.id,
      });
    } catch {
      // Non-blocking login audit
    }

    return session;
  }

  async signOut(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();
    if (error) {
      throw new ServiceError(error.message, "AUTH_SIGN_OUT_FAILED", 500);
    }
  }

  async getSession(): Promise<AuthSession | null> {
    const {
      data: { user },
      error,
    } = await this.supabase.auth.getUser();

    authDebug("AuthService.getSession.getUser", {
      hasUser: Boolean(user),
      authUserId: user?.id ?? null,
      authEmail: user?.email ?? null,
      error: error?.message ?? null,
    });

    if (error || !user) {
      return null;
    }

    try {
      const session = await this.buildSession(user.id, user.email ?? "");
      authDebug("AuthService.getSession.success", {
        authUserId: user.id,
        roleId: session.roleId,
      });
      return session;
    } catch (err) {
      authDebug("AuthService.getSession.failed", {
        authUserId: user.id,
        authEmail: user.email ?? null,
        error: err instanceof Error ? err.message : String(err),
        code: err instanceof ServiceError ? err.code : null,
      });
      return null;
    }
  }

  async getCurrentUser(): Promise<AuthSession | null> {
    authDebug("AuthService.getCurrentUser", { note: "delegates to getSession" });
    return this.getSession();
  }

  hasPermission(
    session: AuthSession,
    module: DbPermissionModule,
    action: DbPermissionAction
  ): boolean {
    const code = `${module}.${action}`;
    return session.permissions.includes(code);
  }

  requirePermission(
    session: AuthSession,
    module: DbPermissionModule,
    action: DbPermissionAction
  ): void {
    if (!this.hasPermission(session, module, action)) {
      throw new Error(`Forbidden: missing permission ${module}.${action}`);
    }
  }

  async hasPermissionRls(
    module: DbPermissionModule,
    action: DbPermissionAction
  ): Promise<boolean> {
    const { data, error } = await this.supabase.rpc("has_permission", {
      p_module: module,
      p_action: action,
    });

    if (error) {
      throw new ServiceError(
        `Permission check failed: ${error.message}`,
        "PERMISSION_CHECK_FAILED",
        500
      );
    }

    return Boolean(data);
  }

  async requirePermissionRls(
    module: DbPermissionModule,
    action: DbPermissionAction
  ): Promise<void> {
    const allowed = await this.hasPermissionRls(module, action);
    if (!allowed) {
      throw new Error(`Forbidden: missing permission ${module}.${action}`);
    }
  }

  async changePassword(newPassword: string): Promise<void> {
    const {
      data: { user },
      error: userError,
    } = await this.supabase.auth.getUser();

    if (userError || !user) {
      throw new ServiceError("Not authenticated.", "UNAUTHORIZED", 401);
    }

    const { error } = await this.supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw new ServiceError(error.message, "PASSWORD_UPDATE_FAILED", 400);
    }

    await this.users.setMustChangePassword(user.id, false);
  }

  async createStaffUser(
    input: Parameters<IUserRepository["createStaffAccount"]>[0]
  ): Promise<DbStaffWithUser> {
    return this.users.createStaffAccount(input);
  }

  private async buildSession(userId: string, email: string): Promise<AuthSession> {
    authDebug("AuthService.buildSession", { authUserId: userId, authEmail: email });

    const dbUser = await this.users.findById(userId);
    authDebug("AuthService.buildSession.usersLookup", {
      authUserId: userId,
      found: Boolean(dbUser),
      status: dbUser?.status ?? null,
    });

    const staff = await this.users.findStaffByUserId(userId);

    authDebug("AuthService.buildSession.staffLookup", {
      authUserId: userId,
      staffFound: Boolean(staff),
      staffProfileId: staff?.id ?? null,
      staffUserId: staff?.user_id ?? null,
      roleId: staff?.role_id ?? null,
    });

    if (!staff) {
      throw new ServiceError(
        "No staff profile linked to this account. Contact your administrator.",
        "STAFF_PROFILE_MISSING",
        403
      );
    }

    if (staff.user.status !== "active") {
      throw new ServiceError(
        "This account is suspended or inactive.",
        "ACCOUNT_INACTIVE",
        403
      );
    }

    const permissions = await this.users.getPermissionsForUser(userId);

    return {
      userId,
      email: staff.user.email ?? email,
      fullName: staff.user.full_name,
      roleId: staff.role_id,
      permissions,
      mustChangePassword: Boolean(staff.user.must_change_password),
      avatarUrl: staff.avatar_url ?? null,
    };
  }
}
