import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseEnv } from "@/lib/supabase/config";
import { createServerClient } from "@/lib/supabase/server";
import { SupabaseActivityLogRepository } from "@/repositories/supabase/activity-log.repository";
import { SupabaseProductCategoryRepository } from "@/repositories/supabase/product-category.repository";
import { ProductCategoryService } from "@/services/product-category.service";

export async function getProductCategoryService(): Promise<ProductCategoryService> {
  const client = supabaseEnv.serviceRoleKey
    ? createAdminClient()
    : await createServerClient();

  return new ProductCategoryService(
    new SupabaseProductCategoryRepository(client),
    new SupabaseActivityLogRepository(client)
  );
}
