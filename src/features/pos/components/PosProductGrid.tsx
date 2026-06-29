"use client";

import { ProductImageThumbnail } from "@/components/products/ProductImageThumbnail";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { isProductOutOfStock } from "@/lib/pos/settlement";
import type { Product } from "@/types/product";

type PosProductGridProps = {
  products: Product[];
  onAdd: (product: Product) => void;
};

export function PosProductGrid({ products, onAdd }: PosProductGridProps) {
  if (!products.length) {
    return (
      <div className="flex h-full min-h-[320px] items-center justify-center rounded-xl border border-dashed bg-muted/20 p-8 text-sm text-muted-foreground">
        No products match your search.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {products.map((product) => {
        const outOfStock = isProductOutOfStock(product);
        return (
          <button
            key={product.id}
            type="button"
            disabled={outOfStock}
            onClick={() => onAdd(product)}
            className="flex flex-col rounded-xl border bg-card p-3 text-left shadow-sm transition hover:border-primary/40 hover:shadow disabled:cursor-not-allowed disabled:opacity-60"
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <ProductImageThumbnail
                imageUrl={product.imageUrl}
                name={product.name}
                className="h-16 w-16 shrink-0"
              />
              {outOfStock ? (
                <Badge variant="destructive">Out of Stock</Badge>
              ) : (
                <Badge variant="outline">{product.currentStock} {product.unit}</Badge>
              )}
            </div>
            <p className="line-clamp-2 text-sm font-medium">{product.name}</p>
            <p className="text-xs text-muted-foreground">{product.categoryName}</p>
            <p className="mt-2 text-base font-semibold text-primary">
              {formatCurrency(product.sellingPrice)}
            </p>
          </button>
        );
      })}
    </div>
  );
}
