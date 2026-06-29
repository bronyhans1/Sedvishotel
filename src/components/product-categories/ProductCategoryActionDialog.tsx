"use client";

import { useEffect, useState, useTransition } from "react";

import {
  archiveProductCategoryAction,
  deleteProductCategoryAction,
  getProductCategoryDeleteBlockersAction,
  restoreProductCategoryAction,
} from "@/features/product-categories/actions";
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
import type { ProductCategory } from "@/types/product-category";

type ProductCategoryActionDialogProps = {
  category: ProductCategory | null;
  mode: "archive" | "restore" | "delete" | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export function ProductCategoryActionDialog({
  category,
  mode,
  open,
  onOpenChange,
  onSuccess,
}: ProductCategoryActionDialogProps) {
  const toast = useToast();
  const [blockers, setBlockers] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open || !category || mode !== "delete") {
      setBlockers([]);
      return;
    }

    let cancelled = false;
    void getProductCategoryDeleteBlockersAction(category.id).then((result) => {
      if (!cancelled) setBlockers(result.blockers);
    });

    return () => {
      cancelled = true;
    };
  }, [open, category, mode]);

  function handleClose(next: boolean) {
    if (!next) {
      setError("");
      setBlockers([]);
    }
    onOpenChange(next);
  }

  function handleConfirm() {
    if (!category || !mode) return;
    setError("");

    startTransition(async () => {
      const action =
        mode === "archive"
          ? archiveProductCategoryAction
          : mode === "restore"
            ? restoreProductCategoryAction
            : deleteProductCategoryAction;

      const result = await action(category.id);
      if (!result.success) {
        setError(result.error);
        toast.error(result.error);
        return;
      }

      const messages = {
        archive: ["Category Archived", `${category.name} was archived.`],
        restore: ["Category Restored", `${category.name} is active again.`],
        delete: ["Category Deleted", `${category.name} was permanently deleted.`],
      } as const;

      const [title, description] = messages[mode];
      toast.celebrate(title, description);
      handleClose(false);
      onSuccess?.();
    });
  }

  if (!category || !mode) return null;

  const titles = {
    archive: "Archive Category",
    restore: "Restore Category",
    delete: "Delete Category Permanently",
  };

  const descriptions = {
    archive: `Archive "${category.name}"? It will be hidden from the POS catalog but can be restored later.`,
    restore: `Restore "${category.name}"? It will become active again.`,
    delete:
      blockers.length > 0
        ? `Cannot delete "${category.name}": ${blockers.join("; ")}.`
        : `Permanently delete "${category.name}"? This cannot be undone.`,
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
            disabled={mode === "delete" && blockers.length > 0}
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
