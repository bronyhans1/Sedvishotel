import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseEnv } from "@/lib/supabase/config";
import { createServerClient } from "@/lib/supabase/server";
import { SupabaseActivityLogRepository } from "@/repositories/supabase/activity-log.repository";
import {
  SupabaseBusinessDayLockAuditRepository,
  SupabaseCorrectionSessionRepository,
} from "@/repositories/supabase/correction-session.repository";
import { SupabaseNightAuditRepository } from "@/repositories/supabase/night-audit.repository";
import { SupabaseUserRepository } from "@/repositories/supabase/user.repository";
import { BusinessDayLockService } from "@/services/business-day-lock.service";
import { CorrectionSessionService } from "@/services/correction-session.service";

async function getClient() {
  return supabaseEnv.serviceRoleKey
    ? createAdminClient()
    : await createServerClient();
}

export async function getBusinessDayLockService(): Promise<BusinessDayLockService> {
  const client = await getClient();
  const activityLogs = new SupabaseActivityLogRepository(client);
  return new BusinessDayLockService(
    new SupabaseNightAuditRepository(client),
    new SupabaseCorrectionSessionRepository(client),
    new SupabaseBusinessDayLockAuditRepository(client),
    new SupabaseUserRepository(client),
    activityLogs
  );
}

export async function getCorrectionSessionService(): Promise<CorrectionSessionService> {
  const client = await getClient();
  return new CorrectionSessionService(
    new SupabaseCorrectionSessionRepository(client),
    new SupabaseNightAuditRepository(client),
    new SupabaseUserRepository(client),
    new SupabaseActivityLogRepository(client)
  );
}
