import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { isSupabaseConfigured, supabaseEnv } from "@/lib/supabase/config";
import type { Database } from "@/lib/supabase/database.types";

export type SupabaseServerClient = ReturnType<
  typeof createSupabaseServerClient<Database>
>;

export async function createServerClient(): Promise<SupabaseServerClient> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }

  const cookieStore = await cookies();

  return createSupabaseServerClient<Database>(
    supabaseEnv.url,
    supabaseEnv.anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Ignored when called from Server Component without mutable cookies
          }
        },
      },
    }
  );
}
