import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseEnv } from "@/lib/supabase/config";
import { createServerClient } from "@/lib/supabase/server";
import { SupabaseActivityLogRepository } from "@/repositories/supabase/activity-log.repository";
import { SupabaseHotelOperatingDayRepository } from "@/repositories/supabase/hotel-operating-day.repository";
import { SupabaseUserRepository } from "@/repositories/supabase/user.repository";
import { BusinessDateService } from "@/services/business-date.service";

export async function getBusinessDateService(): Promise<BusinessDateService> {
  const client = supabaseEnv.serviceRoleKey
    ? createAdminClient()
    : await createServerClient();

  return new BusinessDateService(
    new SupabaseHotelOperatingDayRepository(client),
    new SupabaseUserRepository(client),
    new SupabaseActivityLogRepository(client)
  );
}
