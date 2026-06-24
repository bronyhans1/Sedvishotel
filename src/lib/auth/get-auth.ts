import { authDebug } from "@/lib/auth/debug-log";
import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseEnv } from "@/lib/supabase/config";
import { createServerClient } from "@/lib/supabase/server";
import { SupabaseActivityLogRepository } from "@/repositories/supabase/activity-log.repository";
import { SupabaseUserRepository } from "@/repositories/supabase/user.repository";
import { AuthService } from "@/services/auth.service";

export async function getAuthService(): Promise<AuthService> {
  const supabase = await createServerClient();

  // Staff/user/role reads for login must bypass RLS until policies are deployed (017 enables RLS, no SELECT policies yet).
  const repositoryClient = supabaseEnv.serviceRoleKey
    ? createAdminClient()
    : supabase;

  const adminClient = supabaseEnv.serviceRoleKey ? createAdminClient() : undefined;

  authDebug("getAuthService", {
    repository: supabaseEnv.serviceRoleKey ? "service_role" : "session_anon",
    hasServiceRoleKey: Boolean(supabaseEnv.serviceRoleKey),
  });

  return new AuthService(
    new SupabaseUserRepository(repositoryClient, adminClient),
    supabase,
    new SupabaseActivityLogRepository(repositoryClient)
  );
}
