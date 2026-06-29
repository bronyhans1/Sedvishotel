import type { DbProductStatus } from "@/types/database";

export type ProductStatus = DbProductStatus;

export type Product = {
  id: string;
  categoryId: string;
  categoryName: string;
  barcode: string;
  sku: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  sellingPrice: number;
  costPrice: number | null;
  currentStock: number;
  minimumStock: number;
  unit: string;
  vatApplicable: boolean;
  availableForSale: boolean;
  status: ProductStatus;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProductFormValues = {
  categoryId: string;
  name: string;
  description: string;
  sellingPrice: number;
  costPrice: number;
  minimumStock: number;
  unit: string;
  barcode: string;
  sku: string;
  vatApplicable: boolean;
  availableForSale: boolean;
  status: ProductStatus;
};

export type ProductStats = {
  totalProducts: number;
  activeProducts: number;
  outOfStockProducts: number;
  availableForSaleProducts: number;
};

export type ProductSortKey =
  | "name"
  | "category"
  | "sellingPrice"
  | "currentStock"
  | "createdAt"
  | "status";

export type ProductSortDirection = "asc" | "desc";

export type ProductStatusFilter = "all" | ProductStatus;

export const PRODUCT_STATUS_OPTIONS: {
  value: ProductStatus;
  label: string;
}[] = [
  { value: "active", label: "Active" },
  { value: "out_of_stock", label: "Out of Stock" },
  { value: "inactive", label: "Inactive" },
  { value: "discontinued", label: "Discontinued" },
];

export const PRODUCT_UNIT_OPTIONS = [
  "each",
  "bottle",
  "can",
  "pack",
  "box",
  "kg",
  "g",
  "l",
  "ml",
] as const;

export type ProductCategoryOption = {
  id: string;
  name: string;
};
