"use client";

import { useState, useTransition } from "react";

import {
  buildInitialProductForm,
  ProductFormFields,
  validateProductForm,
} from "@/components/products/ProductFormFields";
import {
  createProductAction,
  uploadProductImageAction,
} from "@/features/products/actions";
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
import type { ProductCategoryOption } from "@/types/product";

type AddProductModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: ProductCategoryOption[];
  onSuccess?: () => void;
};

export function AddProductModal({
  open,
  onOpenChange,
  categories,
  onSuccess,
}: AddProductModalProps) {
  const toast = useToast();
  const refresh = useLiveRefresh();
  const [values, setValues] = useState(buildInitialProductForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [submitError, setSubmitError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleClose(next: boolean) {
    if (!next) {
      setValues(buildInitialProductForm());
      setImageFile(null);
      setErrors({});
      setSubmitError("");
    }
    onOpenChange(next);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next = validateProductForm(values);
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitError("");
    startTransition(async () => {
      const result = await createProductAction(values);
      if (!result.success) {
        setSubmitError(result.error);
        toast.error(result.error);
        return;
      }

      if (imageFile && result.productId) {
        const formData = new FormData();
        formData.set("image", imageFile);
        const upload = await uploadProductImageAction(result.productId, formData);
        if (!upload.success) {
          toast.error(upload.error);
        }
      }

      handleClose(false);
      toast.celebrate("Product Created", `"${values.name.trim()}" added.`);
      refresh();
      onSuccess?.();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Product</DialogTitle>
          <DialogDescription>
            Create a catalog item. Barcode and SKU are generated if left blank.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {submitError ? (
            <p className="text-sm text-destructive" role="alert">
              {submitError}
            </p>
          ) : null}

          <ProductFormFields
            values={values}
            categories={categories}
            errors={errors}
            onChange={setValues}
            idPrefix="add-product"
          />

          <div className="space-y-2">
            <Label htmlFor="add-product-image">Image (optional)</Label>
            <Input
              id="add-product-image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
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
            <SubmitButton loading={isPending} loadingLabel="Creating…">
              Create Product
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
