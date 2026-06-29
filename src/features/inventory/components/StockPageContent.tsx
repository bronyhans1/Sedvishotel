"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { StockMovementTable } from "@/components/inventory/StockMovementTable";
import { ProductCategoryPagination } from "@/components/product-categories/ProductCategoryPagination";
import { PageContainer } from "@/components/shared/PageContainer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StockStats } from "@/features/inventory/components/StockStats";
import {
  filterStockMovements,
  paginateStockMovements,
  STOCK_MOVEMENT_PAGE_SIZE,
} from "@/lib/inventory/filter-movements";
import { isLowStock, isOutOfStock } from "@/lib/inventory/low-stock";
import { siteConfig } from "@/config/site";
import type { InventoryAccess } from "@/lib/auth/inventory-access.types";
import {
  STOCK_MOVEMENT_TYPE_OPTIONS,
  type InventoryStats,
  type StockMovement,
  type StockMovementSortDirection,
  type StockMovementSortKey,
  type StockMovementTypeFilter,
} from "@/types/inventory";
import type { Product } from "@/types/product";
import type { ProductCategoryOption } from "@/types/product";

const selectClass =
  "h-9 w-full min-w-[140px] rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:w-auto";

type StockPageContentProps = {
  stats: InventoryStats;
  movements: StockMovement[];
  recentMovements: StockMovement[];
  products: Product[];
  productOptions: ProductCategoryOption[];
  access: InventoryAccess;
};

type StockFilter = "all" | "low_stock" | "out_of_stock";

export function StockPageContent({
  stats,
  movements,
  recentMovements,
  products,
  productOptions,
}: StockPageContentProps) {
  const [search, setSearch] = useState("");
  const [movementType, setMovementType] = useState<StockMovementTypeFilter>("all");
  const [productId, setProductId] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortKey, setSortKey] = useState<StockMovementSortKey>("createdAt");
  const [sortDirection, setSortDirection] =
    useState<StockMovementSortDirection>("desc");
  const [page, setPage] = useState(1);

  const productFilterIds = useMemo(() => {
    if (stockFilter === "all") return null;
    const ids = new Set(
      products
        .filter((p) =>
          stockFilter === "low_stock" ? isLowStock(p) : isOutOfStock(p)
        )
        .map((p) => p.id)
    );
    return ids;
  }, [products, stockFilter]);

  const dateFiltered = useMemo(() => {
    return movements.filter((m) => {
      if (fromDate && m.createdAt < `${fromDate}T00:00:00`) return false;
      if (toDate && m.createdAt > `${toDate}T23:59:59`) return false;
      if (productFilterIds && !productFilterIds.has(m.productId)) return false;
      return true;
    });
  }, [movements, fromDate, toDate, productFilterIds]);

  const filtered = useMemo(
    () =>
      filterStockMovements(
        dateFiltered,
        search,
        movementType,
        productId,
        sortKey,
        sortDirection
      ),
    [dateFiltered, search, movementType, productId, sortKey, sortDirection]
  );

  const pagination = useMemo(
    () => paginateStockMovements(filtered, page, STOCK_MOVEMENT_PAGE_SIZE),
    [filtered, page]
  );

  function handleSort(key: StockMovementSortKey) {
    setPage(1);
    if (sortKey === key) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDirection(key === "createdAt" ? "desc" : "asc");
  }

  return (
    <PageContainer
      title="Stock"
      description={`Inventory movements and stock ledger at ${siteConfig.name}.`}
    >
      <StockStats stats={stats} />

      {recentMovements.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Recent Movements</h3>
          <StockMovementTable
            movements={recentMovements}
            sortKey="createdAt"
            sortDirection="desc"
            onSort={() => undefined}
          />
        </div>
      ) : null}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="relative w-full lg:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search product, barcode, reason, staff…"
            className="pl-9"
          />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <select
            value={movementType}
            onChange={(e) => {
              setMovementType(e.target.value as StockMovementTypeFilter);
              setPage(1);
            }}
            className={selectClass}
            aria-label="Movement type"
          >
            <option value="all">All movement types</option>
            {STOCK_MOVEMENT_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            value={productId}
            onChange={(e) => {
              setProductId(e.target.value);
              setPage(1);
            }}
            className={selectClass}
            aria-label="Product filter"
          >
            <option value="">All products</option>
            {productOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select
            value={stockFilter}
            onChange={(e) => {
              setStockFilter(e.target.value as StockFilter);
              setPage(1);
            }}
            className={selectClass}
            aria-label="Stock level filter"
          >
            <option value="all">All stock levels</option>
            <option value="low_stock">Low stock only</option>
            <option value="out_of_stock">Out of stock only</option>
          </select>
          <Input
            type="date"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              setPage(1);
            }}
            className="md:w-auto"
            aria-label="From date"
          />
          <Input
            type="date"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              setPage(1);
            }}
            className="md:w-auto"
            aria-label="To date"
          />
          <select
            value={sortKey}
            onChange={(e) => {
              setSortKey(e.target.value as StockMovementSortKey);
              setPage(1);
            }}
            className={selectClass}
            aria-label="Sort by"
          >
            <option value="createdAt">Date</option>
            <option value="product">Product</option>
            <option value="quantity">Quantity</option>
            <option value="movementType">Movement Type</option>
            <option value="newStock">Current Stock</option>
          </select>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setSortDirection((d) => (d === "asc" ? "desc" : "asc"))
            }
          >
            {sortDirection === "asc" ? "Ascending" : "Descending"}
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/20 px-6 py-12 text-center text-sm text-muted-foreground">
          No stock movements match your filters.
        </div>
      ) : (
        <>
          <StockMovementTable
            movements={pagination.items}
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
          <ProductCategoryPagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={filtered.length}
            pageSize={STOCK_MOVEMENT_PAGE_SIZE}
            itemLabel="movements"
            onPageChange={setPage}
          />
        </>
      )}
    </PageContainer>
  );
}
