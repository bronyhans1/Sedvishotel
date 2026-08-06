import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseEnv } from "@/lib/supabase/config";
import { createServerClient } from "@/lib/supabase/server";
import { SupabaseSettingsRepository } from "@/repositories/supabase/settings.repository";
import {
  DEFAULT_NIGHT_AUDIT_WINDOW,
  type NightAuditWindowPolicy,
} from "@/lib/night-audit/audit-window";
import { loadLockPolicy } from "@/lib/settings/lock-policy";

function readTime(
  json: Record<string, unknown>,
  key: string,
  fallback: string
): string {
  const value = json[key];
  if (typeof value === "string" && /^\d{1,2}:\d{2}/.test(value)) {
    return value.slice(0, 5);
  }
  return fallback;
}

/** Loads Night Audit Window from hotel settings_json + morning warning from lock policy. */
export async function loadNightAuditWindowPolicy(): Promise<NightAuditWindowPolicy> {
  const lock = await loadLockPolicy();
  try {
    const client = supabaseEnv.serviceRoleKey
      ? createAdminClient()
      : await createServerClient();
    const row = await new SupabaseSettingsRepository(client).getActive();
    const json = (row?.settings_json ?? {}) as Record<string, unknown>;
    return {
      earliestClose: readTime(
        json,
        "nightAuditEarliestClose",
        DEFAULT_NIGHT_AUDIT_WINDOW.earliestClose
      ),
      recommendedClose: readTime(
        json,
        "nightAuditRecommendedClose",
        DEFAULT_NIGHT_AUDIT_WINDOW.recommendedClose
      ),
      latestClose: readTime(
        json,
        "nightAuditLatestClose",
        DEFAULT_NIGHT_AUDIT_WINDOW.latestClose
      ),
      morningWarningHour:
        lock.businessDayOpenWarningHour ??
        DEFAULT_NIGHT_AUDIT_WINDOW.morningWarningHour,
    };
  } catch {
    return {
      ...DEFAULT_NIGHT_AUDIT_WINDOW,
      morningWarningHour: lock.businessDayOpenWarningHour,
    };
  }
}
