import { cache } from "react";

import { getCachedAuthSession } from "@/lib/auth/cached-session";
import type { CurrentUser } from "@/lib/auth/current-user.types";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type { CurrentUser } from "@/lib/auth/current-user.types";

/**
 * Server-only: loads the signed-in staff user from Supabase (public.users + staff_profiles).
 * Request-scoped via React cache — safe to call from layout + nested loaders.
 * Do not import this module from Client Components — use current-user.types.ts for props.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const session = await getCachedAuthSession();
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
});
