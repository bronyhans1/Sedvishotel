import type { Product } from "@/types/product";

export function isLowStock(product: Pick<Product, "currentStock" | "minimumStock">): boolean {
  return product.currentStock <= product.minimumStock;
}

export function isOutOfStock(product: Pick<Product, "currentStock" | "status">): boolean {
  return product.currentStock <= 0 || product.status === "out_of_stock";
}

export function computeInventoryValue(
  products: Pick<Product, "currentStock" | "costPrice">[]
): number {
  return products.reduce((sum, p) => {
    const cost = p.costPrice ?? 0;
    return sum + cost * p.currentStock;
  }, 0);
}
