import type {
  StockMovement,
  StockMovementSortDirection,
  StockMovementSortKey,
  StockMovementTypeFilter,
} from "@/types/inventory";

function matchesSearch(movement: StockMovement, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return (
    movement.productName.toLowerCase().includes(normalized) ||
    movement.productBarcode.toLowerCase().includes(normalized) ||
    movement.productSku.toLowerCase().includes(normalized) ||
    movement.movementType.toLowerCase().includes(normalized) ||
    (movement.reason ?? "").toLowerCase().includes(normalized) ||
    (movement.notes ?? "").toLowerCase().includes(normalized) ||
    (movement.performedByName ?? "").toLowerCase().includes(normalized) ||
    (movement.referenceType ?? "").toLowerCase().includes(normalized) ||
    (movement.referenceId ?? "").toLowerCase().includes(normalized) ||
    movement.movementSource.toLowerCase().includes(normalized)
  );
}

function compareValues(
  a: StockMovement,
  b: StockMovement,
  key: StockMovementSortKey,
  direction: StockMovementSortDirection
): number {
  let result = 0;
  switch (key) {
    case "createdAt":
      result = a.createdAt.localeCompare(b.createdAt);
      break;
    case "product":
      result = a.productName.localeCompare(b.productName);
      break;
    case "quantity":
      result = a.quantity - b.quantity;
      break;
    case "movementType":
      result = a.movementType.localeCompare(b.movementType);
      break;
    case "newStock":
      result = a.newStock - b.newStock;
      break;
    default:
      result = 0;
  }
  return direction === "asc" ? result : -result;
}

export function filterStockMovements(
  movements: StockMovement[],
  search: string,
  movementType: StockMovementTypeFilter,
  productId: string,
  sortKey: StockMovementSortKey,
  sortDirection: StockMovementSortDirection
): StockMovement[] {
  return [...movements]
    .filter((m) => {
      if (movementType !== "all" && m.movementType !== movementType) return false;
      if (productId && m.productId !== productId) return false;
      return matchesSearch(m, search);
    })
    .sort((a, b) => compareValues(a, b, sortKey, sortDirection));
}

export const STOCK_MOVEMENT_PAGE_SIZE = 15;

export function paginateStockMovements<T>(
  items: T[],
  page: number,
  pageSize = STOCK_MOVEMENT_PAGE_SIZE
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
