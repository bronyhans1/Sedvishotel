import type { DbProductCategory } from "@/types/database";

export interface IProductCategoryRepository {
  list(includeArchived?: boolean): Promise<DbProductCategory[]>;
  getById(id: string): Promise<DbProductCategory | null>;
  create(
    data: Omit<DbProductCategory, "id" | "created_at" | "updated_at">
  ): Promise<DbProductCategory>;
  update(id: string, data: Partial<DbProductCategory>): Promise<DbProductCategory>;
  archive(id: string): Promise<DbProductCategory>;
  restore(id: string): Promise<DbProductCategory>;
  delete(id: string): Promise<void>;
  existsByName(name: string, excludeId?: string): Promise<boolean>;
  findBySlug(slug: string): Promise<DbProductCategory | null>;
  getNextDisplayOrder(): Promise<number>;
  reorder(items: { id: string; displayOrder: number }[]): Promise<void>;
  /** Stage 2 hook — returns count of products referencing this category. */
  getProductCount(categoryId: string): Promise<number>;
  getDeleteBlockers(categoryId: string): Promise<string[]>;
}
