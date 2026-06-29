import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseEnv } from "@/lib/supabase/config";
import { createServerClient } from "@/lib/supabase/server";
import { SupabaseActivityLogRepository } from "@/repositories/supabase/activity-log.repository";
import { SupabaseProductRepository } from "@/repositories/supabase/product.repository";
import { ProductService } from "@/services/product.service";

export async function getProductService(): Promise<ProductService> {
  const client = supabaseEnv.serviceRoleKey
    ? createAdminClient()
    : await createServerClient();

  return new ProductService(
    new SupabaseProductRepository(client),
    new SupabaseActivityLogRepository(client),
    client
  );
}
