import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseEnv } from "@/lib/supabase/config";
import { createServerClient } from "@/lib/supabase/server";
import { SupabaseSettingsRepository } from "@/repositories/supabase/settings.repository";
import type { CheckoutPolicy } from "@/types/late-checkout";

const DEFAULT_POLICY: CheckoutPolicy = {
  checkOutTime: "11:00",
  lateCheckoutPolicyMode: "flat",
  lateCheckoutFee: 100,
  hourFee1To2: 50,
  hourFee2To4: 100,
  hourFee4To6: 150,
};

export async function loadCheckoutPolicy(): Promise<CheckoutPolicy> {
  const client = supabaseEnv.serviceRoleKey
    ? createAdminClient()
    : await createServerClient();
  const repo = new SupabaseSettingsRepository(client);
  const row = await repo.getActive();
  if (!row) return DEFAULT_POLICY;

  return {
    checkOutTime: row.check_out_time?.slice(0, 5) ?? DEFAULT_POLICY.checkOutTime,
    lateCheckoutPolicyMode:
      row.late_checkout_policy_mode === "hour_based" ? "hour_based" : "flat",
    lateCheckoutFee: Number(row.late_checkout_fee ?? DEFAULT_POLICY.lateCheckoutFee),
    hourFee1To2: Number(row.late_checkout_hour_fee_1_2 ?? DEFAULT_POLICY.hourFee1To2),
    hourFee2To4: Number(row.late_checkout_hour_fee_2_4 ?? DEFAULT_POLICY.hourFee2To4),
    hourFee4To6: Number(row.late_checkout_hour_fee_4_6 ?? DEFAULT_POLICY.hourFee4To6),
  };
}
