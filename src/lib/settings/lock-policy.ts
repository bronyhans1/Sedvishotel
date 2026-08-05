import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseEnv } from "@/lib/supabase/config";
import { createServerClient } from "@/lib/supabase/server";
import { SupabaseSettingsRepository } from "@/repositories/supabase/settings.repository";
import {
  DEFAULT_LOCK_POLICY,
  type LockPolicy,
} from "@/types/operational-integrity";

export async function loadLockPolicy(): Promise<LockPolicy> {
  const client = supabaseEnv.serviceRoleKey
    ? createAdminClient()
    : await createServerClient();
  const row = await new SupabaseSettingsRepository(client).getActive();
  if (!row) return { ...DEFAULT_LOCK_POLICY };

  return {
    blockInventoryAdjustments:
      row.lock_block_inventory_adjustments ??
      DEFAULT_LOCK_POLICY.blockInventoryAdjustments,
    blockManualPayments:
      row.lock_block_manual_payments ??
      DEFAULT_LOCK_POLICY.blockManualPayments,
    businessDayOpenWarningHour:
      row.business_day_open_warning_hour ??
      DEFAULT_LOCK_POLICY.businessDayOpenWarningHour,
    correctionSessionMaxHours:
      row.correction_session_max_hours ??
      DEFAULT_LOCK_POLICY.correctionSessionMaxHours,
  };
}
