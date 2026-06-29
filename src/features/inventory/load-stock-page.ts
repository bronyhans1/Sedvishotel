import { redirect } from "next/navigation";

import { ACCESS_DENIED_PATH } from "@/lib/auth/route-guard";
import { getInventoryAccess } from "@/lib/auth/inventory-access";
import { getServiceContextForPage } from "@/lib/auth/service-context";
import { getInventoryService } from "@/lib/inventory/get-inventory-service";
import { getProductService } from "@/lib/products/get-product-service";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { ProductCategoryOption } from "@/types/product";

export async function loadStockPageData() {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const { session, ctx } = await getServiceContextForPage();
  const access = getInventoryAccess(session);
  if (!access.canView) {
    redirect(ACCESS_DENIED_PATH);
  }

  const inventoryService = await getInventoryService();
  const productService = await getProductService();

  const [stats, movements, products] = await Promise.all([
    inventoryService.getStats(ctx, session),
    inventoryService.listMovements(ctx, session, { limit: 500 }),
    productService.list(ctx, session),
  ]);

  const productOptions: ProductCategoryOption[] = products.map((p) => ({
    id: p.id,
    name: `${p.name} (${p.sku})`,
  }));

  const recentMovements = movements.slice(0, 10);

  return {
    stats,
    movements,
    recentMovements,
    products,
    productOptions,
    access,
  };
}
