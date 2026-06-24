import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr";

import { isSupabaseConfigured, supabaseEnv } from "@/lib/supabase/config";
import type { Database } from "@/lib/supabase/database.types";

export type SupabaseBrowserClient = ReturnType<
  typeof createSupabaseBrowserClient<Database>
>;

export function createBrowserClient(): SupabaseBrowserClient {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  return createSupabaseBrowserClient<Database>(
    supabaseEnv.url,
    supabaseEnv.anonKey
  );
}
