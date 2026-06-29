"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ProductStockMode } from "@/components/inventory/ProductStockModal";
import type { Product } from "@/types/product";

type ProductStockActionsDialogProps = {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (mode: ProductStockMode) => void;
  canAdjust?: boolean;
};

export function ProductStockActionsDialog({
  product,
  open,
  onOpenChange,
  onSelect,
  canAdjust = false,
}: ProductStockActionsDialogProps) {
  if (!product) return null;

  const actions: { mode: ProductStockMode; label: string; requiresEdit?: boolean }[] =
    [
      { mode: "opening_balance", label: "Opening Balance" },
      { mode: "stock_in", label: "Stock In" },
      { mode: "stock_out", label: "Stock Out" },
      { mode: "adjustment", label: "Adjust Stock (Physical Count)", requiresEdit: true },
    ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Stock Actions</DialogTitle>
          <DialogDescription>
            {product.name} · Current stock: {product.currentStock} {product.unit}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          {actions.map((action) => {
            const disabled = action.requiresEdit && !canAdjust;
            return (
              <Button
                key={action.mode}
                type="button"
                variant="outline"
                className="justify-start"
                disabled={disabled}
                onClick={() => {
                  onSelect(action.mode);
                  onOpenChange(false);
                }}
              >
                {action.label}
              </Button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
