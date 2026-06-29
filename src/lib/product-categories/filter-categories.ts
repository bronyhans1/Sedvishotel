import type {
  ProductCategory,
  ProductCategorySortDirection,
  ProductCategorySortKey,
  ProductCategoryStatusFilter,
} from "@/types/product-category";

function matchesSearch(category: ProductCategory, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return (
    category.name.toLowerCase().includes(normalized) ||
    category.description.toLowerCase().includes(normalized)
  );
}

function matchesStatus(
  category: ProductCategory,
  status: ProductCategoryStatusFilter
): boolean {
  if (status === "all") return true;
  if (status === "active") return category.isActive;
  return !category.isActive;
}

function compareValues(
  a: ProductCategory,
  b: ProductCategory,
  key: ProductCategorySortKey,
  direction: ProductCategorySortDirection
): number {
  let result = 0;
  switch (key) {
    case "name":
      result = a.name.localeCompare(b.name);
      break;
    case "createdAt":
      result = a.createdAt.localeCompare(b.createdAt);
      break;
    case "displayOrder":
      result = a.displayOrder - b.displayOrder;
      break;
    case "status":
      result = Number(b.isActive) - Number(a.isActive);
      break;
    default:
      result = 0;
  }
  return direction === "asc" ? result : -result;
}

export function filterProductCategories(
  categories: ProductCategory[],
  search: string,
  status: ProductCategoryStatusFilter,
  sortKey: ProductCategorySortKey,
  sortDirection: ProductCategorySortDirection
): ProductCategory[] {
  return [...categories]
    .filter((c) => matchesSearch(c, search) && matchesStatus(c, status))
    .sort((a, b) => compareValues(a, b, sortKey, sortDirection));
}

export const PRODUCT_CATEGORY_PAGE_SIZE = 10;

export function paginateProductCategories<T>(
  items: T[],
  page: number,
  pageSize = PRODUCT_CATEGORY_PAGE_SIZE
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
