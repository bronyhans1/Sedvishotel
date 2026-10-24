import { cache } from "react";

import { mapDbSettingsToHotelSettings } from "@/lib/settings/mapper";
import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseEnv } from "@/lib/supabase/config";
import { createServerClient } from "@/lib/supabase/server";
import { SupabaseSettingsRepository } from "@/repositories/supabase/settings.repository";

/** Fail-open default: preserve existing public price visibility when unset or unloadable. */
export const DEFAULT_SHOW_PUBLIC_WEBSITE_PRICES = true;

/** Resolves the effective public price visibility flag (missing → true). */
export function resolveShowPublicWebsitePrices(
  value: boolean | undefined | null
): boolean {
  return typeof value === "boolean" ? value : DEFAULT_SHOW_PUBLIC_WEBSITE_PRICES;
}

/**
 * Server-side loader for public website price visibility.
 * Request-scoped via React `cache` to avoid duplicate settings reads.
 * Fail-open: returns `true` if settings cannot be loaded.
 * Read-only — never writes settings.
 */
export const loadPublicPriceVisibility = cache(async (): Promise<boolean> => {
  try {
    const client = supabaseEnv.serviceRoleKey
      ? createAdminClient()
      : await createServerClient();
    const repo = new SupabaseSettingsRepository(client);
    const row = await repo.getActive();
    if (!row) return DEFAULT_SHOW_PUBLIC_WEBSITE_PRICES;
    const settings = mapDbSettingsToHotelSettings(row);
    return resolveShowPublicWebsitePrices(settings.showPublicWebsitePrices);
  } catch {
    return DEFAULT_SHOW_PUBLIC_WEBSITE_PRICES;
  }
});
