import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseEnv } from "@/lib/supabase/config";
import { createServerClient } from "@/lib/supabase/server";
import { SupabaseInventoryRepository } from "@/repositories/supabase/inventory.repository";
import { SupabasePosRepository } from "@/repositories/supabase/pos.repository";
import { SupabaseProductRepository } from "@/repositories/supabase/product.repository";
import { PosDashboardService } from "@/services/pos-dashboard.service";

export async function getPosDashboardService(): Promise<PosDashboardService> {
  const client = supabaseEnv.serviceRoleKey
    ? createAdminClient()
    : await createServerClient();

  return new PosDashboardService(
    new SupabasePosRepository(client),
    new SupabaseProductRepository(client),
    new SupabaseInventoryRepository(client)
  );
}
