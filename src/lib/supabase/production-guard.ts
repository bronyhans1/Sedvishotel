import { isSupabaseConfigured } from "@/lib/supabase/config";

/** Returns true when the app must have Supabase configured (production). */
export function isProductionDeployment(): boolean {
  return process.env.NODE_ENV === "production";
}

/** Production must not run without Supabase — prevents mock-auth dashboard exposure. */
export function isSupabaseRequired(): boolean {
  return isProductionDeployment() && !isSupabaseConfigured();
}
