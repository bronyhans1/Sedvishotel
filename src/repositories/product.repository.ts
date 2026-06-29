import type { DbProduct, DbProductWithCategory } from "@/types/database";

export interface IProductRepository {
  list(includeArchived?: boolean): Promise<DbProductWithCategory[]>;
  getById(id: string): Promise<DbProductWithCategory | null>;
  create(
    data: Omit<DbProduct, "id" | "created_at" | "updated_at">
  ): Promise<DbProductWithCategory>;
  update(id: string, data: Partial<DbProduct>): Promise<DbProductWithCategory>;
  archive(id: string): Promise<DbProductWithCategory>;
  restore(id: string): Promise<DbProductWithCategory>;
  delete(id: string): Promise<void>;
  existsByBarcode(barcode: string, excludeId?: string): Promise<boolean>;
  existsBySku(sku: string, excludeId?: string): Promise<boolean>;
  existsByName(name: string, excludeId?: string): Promise<boolean>;
  findBySlug(slug: string): Promise<DbProduct | null>;
  getNextIdentifierSequence(): Promise<number>;
  updateImageUrl(id: string, imageUrl: string | null): Promise<DbProductWithCategory>;
  search(query: string, limit?: number): Promise<DbProductWithCategory[]>;
}
