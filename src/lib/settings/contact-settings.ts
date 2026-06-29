import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseEnv } from "@/lib/supabase/config";
import { createServerClient } from "@/lib/supabase/server";
import { SupabaseSettingsRepository } from "@/repositories/supabase/settings.repository";
import type { PublicHotelContactSettings } from "@/types/public";

function nonEmpty(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/** Loads hotel contact fields for the public website — reads SHMS settings each request. */
export async function loadHotelContactSettings(): Promise<PublicHotelContactSettings> {
  try {
    const client = supabaseEnv.serviceRoleKey
      ? createAdminClient()
      : await createServerClient();
    const repo = new SupabaseSettingsRepository(client);
    const settings = await repo.getActive();
    if (!settings) {
      return { phone: null, email: null, address: null };
    }

    return {
      phone: nonEmpty(settings.phone),
      email: nonEmpty(settings.email),
      address: nonEmpty(settings.address),
    };
  } catch {
    return { phone: null, email: null, address: null };
  }
}
