import type { DbProductCategory } from "@/types/database";
import type {
  ProductCategory,
  ProductCategoryFormValues,
} from "@/types/product-category";

export function mapDbProductCategoryToProductCategory(
  row: DbProductCategory,
  productCount = 0
): ProductCategory {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? "",
    color: row.color,
    icon: row.icon,
    displayOrder: row.display_order,
    isActive: row.is_active,
    productCount,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function formValuesToInsert(
  values: ProductCategoryFormValues,
  slug: string,
  displayOrder: number
): Omit<DbProductCategory, "id" | "created_at" | "updated_at"> {
  return {
    name: values.name.trim(),
    slug,
    description: values.description.trim() || null,
    color: values.color.trim() || null,
    icon: values.icon.trim() || null,
    display_order: displayOrder,
    is_active: values.isActive,
  };
}

export function formValuesToUpdate(
  values: ProductCategoryFormValues
): Partial<
  Pick<
    DbProductCategory,
    | "name"
    | "description"
    | "color"
    | "icon"
    | "display_order"
    | "is_active"
  >
> {
  return {
    name: values.name.trim(),
    description: values.description.trim() || null,
    color: values.color.trim() || null,
    icon: values.icon.trim() || null,
    display_order: values.displayOrder,
    is_active: values.isActive,
  };
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}
