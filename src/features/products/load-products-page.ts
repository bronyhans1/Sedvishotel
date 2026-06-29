import { redirect } from "next/navigation";

import { getInventoryAccess } from "@/lib/auth/inventory-access";
import { ACCESS_DENIED_PATH } from "@/lib/auth/route-guard";
import { getProductAccess } from "@/lib/auth/product-access";
import { getServiceContextForPage } from "@/lib/auth/service-context";
import { getProductCategoryService } from "@/lib/product-categories/get-product-category-service";
import { computeProductStats } from "@/lib/products/stats";
import { getProductService } from "@/lib/products/get-product-service";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { ProductCategoryOption } from "@/types/product";

export async function loadProductsPageData() {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const { session, ctx } = await getServiceContextForPage();
  const access = getProductAccess(session);
  const inventoryAccess = getInventoryAccess(session);
  if (!access.canView) {
    redirect(ACCESS_DENIED_PATH);
  }

  const productService = await getProductService();
  const categoryService = await getProductCategoryService();

  const [products, categories] = await Promise.all([
    productService.list(ctx, session),
    categoryService.list(ctx, session),
  ]);

  const categoryOptions: ProductCategoryOption[] = categories
    .filter((c) => c.isActive)
    .map((c) => ({ id: c.id, name: c.name }));

  const stats = computeProductStats(products);

  return { products, stats, access, inventoryAccess, categoryOptions };
}
