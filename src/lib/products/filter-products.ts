import type {
  Product,
  ProductSortDirection,
  ProductSortKey,
  ProductStatusFilter,
} from "@/types/product";

function matchesSearch(product: Product, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return (
    product.name.toLowerCase().includes(normalized) ||
    product.barcode.toLowerCase().includes(normalized) ||
    product.sku.toLowerCase().includes(normalized) ||
    product.categoryName.toLowerCase().includes(normalized) ||
    product.description.toLowerCase().includes(normalized)
  );
}

function matchesStatus(product: Product, status: ProductStatusFilter): boolean {
  if (status === "all") return true;
  return product.status === status;
}

function matchesCategory(product: Product, categoryId: string): boolean {
  if (!categoryId) return true;
  return product.categoryId === categoryId;
}

function compareValues(
  a: Product,
  b: Product,
  key: ProductSortKey,
  direction: ProductSortDirection
): number {
  let result = 0;
  switch (key) {
    case "name":
      result = a.name.localeCompare(b.name);
      break;
    case "category":
      result = a.categoryName.localeCompare(b.categoryName);
      break;
    case "sellingPrice":
      result = a.sellingPrice - b.sellingPrice;
      break;
    case "currentStock":
      result = a.currentStock - b.currentStock;
      break;
    case "createdAt":
      result = a.createdAt.localeCompare(b.createdAt);
      break;
    case "status":
      result = a.status.localeCompare(b.status);
      break;
    default:
      result = 0;
  }
  return direction === "asc" ? result : -result;
}

export function filterProducts(
  products: Product[],
  search: string,
  categoryId: string,
  status: ProductStatusFilter,
  sortKey: ProductSortKey,
  sortDirection: ProductSortDirection
): Product[] {
  return [...products]
    .filter(
      (p) =>
        matchesSearch(p, search) &&
        matchesCategory(p, categoryId) &&
        matchesStatus(p, status)
    )
    .sort((a, b) => compareValues(a, b, sortKey, sortDirection));
}

export const PRODUCT_PAGE_SIZE = 10;

export function paginateProducts<T>(
  items: T[],
  page: number,
  pageSize = PRODUCT_PAGE_SIZE
): { items: T[]; totalPages: number; page: number } {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    totalPages,
    page: safePage,
  };
}
