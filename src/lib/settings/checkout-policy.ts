import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseEnv } from "@/lib/supabase/config";
import { createServerClient } from "@/lib/supabase/server";
import { SupabaseSettingsRepository } from "@/repositories/supabase/settings.repository";
import type { CheckoutPolicy } from "@/types/late-checkout";
import { DEFAULT_OVERSTAY_POLICY } from "@/types/overstay";
import type {
  OverstayChargeMode,
  OverstayNightAuditMode,
  OverstayPolicy,
} from "@/types/overstay";

const DEFAULT_POLICY: CheckoutPolicy = {
  checkOutTime: "11:00",
  lateCheckoutPolicyMode: "flat",
  lateCheckoutFee: 100,
  hourFee1To2: 50,
  hourFee2To4: 100,
  hourFee4To6: 150,
  overstay: { ...DEFAULT_OVERSTAY_POLICY },
};

function parseChargeMode(value: string | null | undefined): OverstayChargeMode {
  if (
    value === "one_additional_night" ||
    value === "every_additional_night" ||
    value === "none"
  ) {
    return value;
  }
  return DEFAULT_OVERSTAY_POLICY.chargeMode;
}

function parseNightAuditMode(
  value: string | null | undefined
): OverstayNightAuditMode {
  if (
    value === "continue" ||
    value === "acknowledge" ||
    value === "require_manager"
  ) {
    return value;
  }
  return DEFAULT_OVERSTAY_POLICY.nightAuditMode;
}

export function mapRowToOverstayPolicy(row: {
  overstay_charge_mode?: string | null;
  overstay_manager_approval_required?: boolean | null;
  overstay_allow_manual_waiver?: boolean | null;
  overstay_auto_create_pending_charge?: boolean | null;
  overstay_night_audit_mode?: string | null;
}): OverstayPolicy {
  return {
    chargeMode: parseChargeMode(row.overstay_charge_mode),
    managerApprovalRequired: Boolean(
      row.overstay_manager_approval_required ??
        DEFAULT_OVERSTAY_POLICY.managerApprovalRequired
    ),
    allowManualWaiver:
      row.overstay_allow_manual_waiver ??
      DEFAULT_OVERSTAY_POLICY.allowManualWaiver,
    autoCreatePendingCharge:
      row.overstay_auto_create_pending_charge ??
      DEFAULT_OVERSTAY_POLICY.autoCreatePendingCharge,
    nightAuditMode: parseNightAuditMode(row.overstay_night_audit_mode),
  };
}

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
    overstay: mapRowToOverstayPolicy(row),
  };
}

export async function loadOverstayPolicy(): Promise<OverstayPolicy> {
  const policy = await loadCheckoutPolicy();
  return policy.overstay;
}
