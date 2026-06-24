/**
 * Supabase environment configuration.
 * Do not commit real keys — use .env.local
 */
export const supabaseEnv = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
} as const;

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseEnv.url && supabaseEnv.anonKey);
}
