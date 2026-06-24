import { getAuthService } from "@/lib/auth/get-auth";
import type { CurrentUser } from "@/lib/auth/current-user.types";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type { CurrentUser } from "@/lib/auth/current-user.types";

/**
 * Server-only: loads the signed-in staff user from Supabase (public.users + staff_profiles).
 * Do not import this module from Client Components — use current-user.types.ts for props.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const auth = await getAuthService();
  const session = await auth.getSession();
  if (!session) {
    return null;
  }

  const fullName = session.fullName.trim();

  return {
    id: session.userId,
    email: session.email,
    fullName,
    role: session.roleId,
    mustChangePassword: session.mustChangePassword,
    permissions: session.permissions,
    avatarUrl: session.avatarUrl ?? null,
  };
}
