import type { Product } from "@/types/product";

export function filterPosCatalog(
  products: Product[],
  search: string,
  categoryId: string
): Product[] {
  const normalized = search.trim().toLowerCase();

  return products.filter((product) => {
    if (!product.availableForSale || !product.isActive) return false;
    if (product.status === "discontinued" || product.status === "inactive") {
      return false;
    }
    if (categoryId && product.categoryId !== categoryId) return false;
    if (!normalized) return true;
    return (
      product.name.toLowerCase().includes(normalized) ||
      product.barcode.toLowerCase().includes(normalized) ||
      product.sku.toLowerCase().includes(normalized) ||
      product.categoryName.toLowerCase().includes(normalized)
    );
  });
}

export function findProductByBarcode(
  products: Product[],
  barcode: string
): Product | undefined {
  const normalized = barcode.trim().toLowerCase();
  if (!normalized) return undefined;
  return products.find(
    (product) =>
      product.barcode.toLowerCase() === normalized ||
      product.sku.toLowerCase() === normalized
  );
}

export function productToCartLine(product: Product, quantity = 1) {
  return {
    productId: product.id,
    name: product.name,
    barcode: product.barcode,
    sku: product.sku,
    categoryName: product.categoryName,
    imageUrl: product.imageUrl,
    unitPrice: product.sellingPrice,
    vatApplicable: product.vatApplicable,
    currentStock: product.currentStock,
    unit: product.unit,
    quantity,
  };
}
