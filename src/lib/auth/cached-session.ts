import { cache } from "react";

import { getAuthService } from "@/lib/auth/get-auth";
import type { AuthSession } from "@/services/auth.service";

/**
 * Request-scoped staff session (React cache).
 * Deduplicates getUser + buildSession within a single RSC/layout/page render.
 * Does not change auth semantics — still loads via AuthService.getSession().
 */
export const getCachedAuthSession = cache(
  async (): Promise<AuthSession | null> => {
    const auth = await getAuthService();
    return auth.getSession();
  }
);
