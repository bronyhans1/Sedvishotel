import type { Product, ProductStats } from "@/types/product";

export function computeProductStats(products: Product[]): ProductStats {
  return {
    totalProducts: products.length,
    activeProducts: products.filter((p) => p.status === "active" && p.isActive)
      .length,
    outOfStockProducts: products.filter((p) => p.status === "out_of_stock")
      .length,
    availableForSaleProducts: products.filter(
      (p) => p.availableForSale && p.isActive
    ).length,
  };
}
