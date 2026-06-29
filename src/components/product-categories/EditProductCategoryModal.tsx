"use client";

import { useEffect, useState, useTransition } from "react";

import { updateProductCategoryAction } from "@/features/product-categories/actions";
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
import type { ProductCategory, ProductCategoryFormValues } from "@/types/product-category";

type EditProductCategoryModalProps = {
  category: ProductCategory | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function toFormValues(category: ProductCategory): ProductCategoryFormValues {
  return {
    name: category.name,
    description: category.description,
    displayOrder: category.displayOrder,
    isActive: category.isActive,
    color: category.color ?? "",
    icon: category.icon ?? "",
  };
}

export function EditProductCategoryModal({
  category,
  open,
  onOpenChange,
  onSuccess,
}: EditProductCategoryModalProps) {
  const toast = useToast();
  const refresh = useLiveRefresh();
  const [values, setValues] = useState<ProductCategoryFormValues | null>(null);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [submitError, setSubmitError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (category && open) {
      setValues(toFormValues(category));
      setErrors({});
      setSubmitError("");
    }
  }, [category, open]);

  function handleClose(next: boolean) {
    if (!next) {
      setValues(null);
      setErrors({});
      setSubmitError("");
    }
    onOpenChange(next);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!category || !values) return;

    const next: Partial<Record<string, string>> = {};
    if (!values.name.trim()) next.name = "Category name is required";
    if (values.displayOrder < 0) next.displayOrder = "Display order cannot be negative";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitError("");
    startTransition(async () => {
      const result = await updateProductCategoryAction(category.id, values);
      if (!result.success) {
        setSubmitError(result.error);
        toast.error(result.error);
        return;
      }
      handleClose(false);
      toast.celebrate("Category Updated", `"${values.name.trim()}" saved.`);
      refresh();
      onSuccess?.();
    });
  }

  if (!values) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Product Category</DialogTitle>
          <DialogDescription>
            Update category details. Slug is generated automatically and kept stable.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {submitError ? (
            <p className="text-sm text-destructive" role="alert">
              {submitError}
            </p>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="epc-name">Category Name</Label>
            <Input
              id="epc-name"
              value={values.name}
              onChange={(e) => setValues((v) => v && { ...v, name: e.target.value })}
            />
            {errors.name ? (
              <p className="text-xs text-destructive">{errors.name}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="epc-desc">Description</Label>
            <Textarea
              id="epc-desc"
              value={values.description}
              onChange={(e) =>
                setValues((v) => v && { ...v, description: e.target.value })
              }
              rows={2}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="epc-order">Display Order</Label>
              <Input
                id="epc-order"
                type="number"
                min={0}
                value={values.displayOrder}
                onChange={(e) =>
                  setValues((v) =>
                    v
                      ? {
                          ...v,
                          displayOrder: Number(e.target.value) || 0,
                        }
                      : v
                  )
                }
              />
              {errors.displayOrder ? (
                <p className="text-xs text-destructive">{errors.displayOrder}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="epc-status">Status</Label>
              <select
                id="epc-status"
                value={values.isActive ? "active" : "archived"}
                onChange={(e) =>
                  setValues((v) =>
                    v
                      ? { ...v, isActive: e.target.value === "active" }
                      : v
                  )
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
              <Label htmlFor="epc-icon">Icon (optional)</Label>
              <Input
                id="epc-icon"
                placeholder="e.g. cup-soda"
                value={values.icon}
                onChange={(e) =>
                  setValues((v) => v && { ...v, icon: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="epc-color">Color (optional)</Label>
              <Input
                id="epc-color"
                placeholder="#3B82F6"
                value={values.color}
                onChange={(e) =>
                  setValues((v) => v && { ...v, color: e.target.value })
                }
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
            <SubmitButton loading={isPending} loadingLabel="Saving…">
              Save Changes
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
