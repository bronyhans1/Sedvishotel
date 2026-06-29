"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";

import { AddProductCategoryModal } from "@/components/product-categories/AddProductCategoryModal";
import { EditProductCategoryModal } from "@/components/product-categories/EditProductCategoryModal";
import { ProductCategoryActionDialog } from "@/components/product-categories/ProductCategoryActionDialog";
import { ProductCategoryEmptyState } from "@/components/product-categories/ProductCategoryEmptyState";
import { ProductCategoryPagination } from "@/components/product-categories/ProductCategoryPagination";
import { ProductCategoryTable } from "@/components/product-categories/ProductCategoryTable";
import { PageContainer } from "@/components/shared/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductCategoriesStats } from "@/features/product-categories/components/ProductCategoriesStats";
import {
  filterProductCategories,
  paginateProductCategories,
  PRODUCT_CATEGORY_PAGE_SIZE,
} from "@/lib/product-categories/filter-categories";
import type { ProductCategoryAccess } from "@/lib/auth/product-category-access.types";
import { siteConfig } from "@/config/site";
import type {
  ProductCategory,
  ProductCategorySortDirection,
  ProductCategorySortKey,
  ProductCategoryStats,
  ProductCategoryStatusFilter,
} from "@/types/product-category";

const selectClass =
  "h-9 w-full min-w-[140px] rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:w-auto";

type ProductCategoriesPageContentProps = {
  categories: ProductCategory[];
  stats: ProductCategoryStats;
  access: ProductCategoryAccess;
};

export function ProductCategoriesPageContent({
  categories,
  stats,
  access,
}: ProductCategoriesPageContentProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ProductCategoryStatusFilter>("all");
  const [sortKey, setSortKey] = useState<ProductCategorySortKey>("displayOrder");
  const [sortDirection, setSortDirection] =
    useState<ProductCategorySortDirection>("asc");
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<ProductCategory | null>(null);
  const [actionCategory, setActionCategory] = useState<ProductCategory | null>(
    null
  );
  const [actionMode, setActionMode] = useState<
    "archive" | "restore" | "delete" | null
  >(null);

  const nextDisplayOrder =
    categories.reduce((max, c) => Math.max(max, c.displayOrder), 0) + 1;

  const filtered = useMemo(
    () => filterProductCategories(categories, search, status, sortKey, sortDirection),
    [categories, search, status, sortKey, sortDirection]
  );

  const pagination = useMemo(
    () => paginateProductCategories(filtered, page, PRODUCT_CATEGORY_PAGE_SIZE),
    [filtered, page]
  );

  function refresh() {
    startTransition(() => router.refresh());
  }

  function handleSort(key: ProductCategorySortKey) {
    setPage(1);
    if (sortKey === key) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDirection("asc");
  }

  function openAction(
    category: ProductCategory,
    mode: "archive" | "restore" | "delete"
  ) {
    setActionCategory(category);
    setActionMode(mode);
  }

  const hasFilters = search.trim().length > 0 || status !== "all";
  const showEmpty = categories.length === 0;
  const showNoResults = !showEmpty && filtered.length === 0;

  return (
    <PageContainer
      title="Product Categories"
      description={`Organize retail inventory categories at ${siteConfig.name}.`}
      actions={
        access.canCreate ? (
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Category
          </Button>
        ) : undefined
      }
    >
      <ProductCategoriesStats stats={stats} />

      {!showEmpty ? (
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name or description…"
              className="pl-9"
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as ProductCategoryStatusFilter);
                setPage(1);
              }}
              className={selectClass}
              aria-label="Filter by status"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
            <select
              value={sortKey}
              onChange={(e) => {
                setSortKey(e.target.value as ProductCategorySortKey);
                setPage(1);
              }}
              className={selectClass}
              aria-label="Sort by"
            >
              <option value="displayOrder">Display Order</option>
              <option value="name">Name</option>
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
        <ProductCategoryEmptyState />
      ) : showNoResults ? (
        <div className="rounded-xl border border-dashed bg-muted/20 px-6 py-12 text-center text-sm text-muted-foreground">
          No categories match your search
          {hasFilters ? " and filters" : ""}.
        </div>
      ) : (
        <>
          <ProductCategoryTable
            categories={pagination.items}
            access={access}
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSort={handleSort}
            onEdit={access.canEdit ? setEditCategory : undefined}
            onArchive={
              access.canArchive
                ? (category) => openAction(category, "archive")
                : undefined
            }
            onRestore={
              access.canRestore
                ? (category) => openAction(category, "restore")
                : undefined
            }
            onDelete={
              access.canDelete
                ? (category) => openAction(category, "delete")
                : undefined
            }
          />
          <ProductCategoryPagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={filtered.length}
            pageSize={PRODUCT_CATEGORY_PAGE_SIZE}
            onPageChange={setPage}
          />
        </>
      )}

      {access.canCreate ? (
        <AddProductCategoryModal
          open={addOpen}
          onOpenChange={setAddOpen}
          nextDisplayOrder={nextDisplayOrder}
          onSuccess={refresh}
        />
      ) : null}

      {access.canEdit ? (
        <EditProductCategoryModal
          category={editCategory}
          open={!!editCategory}
          onOpenChange={(open) => !open && setEditCategory(null)}
          onSuccess={refresh}
        />
      ) : null}

      <ProductCategoryActionDialog
        category={actionCategory}
        mode={actionMode}
        open={!!actionCategory && !!actionMode}
        onOpenChange={(open) => {
          if (!open) {
            setActionCategory(null);
            setActionMode(null);
          }
        }}
        onSuccess={refresh}
      />
    </PageContainer>
  );
}
