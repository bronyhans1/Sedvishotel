import { isSupabaseConfigured, supabaseEnv } from "@/lib/supabase/config";

/** User-safe message when Supabase auth env vars are missing. */
export const AUTH_CONFIGURATION_INCOMPLETE_MESSAGE =
  "Application configuration is incomplete. Contact your system administrator.";

/** User-safe message when authentication cannot reach Supabase. */
export const AUTH_SERVICE_UNAVAILABLE_MESSAGE =
  "Authentication service is unavailable.";

const LOGIN_ERROR_MESSAGES: Record<string, string> = {
  configuration: AUTH_CONFIGURATION_INCOMPLETE_MESSAGE,
  staff_profile: "Your staff profile could not be loaded. Contact an administrator.",
};

export function resolveLoginPageError(code: string | undefined): string | null {
  if (!code) return null;
  return LOGIN_ERROR_MESSAGES[code] ?? null;
}

/** Required for staff sign-in (Supabase Auth). */
export function getMissingAuthEnvVars(): string[] {
  const missing: string[] = [];
  if (!supabaseEnv.url) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!supabaseEnv.anonKey) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return missing;
}

/** Required for server-side SHMS operations (not login itself). */
export function getMissingServiceEnvVars(): string[] {
  if (!supabaseEnv.serviceRoleKey) {
    return ["SUPABASE_SERVICE_ROLE_KEY"];
  }
  return [];
}

export function assertAuthConfigured(): void {
  if (!isSupabaseConfigured()) {
    throw new Error(AUTH_CONFIGURATION_INCOMPLETE_MESSAGE);
  }
}
