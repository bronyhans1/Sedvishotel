import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseEnv } from "@/lib/supabase/config";
import { createServerClient } from "@/lib/supabase/server";
import type { TaxAndChargeSettings } from "@/repositories/settings.repository";
import { SupabaseSettingsRepository } from "@/repositories/supabase/settings.repository";

export const DEFAULT_TAX_AND_CHARGE_SETTINGS: TaxAndChargeSettings = {
  currency: "GHS",
  taxRate: 0.15,
  serviceCharge: 0,
};

/** Loads active hotel tax/service settings — no app-level cache (reads DB each request). */
export async function loadTaxAndChargeSettings(): Promise<TaxAndChargeSettings> {
  try {
    const client = supabaseEnv.serviceRoleKey
      ? createAdminClient()
      : await createServerClient();
    const repo = new SupabaseSettingsRepository(client);
    const settings = await repo.getTaxAndCharges();
    return settings ?? DEFAULT_TAX_AND_CHARGE_SETTINGS;
  } catch {
    return DEFAULT_TAX_AND_CHARGE_SETTINGS;
  }
}
