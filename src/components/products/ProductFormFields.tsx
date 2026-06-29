"use client";

import type { ProductFormValues, ProductCategoryOption } from "@/types/product";
import { PRODUCT_STATUS_OPTIONS, PRODUCT_UNIT_OPTIONS } from "@/types/product";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

type ProductFormFieldsProps = {
  values: ProductFormValues;
  categories: ProductCategoryOption[];
  errors: Partial<Record<string, string>>;
  onChange: (values: ProductFormValues) => void;
  idPrefix?: string;
};

export function ProductFormFields({
  values,
  categories,
  errors,
  onChange,
  idPrefix = "product",
}: ProductFormFieldsProps) {
  function patch(partial: Partial<ProductFormValues>) {
    onChange({ ...values, ...partial });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-category`}>Category</Label>
        <select
          id={`${idPrefix}-category`}
          required
          value={values.categoryId}
          onChange={(e) => patch({ categoryId: e.target.value })}
          className={selectClass}
        >
          <option value="">Select category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {errors.categoryId ? (
          <p className="text-xs text-destructive">{errors.categoryId}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-name`}>Product Name</Label>
        <Input
          id={`${idPrefix}-name`}
          value={values.name}
          onChange={(e) => patch({ name: e.target.value })}
        />
        {errors.name ? <p className="text-xs text-destructive">{errors.name}</p> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-desc`}>Description</Label>
        <Textarea
          id={`${idPrefix}-desc`}
          value={values.description}
          onChange={(e) => patch({ description: e.target.value })}
          rows={2}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-sell`}>Selling Price (GHS)</Label>
          <Input
            id={`${idPrefix}-sell`}
            type="number"
            min={0}
            step="0.01"
            value={values.sellingPrice || ""}
            onChange={(e) =>
              patch({ sellingPrice: Number(e.target.value) || 0 })
            }
          />
          {errors.sellingPrice ? (
            <p className="text-xs text-destructive">{errors.sellingPrice}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-cost`}>Cost Price (GHS)</Label>
          <Input
            id={`${idPrefix}-cost`}
            type="number"
            min={0}
            step="0.01"
            value={values.costPrice || ""}
            onChange={(e) => patch({ costPrice: Number(e.target.value) || 0 })}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-min`}>Minimum Stock</Label>
          <Input
            id={`${idPrefix}-min`}
            type="number"
            min={0}
            step="0.001"
            value={values.minimumStock}
            onChange={(e) =>
              patch({ minimumStock: Number(e.target.value) || 0 })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-unit`}>Unit</Label>
          <select
            id={`${idPrefix}-unit`}
            value={values.unit}
            onChange={(e) => patch({ unit: e.target.value })}
            className={selectClass}
          >
            {PRODUCT_UNIT_OPTIONS.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Stock is managed through Inventory movements (Opening Balance, Stock In,
        Stock Out, Adjustment).
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-barcode`}>Barcode</Label>
          <Input
            id={`${idPrefix}-barcode`}
            placeholder="Auto-generated if blank"
            value={values.barcode}
            onChange={(e) => patch({ barcode: e.target.value })}
          />
          {errors.barcode ? (
            <p className="text-xs text-destructive">{errors.barcode}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-sku`}>SKU</Label>
          <Input
            id={`${idPrefix}-sku`}
            placeholder="Auto-generated if blank"
            value={values.sku}
            onChange={(e) => patch({ sku: e.target.value })}
          />
          {errors.sku ? <p className="text-xs text-destructive">{errors.sku}</p> : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-status`}>Status</Label>
          <select
            id={`${idPrefix}-status`}
            value={values.status}
            onChange={(e) =>
              patch({ status: e.target.value as ProductFormValues["status"] })
            }
            className={selectClass}
          >
            {PRODUCT_STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={values.vatApplicable}
            onChange={(e) => patch({ vatApplicable: e.target.checked })}
            className="h-4 w-4 rounded border-input"
          />
          VAT Applicable
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={values.availableForSale}
            onChange={(e) => patch({ availableForSale: e.target.checked })}
            className="h-4 w-4 rounded border-input"
          />
          Available for Sale
        </label>
      </div>
    </div>
  );
}

export function buildInitialProductForm(): ProductFormValues {
  return {
    categoryId: "",
    name: "",
    description: "",
    sellingPrice: 0,
    costPrice: 0,
    minimumStock: 0,
    unit: "each",
    barcode: "",
    sku: "",
    vatApplicable: true,
    availableForSale: true,
    status: "active",
  };
}

export function validateProductForm(
  values: ProductFormValues
): Partial<Record<string, string>> {
  const errors: Partial<Record<string, string>> = {};
  if (!values.categoryId) errors.categoryId = "Category is required";
  if (!values.name.trim()) errors.name = "Product name is required";
  if (values.sellingPrice < 0) errors.sellingPrice = "Selling price is required";
  return errors;
}
