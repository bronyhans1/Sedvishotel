export type ProductCategory = {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string | null;
  icon: string | null;
  displayOrder: number;
  isActive: boolean;
  productCount: number;
  createdAt: string;
  updatedAt: string;
};

export type ProductCategoryFormValues = {
  name: string;
  description: string;
  displayOrder: number;
  isActive: boolean;
  color: string;
  icon: string;
};

export type ProductCategoryStats = {
  totalCategories: number;
  activeCategories: number;
  archivedCategories: number;
  highestDisplayOrder: number;
};

export type ProductCategorySortKey =
  | "name"
  | "createdAt"
  | "displayOrder"
  | "status";

export type ProductCategorySortDirection = "asc" | "desc";

export type ProductCategoryStatusFilter = "all" | "active" | "archived";
