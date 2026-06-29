import { createClient } from "@supabase/supabase-js";

import { supabaseEnv } from "@/lib/supabase/config";
import type { Database } from "@/lib/supabase/database.types";

export type SupabaseAdminClient = ReturnType<typeof createClient<Database>>;

/**
 * Service-role client — bypasses RLS. Server-only; never import in client components.
 */
export function createAdminClient(): SupabaseAdminClient {
  if (!supabaseEnv.url || !supabaseEnv.serviceRoleKey) {
    throw new Error(
      "Supabase admin client requires SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createClient<Database>(supabaseEnv.url, supabaseEnv.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
