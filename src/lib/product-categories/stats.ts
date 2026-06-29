import type {
  ProductCategory,
  ProductCategoryStats,
} from "@/types/product-category";

export function computeProductCategoryStats(
  categories: ProductCategory[]
): ProductCategoryStats {
  const active = categories.filter((c) => c.isActive);
  const archived = categories.filter((c) => !c.isActive);
  const orders = categories.map((c) => c.displayOrder);
  return {
    totalCategories: categories.length,
    activeCategories: active.length,
    archivedCategories: archived.length,
    highestDisplayOrder: orders.length ? Math.max(...orders) : 0,
  };
}
