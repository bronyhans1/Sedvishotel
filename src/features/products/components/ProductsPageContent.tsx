"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";

import { AddProductModal } from "@/components/products/AddProductModal";
import { EditProductModal } from "@/components/products/EditProductModal";
import { ProductActionDialog } from "@/components/products/ProductActionDialog";
import { ProductStockActionsDialog } from "@/components/inventory/ProductStockActionsDialog";
import { ProductStockModal } from "@/components/inventory/ProductStockModal";
import type { ProductStockMode } from "@/components/inventory/ProductStockModal";
import { ProductCategoryPagination } from "@/components/product-categories/ProductCategoryPagination";
import { ProductTable } from "@/components/products/ProductTable";
import { ProductsEmptyState } from "@/components/products/ProductsEmptyState";
import { PageContainer } from "@/components/shared/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductsStats } from "@/features/products/components/ProductsStats";
import {
  filterProducts,
  paginateProducts,
  PRODUCT_PAGE_SIZE,
} from "@/lib/products/filter-products";
import type { ProductAccess } from "@/lib/auth/product-access.types";
import type { InventoryAccess } from "@/lib/auth/inventory-access.types";
import { siteConfig } from "@/config/site";
import {
  PRODUCT_STATUS_OPTIONS,
  type Product,
  type ProductCategoryOption,
  type ProductSortDirection,
  type ProductSortKey,
  type ProductStats,
  type ProductStatusFilter,
} from "@/types/product";

const selectClass =
  "h-9 w-full min-w-[140px] rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:w-auto";

type ProductsPageContentProps = {
  products: Product[];
  stats: ProductStats;
  access: ProductAccess;
  inventoryAccess: InventoryAccess;
  categoryOptions: ProductCategoryOption[];
};

export function ProductsPageContent({
  products,
  stats,
  access,
  inventoryAccess,
  categoryOptions,
}: ProductsPageContentProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState<ProductStatusFilter>("all");
  const [sortKey, setSortKey] = useState<ProductSortKey>("name");
  const [sortDirection, setSortDirection] =
    useState<ProductSortDirection>("asc");
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [actionProduct, setActionProduct] = useState<Product | null>(null);
  const [actionMode, setActionMode] = useState<
    "archive" | "restore" | "delete" | null
  >(null);
  const [stockProduct, setStockProduct] = useState<Product | null>(null);
  const [stockActionsOpen, setStockActionsOpen] = useState(false);
  const [stockMode, setStockMode] = useState<ProductStockMode | null>(null);

  const filtered = useMemo(
    () =>
      filterProducts(
        products,
        search,
        categoryId,
        status,
        sortKey,
        sortDirection
      ),
    [products, search, categoryId, status, sortKey, sortDirection]
  );

  const pagination = useMemo(
    () => paginateProducts(filtered, page, PRODUCT_PAGE_SIZE),
    [filtered, page]
  );

  function refresh() {
    startTransition(() => router.refresh());
  }

  function handleSort(key: ProductSortKey) {
    setPage(1);
    if (sortKey === key) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDirection("asc");
  }

  function openAction(product: Product, mode: "archive" | "restore" | "delete") {
    setActionProduct(product);
    setActionMode(mode);
  }

  const hasFilters =
    search.trim().length > 0 || categoryId !== "" || status !== "all";
  const showEmpty = products.length === 0;
  const showNoResults = !showEmpty && filtered.length === 0;

  return (
    <PageContainer
      title="Products"
      description={`Manage the retail product catalog at ${siteConfig.name}.`}
      actions={
        access.canCreate ? (
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        ) : undefined
      }
    >
      <ProductsStats stats={stats} />

      {!showEmpty ? (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search name, barcode, SKU, category…"
              className="pl-9"
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setPage(1);
              }}
              className={selectClass}
              aria-label="Filter by category"
            >
              <option value="">All categories</option>
              {categoryOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as ProductStatusFilter);
                setPage(1);
              }}
              className={selectClass}
              aria-label="Filter by status"
            >
              <option value="all">All statuses</option>
              {PRODUCT_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <select
              value={sortKey}
              onChange={(e) => {
                setSortKey(e.target.value as ProductSortKey);
                setPage(1);
              }}
              className={selectClass}
              aria-label="Sort by"
            >
              <option value="name">Product Name</option>
              <option value="category">Category</option>
              <option value="sellingPrice">Selling Price</option>
              <option value="currentStock">Stock</option>
              <option value="createdAt">Created Date</option>
              <option value="status">Status</option>
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
      ) : null}

      {showEmpty ? (
        <ProductsEmptyState />
      ) : showNoResults ? (
        <div className="rounded-xl border border-dashed bg-muted/20 px-6 py-12 text-center text-sm text-muted-foreground">
          No products match your search{hasFilters ? " and filters" : ""}.
        </div>
      ) : (
        <>
          <ProductTable
            products={pagination.items}
            access={access}
            inventoryAccess={inventoryAccess}
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSort={handleSort}
            onEdit={access.canEdit ? setEditProduct : undefined}
            onOpenStockActions={
              inventoryAccess.canCreate
                ? (product) => {
                    setStockProduct(product);
                    setStockActionsOpen(true);
                  }
                : undefined
            }
            onArchive={
              access.canArchive
                ? (product) => openAction(product, "archive")
                : undefined
            }
            onRestore={
              access.canRestore
                ? (product) => openAction(product, "restore")
                : undefined
            }
            onDelete={
              access.canDelete
                ? (product) => openAction(product, "delete")
                : undefined
            }
          />
          <ProductCategoryPagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={filtered.length}
            pageSize={PRODUCT_PAGE_SIZE}
            itemLabel="products"
            onPageChange={setPage}
          />
        </>
      )}

      {access.canCreate ? (
        <AddProductModal
          open={addOpen}
          onOpenChange={setAddOpen}
          categories={categoryOptions}
          onSuccess={refresh}
        />
      ) : null}

      {access.canEdit ? (
        <EditProductModal
          product={editProduct}
          open={!!editProduct}
          onOpenChange={(open) => !open && setEditProduct(null)}
          categories={categoryOptions}
          onSuccess={refresh}
        />
      ) : null}

      <ProductActionDialog
        product={actionProduct}
        mode={actionMode}
        open={!!actionProduct && !!actionMode}
        onOpenChange={(open) => {
          if (!open) {
            setActionProduct(null);
            setActionMode(null);
          }
        }}
        onSuccess={refresh}
      />

      {inventoryAccess.canCreate ? (
        <>
          <ProductStockActionsDialog
            product={stockProduct}
            open={stockActionsOpen}
            onOpenChange={setStockActionsOpen}
            canAdjust={inventoryAccess.canEdit}
            onSelect={(mode) => {
              setStockMode(mode);
            }}
          />
          <ProductStockModal
            product={stockProduct}
            mode={stockMode}
            open={!!stockProduct && !!stockMode}
            onOpenChange={(open) => {
              if (!open) {
                setStockMode(null);
                setStockProduct(null);
              }
            }}
            onSuccess={refresh}
          />
        </>
      ) : null}
    </PageContainer>
  );
}
