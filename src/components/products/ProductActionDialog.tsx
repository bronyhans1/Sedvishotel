"use client";

import { useState, useTransition } from "react";

import {
  archiveProductAction,
  deleteProductAction,
  restoreProductAction,
} from "@/features/products/actions";
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
import type { Product } from "@/types/product";

type ProductActionDialogProps = {
  product: Product | null;
  mode: "archive" | "restore" | "delete" | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export function ProductActionDialog({
  product,
  mode,
  open,
  onOpenChange,
  onSuccess,
}: ProductActionDialogProps) {
  const toast = useToast();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleClose(next: boolean) {
    if (!next) setError("");
    onOpenChange(next);
  }

  function handleConfirm() {
    if (!product || !mode) return;
    setError("");

    startTransition(async () => {
      const action =
        mode === "archive"
          ? archiveProductAction
          : mode === "restore"
            ? restoreProductAction
            : deleteProductAction;

      const result = await action(product.id);
      if (!result.success) {
        setError(result.error);
        toast.error(result.error);
        return;
      }

      const messages = {
        archive: ["Product Archived", `${product.name} was archived.`],
        restore: ["Product Restored", `${product.name} is active again.`],
        delete: ["Product Deleted", `${product.name} was permanently deleted.`],
      } as const;

      const [title, description] = messages[mode];
      toast.celebrate(title, description);
      handleClose(false);
      onSuccess?.();
    });
  }

  if (!product || !mode) return null;

  const titles = {
    archive: "Archive Product",
    restore: "Restore Product",
    delete: "Delete Product Permanently",
  };

  const descriptions = {
    archive: `Archive "${product.name}"? It will be hidden from active catalog views.`,
    restore: `Restore "${product.name}"?`,
    delete: `Permanently delete "${product.name}"? This cannot be undone.`,
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{titles[mode]}</DialogTitle>
          <DialogDescription>{descriptions[mode]}</DialogDescription>
        </DialogHeader>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <SubmitButton
            type="button"
            loading={isPending}
            loadingLabel="Working…"
            variant={mode === "delete" ? "destructive" : "default"}
            onClick={handleConfirm}
          >
            {mode === "archive"
              ? "Archive"
              : mode === "restore"
                ? "Restore"
                : "Delete Permanently"}
          </SubmitButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
