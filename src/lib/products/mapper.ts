import { StorageBuckets } from "@/lib/database/storage";
import { supabaseEnv } from "@/lib/supabase/config";
import type { DbProductWithCategory } from "@/types/database";
import type { Product, ProductFormValues } from "@/types/product";

export function mapDbProductToProduct(row: DbProductWithCategory): Product {
  return {
    id: row.id,
    categoryId: row.category_id,
    categoryName: row.category?.name ?? "—",
    barcode: row.barcode,
    sku: row.sku,
    name: row.name,
    slug: row.slug,
    description: row.description ?? "",
    imageUrl: resolveProductImageUrl(row.image_url),
    sellingPrice: Number(row.selling_price),
    costPrice: row.cost_price === null ? null : Number(row.cost_price),
    currentStock: Number(row.current_stock),
    minimumStock: Number(row.minimum_stock),
    unit: row.unit,
    vatApplicable: row.vat_applicable,
    availableForSale: row.available_for_sale,
    status: row.status,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function resolveProductImageUrl(
  imageUrl: string | null | undefined
): string | null {
  if (!imageUrl?.trim()) return null;
  const value = imageUrl.trim();
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }
  if (!supabaseEnv.url) return value;
  return `${supabaseEnv.url}/storage/v1/object/public/${StorageBuckets.productImages}/${value}`;
}

export function formValuesToInsert(
  values: ProductFormValues,
  slug: string,
  barcode: string,
  sku: string
): Omit<import("@/types/database").DbProduct, "id" | "created_at" | "updated_at"> {
  return {
    category_id: values.categoryId,
    barcode,
    sku,
    name: values.name.trim(),
    slug,
    description: values.description.trim() || null,
    image_url: null,
    selling_price: values.sellingPrice,
    cost_price: values.costPrice > 0 ? values.costPrice : null,
    current_stock: 0,
    minimum_stock: values.minimumStock,
    unit: values.unit.trim() || "each",
    vat_applicable: values.vatApplicable,
    available_for_sale: values.availableForSale,
    status: values.status,
    is_active: true,
  };
}

export function formValuesToUpdate(
  values: ProductFormValues
): Partial<
  Pick<
    import("@/types/database").DbProduct,
    | "category_id"
    | "name"
    | "description"
    | "barcode"
    | "sku"
    | "selling_price"
    | "cost_price"
    | "minimum_stock"
    | "unit"
    | "vat_applicable"
    | "available_for_sale"
    | "status"
  >
> {
  return {
    category_id: values.categoryId,
    name: values.name.trim(),
    description: values.description.trim() || null,
    barcode: values.barcode.trim(),
    sku: values.sku.trim(),
    selling_price: values.sellingPrice,
    cost_price: values.costPrice > 0 ? values.costPrice : null,
    minimum_stock: values.minimumStock,
    unit: values.unit.trim() || "each",
    vat_applicable: values.vatApplicable,
    available_for_sale: values.availableForSale,
    status: values.status,
  };
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}
