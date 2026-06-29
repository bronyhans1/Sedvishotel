"use client";

import { useState, useTransition } from "react";

import { createProductCategoryAction } from "@/features/product-categories/actions";
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
import type { ProductCategoryFormValues } from "@/types/product-category";

type AddProductCategoryModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nextDisplayOrder: number;
  onSuccess?: () => void;
};

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function buildInitial(displayOrder: number): ProductCategoryFormValues {
  return {
    name: "",
    description: "",
    displayOrder,
    isActive: true,
    color: "",
    icon: "",
  };
}

export function AddProductCategoryModal({
  open,
  onOpenChange,
  nextDisplayOrder,
  onSuccess,
}: AddProductCategoryModalProps) {
  const toast = useToast();
  const refresh = useLiveRefresh();
  const [values, setValues] = useState(() => buildInitial(nextDisplayOrder));
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [submitError, setSubmitError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleClose(next: boolean) {
    if (!next) {
      setValues(buildInitial(nextDisplayOrder));
      setErrors({});
      setSubmitError("");
    }
    onOpenChange(next);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: Partial<Record<string, string>> = {};
    if (!values.name.trim()) next.name = "Category name is required";
    if (values.displayOrder < 0) next.displayOrder = "Display order cannot be negative";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitError("");
    startTransition(async () => {
      const result = await createProductCategoryAction(values);
      if (!result.success) {
        setSubmitError(result.error);
        toast.error(result.error);
        return;
      }
      handleClose(false);
      toast.celebrate("Category Created", `"${values.name.trim()}" added.`);
      refresh();
      onSuccess?.();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Product Category</DialogTitle>
          <DialogDescription>
            Organize retail products into categories for the POS catalog.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {submitError ? (
            <p className="text-sm text-destructive" role="alert">
              {submitError}
            </p>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="pc-name">Category Name</Label>
            <Input
              id="pc-name"
              value={values.name}
              onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
            />
            {errors.name ? (
              <p className="text-xs text-destructive">{errors.name}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="pc-desc">Description</Label>
            <Textarea
              id="pc-desc"
              value={values.description}
              onChange={(e) =>
                setValues((v) => ({ ...v, description: e.target.value }))
              }
              rows={2}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pc-order">Display Order</Label>
              <Input
                id="pc-order"
                type="number"
                min={0}
                value={values.displayOrder}
                onChange={(e) =>
                  setValues((v) => ({
                    ...v,
                    displayOrder: Number(e.target.value) || 0,
                  }))
                }
              />
              {errors.displayOrder ? (
                <p className="text-xs text-destructive">{errors.displayOrder}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="pc-status">Status</Label>
              <select
                id="pc-status"
                value={values.isActive ? "active" : "archived"}
                onChange={(e) =>
                  setValues((v) => ({
                    ...v,
                    isActive: e.target.value === "active",
                  }))
                }
                className={selectClass}
              >
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pc-icon">Icon (optional)</Label>
              <Input
                id="pc-icon"
                placeholder="e.g. cup-soda"
                value={values.icon}
                onChange={(e) => setValues((v) => ({ ...v, icon: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pc-color">Color (optional)</Label>
              <Input
                id="pc-color"
                placeholder="#3B82F6"
                value={values.color}
                onChange={(e) => setValues((v) => ({ ...v, color: e.target.value }))}
              />
            </div>
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
            <SubmitButton loading={isPending} loadingLabel="Creating…">
              Create Category
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
