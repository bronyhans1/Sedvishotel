import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseEnv } from "@/lib/supabase/config";
import { createServerClient } from "@/lib/supabase/server";
import { SupabaseSettingsRepository } from "@/repositories/supabase/settings.repository";

/** Read global VAT rate without requiring settings.view permission. */
export async function getDefaultTaxRate(): Promise<number> {
  const client = supabaseEnv.serviceRoleKey
    ? createAdminClient()
    : await createServerClient();
  const repo = new SupabaseSettingsRepository(client);
  const tax = await repo.getTaxAndCharges();
  return tax?.taxRate ?? 0.15;
}

export function isGlobalVatEnabled(taxRate: number): boolean {
  return taxRate > 0;
}
