import {
  Archive,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Boxes,
  Pencil,
  RotateCcw,
  Trash2,
} from "lucide-react";

import { LowStockBadge } from "@/components/inventory/stock-display";
import { ProductImageThumbnail } from "@/components/products/ProductImageThumbnail";
import { ProductStatusBadge } from "@/components/products/ProductStatusBadge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { isLowStock } from "@/lib/inventory/low-stock";
import type { ProductAccess } from "@/lib/auth/product-access.types";
import type { InventoryAccess } from "@/lib/auth/inventory-access.types";
import type {
  Product,
  ProductSortDirection,
  ProductSortKey,
} from "@/types/product";

type ProductTableProps = {
  products: Product[];
  access: ProductAccess;
  inventoryAccess?: InventoryAccess;
  sortKey: ProductSortKey;
  sortDirection: ProductSortDirection;
  onSort: (key: ProductSortKey) => void;
  onEdit?: (product: Product) => void;
  onArchive?: (product: Product) => void;
  onRestore?: (product: Product) => void;
  onDelete?: (product: Product) => void;
  onOpenStockActions?: (product: Product) => void;
};

function SortButton({
  label,
  column,
  sortKey,
  sortDirection,
  onSort,
}: {
  label: string;
  column: ProductSortKey;
  sortKey: ProductSortKey;
  sortDirection: ProductSortDirection;
  onSort: (key: ProductSortKey) => void;
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

export function ProductTable({
  products,
  access,
  inventoryAccess,
  sortKey,
  sortDirection,
  onSort,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
  onOpenStockActions,
}: ProductTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 font-semibold">Image</th>
              <th className="px-4 py-3">
                <SortButton
                  label="Product"
                  column="name"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={onSort}
                />
              </th>
              <th className="px-4 py-3">
                <SortButton
                  label="Category"
                  column="category"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={onSort}
                />
              </th>
              <th className="px-4 py-3 font-semibold">Barcode</th>
              <th className="px-4 py-3 font-semibold">SKU</th>
              <th className="px-4 py-3">
                <SortButton
                  label="Selling Price"
                  column="sellingPrice"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={onSort}
                />
              </th>
              <th className="px-4 py-3">
                <SortButton
                  label="Current Stock"
                  column="currentStock"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={onSort}
                />
              </th>
              <th className="px-4 py-3">
                <SortButton
                  label="Status"
                  column="status"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={onSort}
                />
              </th>
              <th className="px-4 py-3 font-semibold">VAT</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {products.map((product) => (
              <tr key={product.id} className="transition-colors hover:bg-muted/30">
                <td className="px-4 py-3">
                  <ProductImageThumbnail
                    imageUrl={product.imageUrl}
                    name={product.name}
                  />
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium">{product.name}</p>
                  {!product.availableForSale ? (
                    <p className="text-xs text-muted-foreground">Not for sale</p>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {product.categoryName}
                </td>
                <td className="px-4 py-3 font-mono text-xs">{product.barcode}</td>
                <td className="px-4 py-3 font-mono text-xs">{product.sku}</td>
                <td className="px-4 py-3">{formatCurrency(product.sellingPrice)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span>{product.currentStock}</span>
                    {isLowStock(product) ? <LowStockBadge /> : null}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <ProductStatusBadge
                    status={product.status}
                    isActive={product.isActive}
                  />
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {product.vatApplicable ? "Yes" : "No"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    {inventoryAccess?.canCreate && onOpenStockActions ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onOpenStockActions(product)}
                        title="Stock actions"
                      >
                        <Boxes className="h-4 w-4" />
                        <span className="sr-only sm:not-sr-only sm:ml-1">Stock</span>
                      </Button>
                    ) : null}
                    {access.canEdit && onEdit ? (
                      <Button variant="ghost" size="sm" onClick={() => onEdit(product)}>
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only sm:not-sr-only sm:ml-1">Edit</span>
                      </Button>
                    ) : null}
                    {access.canArchive && product.isActive && onArchive ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onArchive(product)}
                      >
                        <Archive className="h-4 w-4" />
                        <span className="sr-only sm:not-sr-only sm:ml-1">Archive</span>
                      </Button>
                    ) : null}
                    {access.canRestore && !product.isActive && onRestore ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRestore(product)}
                      >
                        <RotateCcw className="h-4 w-4" />
                        <span className="sr-only sm:not-sr-only sm:ml-1">Restore</span>
                      </Button>
                    ) : null}
                    {access.canDelete && onDelete ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => onDelete(product)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only sm:not-sr-only sm:ml-1">Delete</span>
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
