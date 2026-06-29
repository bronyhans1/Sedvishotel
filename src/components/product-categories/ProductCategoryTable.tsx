import {
  Archive,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Pencil,
  RotateCcw,
  Trash2,
} from "lucide-react";

import { ProductCategoryStatusBadge } from "@/components/product-categories/ProductCategoryStatusBadge";
import { Button } from "@/components/ui/button";
import type { ProductCategoryAccess } from "@/lib/auth/product-category-access.types";
import type {
  ProductCategory,
  ProductCategorySortDirection,
  ProductCategorySortKey,
} from "@/types/product-category";

type ProductCategoryTableProps = {
  categories: ProductCategory[];
  access: ProductCategoryAccess;
  sortKey: ProductCategorySortKey;
  sortDirection: ProductCategorySortDirection;
  onSort: (key: ProductCategorySortKey) => void;
  onEdit?: (category: ProductCategory) => void;
  onArchive?: (category: ProductCategory) => void;
  onRestore?: (category: ProductCategory) => void;
  onDelete?: (category: ProductCategory) => void;
};

function formatCreatedAt(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function SortButton({
  label,
  column,
  sortKey,
  sortDirection,
  onSort,
}: {
  label: string;
  column: ProductCategorySortKey;
  sortKey: ProductCategorySortKey;
  sortDirection: ProductCategorySortDirection;
  onSort: (key: ProductCategorySortKey) => void;
}) {
  const active = sortKey === column;
  const Icon = active
    ? sortDirection === "asc"
      ? ArrowUp
      : ArrowDown
    : ArrowUpDown;

  return (
    <button
      type="button"
      onClick={() => onSort(column)}
      className="inline-flex items-center gap-1 font-semibold hover:text-foreground"
    >
      {label}
      <Icon className={`h-3.5 w-3.5 ${active ? "text-foreground" : "opacity-50"}`} />
    </button>
  );
}

export function ProductCategoryTable({
  categories,
  access,
  sortKey,
  sortDirection,
  onSort,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
}: ProductCategoryTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3">
                <SortButton
                  label="Category"
                  column="name"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={onSort}
                />
              </th>
              <th className="px-4 py-3 font-semibold">Description</th>
              <th className="px-4 py-3 font-semibold">Products</th>
              <th className="px-4 py-3">
                <SortButton
                  label="Status"
                  column="status"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={onSort}
                />
              </th>
              <th className="px-4 py-3">
                <SortButton
                  label="Created"
                  column="createdAt"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={onSort}
                />
              </th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {categories.map((category) => (
              <tr
                key={category.id}
                className="transition-colors hover:bg-muted/30"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {category.color ? (
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full border"
                        style={{ backgroundColor: category.color }}
                        aria-hidden
                      />
                    ) : null}
                    <div>
                      <p className="font-medium">{category.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Order {category.displayOrder}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="max-w-xs truncate px-4 py-3 text-muted-foreground">
                  {category.description || "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {category.productCount}
                </td>
                <td className="px-4 py-3">
                  <ProductCategoryStatusBadge isActive={category.isActive} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatCreatedAt(category.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    {access.canEdit && onEdit ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(category)}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only sm:not-sr-only sm:ml-1">Edit</span>
                      </Button>
                    ) : null}
                    {access.canArchive && category.isActive && onArchive ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onArchive(category)}
                      >
                        <Archive className="h-4 w-4" />
                        <span className="sr-only sm:not-sr-only sm:ml-1">
                          Archive
                        </span>
                      </Button>
                    ) : null}
                    {access.canRestore && !category.isActive && onRestore ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRestore(category)}
                      >
                        <RotateCcw className="h-4 w-4" />
                        <span className="sr-only sm:not-sr-only sm:ml-1">
                          Restore
                        </span>
                      </Button>
                    ) : null}
                    {access.canDelete && onDelete ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => onDelete(category)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only sm:not-sr-only sm:ml-1">
                          Delete
                        </span>
                      </Button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
