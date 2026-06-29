import type { AuthSession } from "@/services/auth.service";
import type { DbPermissionAction, DbPermissionModule } from "@/types/database";
import { permissionCode } from "@/lib/database/rbac";
import { SupabaseUserRepository } from "@/repositories/supabase/user.repository";
import type { SupabaseServerClient } from "@/lib/supabase/server";

/**
 * Session-based permission check (loaded at login).
 */
export function sessionHasPermission(
  session: AuthSession,
  module: DbPermissionModule,
  action: DbPermissionAction
): boolean {
  return session.permissions.includes(permissionCode(module, action));
}

export function requireSessionPermission(
  session: AuthSession,
  module: DbPermissionModule,
  action: DbPermissionAction
): void {
  if (!sessionHasPermission(session, module, action)) {
    throw new Error(`Forbidden: missing permission ${permissionCode(module, action)}`);
  }
}

/**
 * Database RLS helper via `has_permission()` — use when verifying under live JWT.
 */
export async function hasPermissionRls(
  client: SupabaseServerClient,
  module: DbPermissionModule,
  action: DbPermissionAction
): Promise<boolean> {
  const repo = new SupabaseUserRepository(client);
  return repo.hasPermissionRpc(module, action);
}

export async function requirePermissionRls(
  client: SupabaseServerClient,
  module: DbPermissionModule,
  action: DbPermissionAction
): Promise<void> {
  const allowed = await hasPermissionRls(client, module, action);
  if (!allowed) {
    throw new Error(`Forbidden: missing permission ${permissionCode(module, action)}`);
  }
}
