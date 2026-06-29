import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseEnv } from "@/lib/supabase/config";
import { createServerClient } from "@/lib/supabase/server";
import { SupabaseActivityLogRepository } from "@/repositories/supabase/activity-log.repository";
import { SupabaseInventoryRepository } from "@/repositories/supabase/inventory.repository";
import { SupabaseProductRepository } from "@/repositories/supabase/product.repository";
import { InventoryService } from "@/services/inventory.service";

export async function getInventoryService(): Promise<InventoryService> {
  const client = supabaseEnv.serviceRoleKey
    ? createAdminClient()
    : await createServerClient();

  return new InventoryService(
    new SupabaseInventoryRepository(client),
    new SupabaseProductRepository(client),
    new SupabaseActivityLogRepository(client)
  );
}
