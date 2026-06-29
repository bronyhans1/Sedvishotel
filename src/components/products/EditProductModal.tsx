"use client";

import { useEffect, useState, useTransition } from "react";

import {
  ProductFormFields,
  validateProductForm,
} from "@/components/products/ProductFormFields";
import {
  updateProductAction,
  uploadProductImageAction,
  removeProductImageAction,
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
import { ProductImageThumbnail } from "@/components/products/ProductImageThumbnail";
import type { Product, ProductCategoryOption, ProductFormValues } from "@/types/product";

type EditProductModalProps = {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: ProductCategoryOption[];
  onSuccess?: () => void;
};

function toFormValues(product: Product): ProductFormValues {
  return {
    categoryId: product.categoryId,
    name: product.name,
    description: product.description,
    sellingPrice: product.sellingPrice,
    costPrice: product.costPrice ?? 0,
    minimumStock: product.minimumStock,
    unit: product.unit,
    barcode: product.barcode,
    sku: product.sku,
    vatApplicable: product.vatApplicable,
    availableForSale: product.availableForSale,
    status: product.status,
  };
}

export function EditProductModal({
  product,
  open,
  onOpenChange,
  categories,
  onSuccess,
}: EditProductModalProps) {
  const toast = useToast();
  const refresh = useLiveRefresh();
  const [values, setValues] = useState<ProductFormValues | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [submitError, setSubmitError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (product && open) {
      setValues(toFormValues(product));
      setImageFile(null);
      setErrors({});
      setSubmitError("");
    }
  }, [product, open]);

  function handleClose(next: boolean) {
    if (!next) {
      setValues(null);
      setImageFile(null);
      setErrors({});
      setSubmitError("");
    }
    onOpenChange(next);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!product || !values) return;

    const next = validateProductForm(values);
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitError("");
    startTransition(async () => {
      const result = await updateProductAction(product.id, values);
      if (!result.success) {
        setSubmitError(result.error);
        toast.error(result.error);
        return;
      }

      if (imageFile) {
        const formData = new FormData();
        formData.set("image", imageFile);
        const upload = await uploadProductImageAction(product.id, formData);
        if (!upload.success) {
          toast.error(upload.error);
        }
      }

      handleClose(false);
      toast.celebrate("Product Updated", `"${values.name.trim()}" saved.`);
      refresh();
      onSuccess?.();
    });
  }

  function handleRemoveImage() {
    if (!product) return;
    startTransition(async () => {
      const result = await removeProductImageAction(product.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Product image removed.");
      refresh();
      onSuccess?.();
    });
  }

  if (!values || !product) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>Update catalog details for {product.name}.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {submitError ? (
            <p className="text-sm text-destructive" role="alert">
              {submitError}
            </p>
          ) : null}

          <div className="flex items-center gap-3">
            <ProductImageThumbnail
              imageUrl={product.imageUrl}
              name={product.name}
              className="h-14 w-14"
            />
            <div className="space-y-2">
              <Label htmlFor="edit-product-image">Replace image</Label>
              <Input
                id="edit-product-image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              />
              {product.imageUrl ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-auto px-0 text-destructive"
                  onClick={handleRemoveImage}
                  disabled={isPending}
                >
                  Remove image
                </Button>
              ) : null}
            </div>
          </div>

          <ProductFormFields
            values={values}
            categories={categories}
            errors={errors}
            onChange={setValues}
            idPrefix="edit-product"
          />

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
