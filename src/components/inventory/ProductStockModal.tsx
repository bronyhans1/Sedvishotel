"use client";

import { useEffect, useState, useTransition } from "react";

import {
  adjustStockAction,
  openingBalanceAction,
  stockInAction,
  stockOutAction,
} from "@/features/inventory/actions";
import { useLiveRefresh } from "@/hooks/use-live-refresh";
import { useToast } from "@/hooks/use-toast";
import { SubmitButton } from "@/components/loading/SubmitButton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  STOCK_REASON_TEMPLATES,
  validateStockReason,
} from "@/lib/inventory/reason-templates";
import type { Product } from "@/types/product";

export type ProductStockMode =
  | "opening_balance"
  | "stock_in"
  | "stock_out"
  | "adjustment";

type ProductStockModalProps = {
  product: Product | null;
  mode: ProductStockMode | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const TITLES: Record<ProductStockMode, string> = {
  opening_balance: "Opening Balance",
  stock_in: "Stock In",
  stock_out: "Stock Out",
  adjustment: "Stock Adjustment",
};

export function ProductStockModal({
  product,
  mode,
  open,
  onOpenChange,
  onSuccess,
}: ProductStockModalProps) {
  const toast = useToast();
  const refresh = useLiveRefresh();
  const [quantity, setQuantity] = useState("");
  const [physicalCount, setPhysicalCount] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open && product && mode) {
      setQuantity("");
      setPhysicalCount(String(product.currentStock));
      setReason(
        mode === "adjustment"
          ? "Physical Count"
          : mode === "opening_balance"
            ? "Opening Balance"
            : mode === "stock_in"
              ? "Purchase"
              : "Stock Out"
      );
      setNotes("");
      setError("");
    }
  }, [open, product, mode]);

  function handleClose(next: boolean) {
    if (!next) {
      setError("");
    }
    onOpenChange(next);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!product || !mode) return;
    setError("");

    startTransition(async () => {
      const reasonError = validateStockReason(reason, notes);
      if (reasonError) {
        setError(reasonError);
        return;
      }

      let result;
      if (mode === "opening_balance") {
        const qty = Number(quantity);
        if (!qty || qty < 0) {
          setError("Enter a valid opening balance quantity.");
          return;
        }
        result = await openingBalanceAction({
          productId: product.id,
          quantity: qty,
          reason: reason.trim() || undefined,
          notes: notes.trim() || undefined,
        });
      } else if (mode === "stock_in") {
        const qty = Number(quantity);
        if (!qty || qty <= 0) {
          setError("Stock in quantity must be greater than zero.");
          return;
        }
        result = await stockInAction({
          productId: product.id,
          quantity: qty,
          reason: reason.trim() || undefined,
          notes: notes.trim() || undefined,
        });
      } else if (mode === "stock_out") {
        const qty = Number(quantity);
        if (!qty || qty <= 0) {
          setError("Stock out quantity must be greater than zero.");
          return;
        }
        result = await stockOutAction({
          productId: product.id,
          quantity: qty,
          reason: reason.trim() || undefined,
          notes: notes.trim() || undefined,
        });
      } else {
        const count = Number(physicalCount);
        if (Number.isNaN(count) || count < 0) {
          setError("Enter a valid physical count.");
          return;
        }
        result = await adjustStockAction({
          productId: product.id,
          physicalCount: count,
          reason: reason.trim() || undefined,
          notes: notes.trim() || undefined,
        });
      }

      if (!result.success) {
        setError(result.error);
        toast.error(result.error);
        return;
      }

      handleClose(false);
      toast.celebrate("Stock Updated", `${product.name} inventory updated.`);
      refresh();
      onSuccess?.();
    });
  }

  if (!product || !mode) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{TITLES[mode]}</DialogTitle>
          <DialogDescription>
            {product.name} · Current stock: {product.currentStock} {product.unit}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          {mode === "adjustment" ? (
            <div className="space-y-2">
              <Label htmlFor="physical-count">Physical Count</Label>
              <Input
                id="physical-count"
                type="number"
                min={0}
                step="0.001"
                value={physicalCount}
                onChange={(e) => setPhysicalCount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                System stock: {product.currentStock}. Adjustment records the
                difference as a movement.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="stock-qty">
                {mode === "opening_balance" ? "Opening Balance Quantity" : "Quantity"}
              </Label>
              <Input
                id="stock-qty"
                type="number"
                min={0}
                step="0.001"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="stock-reason">Reason</Label>
            {mode === "opening_balance" ? (
              <Input
                id="stock-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            ) : (
              <select
                id="stock-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className={selectClass}
              >
                {STOCK_REASON_TEMPLATES.map((template) => (
                  <option key={template} value={template}>
                    {template}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="stock-notes">Notes</Label>
            <Textarea
              id="stock-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <SubmitButton loading={isPending} loadingLabel="Saving…">
              Record Movement
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
