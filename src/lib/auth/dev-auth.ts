import "server-only";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isProductionDeployment } from "@/lib/supabase/production-guard";

/** Local-only credentials — never used in production builds. */
const DEV_AUTH_CREDENTIALS = {
  email: "admin@sedvis-hotel.com",
  password: "sedvis2026",
} as const;

/**
 * Mock authentication is allowed only in development with an explicit opt-in flag.
 * Production builds always return false regardless of env vars.
 */
export function isDevAuthEnabled(): boolean {
  if (isProductionDeployment()) {
    return false;
  }
  return (
    process.env.NODE_ENV === "development" &&
    process.env.ENABLE_DEV_AUTH === "true"
  );
}

/** True when mock sign-in may be attempted (dev flag + Supabase not configured). */
export function canUseDevAuthFallback(): boolean {
  return isDevAuthEnabled() && !isSupabaseConfigured();
}

export function validateDevAuthCredentials(
  email: string,
  password: string
): boolean {
  if (!canUseDevAuthFallback()) {
    return false;
  }
  return (
    email === DEV_AUTH_CREDENTIALS.email &&
    password === DEV_AUTH_CREDENTIALS.password
  );
}

/** Hint shown on login UI — only when dev auth is explicitly enabled. */
export function getDevAuthCredentialHint(): {
  email: string;
  password: string;
} | null {
  if (!canUseDevAuthFallback()) {
    return null;
  }
  return { ...DEV_AUTH_CREDENTIALS };
}

/** Block dashboard access when Supabase is missing and dev auth is not enabled. */
export function isDashboardBlockedWithoutSupabase(): boolean {
  return !isSupabaseConfigured() && !isDevAuthEnabled();
}
