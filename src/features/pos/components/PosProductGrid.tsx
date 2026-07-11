"use client";

import { ProductImageThumbnail } from "@/components/products/ProductImageThumbnail";
import { formatCurrency } from "@/lib/utils";
import { isProductOutOfStock } from "@/lib/pos/settlement";
import type { Product } from "@/types/product";

type PosProductGridProps = {
  products: Product[];
  onAdd: (product: Product) => void;
};

function formatStockUnitLabel(unit: string): string {
  if (!unit) return "";
  return unit.charAt(0).toUpperCase() + unit.slice(1);
}

function PosProductStockDisplay({
  stock,
  unit,
  outOfStock,
}: {
  stock: number;
  unit: string;
  outOfStock: boolean;
}) {
  const unitLabel = formatStockUnitLabel(unit);

  if (outOfStock) {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-1.5">
          <span
            className="h-2 w-2 shrink-0 rounded-full bg-destructive"
            aria-hidden
          />
          <span className="whitespace-nowrap text-xs font-medium text-destructive">
            Out of Stock
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        <span
          className="h-2 w-2 shrink-0 rounded-full bg-emerald-500"
          aria-hidden
        />
        <span className="whitespace-nowrap text-xs font-medium text-muted-foreground">
          In Stock
        </span>
      </div>
      <p className="text-base font-semibold leading-tight tabular-nums text-foreground">
        {stock}
        {unitLabel ? ` ${unitLabel}` : ""}
      </p>
    </div>
  );
}

export function PosProductGrid({ products, onAdd }: PosProductGridProps) {
  if (!products.length) {
    return (
      <div className="flex h-full min-h-[320px] items-center justify-center rounded-xl border border-dashed bg-muted/20 p-8 text-sm text-muted-foreground">
        No products match your search.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {products.map((product) => {
        const outOfStock = isProductOutOfStock(product);
        return (
          <button
            key={product.id}
            type="button"
            disabled={outOfStock}
            onClick={() => onAdd(product)}
            className="flex min-w-0 flex-col overflow-hidden rounded-xl border bg-card p-3 text-left shadow-sm transition hover:border-primary/40 hover:shadow disabled:cursor-not-allowed disabled:opacity-60"
          >
            <div className="mb-3 flex justify-center">
              <ProductImageThumbnail
                imageUrl={product.imageUrl}
                name={product.name}
                className="h-16 w-16 shrink-0"
              />
            </div>

            <p className="line-clamp-2 text-sm font-medium leading-snug">
              {product.name}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {product.categoryName}
            </p>

            <div className="mt-2 mb-3 min-w-0">
              <PosProductStockDisplay
                stock={product.currentStock}
                unit={product.unit}
                outOfStock={outOfStock}
              />
            </div>

            <p className="mt-auto text-lg font-bold tracking-tight text-primary">
              {formatCurrency(product.sellingPrice)}
            </p>
          </button>
        );
      })}
    </div>
  );
}
