import { redirect } from "next/navigation";

import { ACCESS_DENIED_PATH } from "@/lib/auth/route-guard";
import { getProductCategoryAccess } from "@/lib/auth/product-category-access";
import { getServiceContextForPage } from "@/lib/auth/service-context";
import { computeProductCategoryStats } from "@/lib/product-categories/stats";
import { getProductCategoryService } from "@/lib/product-categories/get-product-category-service";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function loadProductCategoriesPageData() {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const { session, ctx } = await getServiceContextForPage();
  const access = getProductCategoryAccess(session);
  if (!access.canView) {
    redirect(ACCESS_DENIED_PATH);
  }

  const service = await getProductCategoryService();
  const categories = await service.list(ctx, session);
  const stats = computeProductCategoryStats(categories);

  return { categories, stats, access };
}
