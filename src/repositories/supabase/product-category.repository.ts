import type { IProductCategoryRepository } from "@/repositories/product-category.repository";
import type { SupabaseServerClient } from "@/lib/supabase/server";
import type { DbProductCategory } from "@/types/database";

export class SupabaseProductCategoryRepository implements IProductCategoryRepository {
  constructor(private readonly client: SupabaseServerClient) {}

  async list(includeArchived = true): Promise<DbProductCategory[]> {
    let query = this.client
      .from("product_categories")
      .select("*")
      .order("display_order", { ascending: true })
      .order("name", { ascending: true });

    if (!includeArchived) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to list product categories: ${error.message}`);
    }

    return data ?? [];
  }

  async getById(id: string): Promise<DbProductCategory | null> {
    const { data, error } = await this.client
      .from("product_categories")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load product category: ${error.message}`);
    }

    return data;
  }

  async findBySlug(slug: string): Promise<DbProductCategory | null> {
    const { data, error } = await this.client
      .from("product_categories")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load product category by slug: ${error.message}`);
    }

    return data;
  }

  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    const trimmed = name.trim();
    if (!trimmed) return false;

    let query = this.client
      .from("product_categories")
      .select("id")
      .ilike("name", trimmed);

    if (excludeId) {
      query = query.neq("id", excludeId);
    }

    const { data, error } = await query.limit(1);

    if (error) {
      throw new Error(`Failed to check category name: ${error.message}`);
    }

    return (data?.length ?? 0) > 0;
  }

  async create(
    data: Omit<DbProductCategory, "id" | "created_at" | "updated_at">
  ): Promise<DbProductCategory> {
    const { data: row, error } = await this.client
      .from("product_categories")
      .insert(data)
      .select("*")
      .single();

    if (error || !row) {
      throw new Error(
        `Failed to create product category: ${error?.message ?? "unknown"}`
      );
    }

    return row;
  }

  async update(
    id: string,
    data: Partial<DbProductCategory>
  ): Promise<DbProductCategory> {
    const { data: row, error } = await this.client
      .from("product_categories")
      .update(data)
      .eq("id", id)
      .select("*")
      .single();

    if (error || !row) {
      throw new Error(
        `Failed to update product category: ${error?.message ?? "unknown"}`
      );
    }

    return row;
  }

  async archive(id: string): Promise<DbProductCategory> {
    return this.update(id, { is_active: false });
  }

  async restore(id: string): Promise<DbProductCategory> {
    return this.update(id, { is_active: true });
  }

  async getNextDisplayOrder(): Promise<number> {
    const { data, error } = await this.client
      .from("product_categories")
      .select("display_order")
      .order("display_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to resolve display order: ${error.message}`);
    }

    return (data?.display_order ?? 0) + 1;
  }

  async reorder(items: { id: string; displayOrder: number }[]): Promise<void> {
    for (const item of items) {
      const { error } = await this.client
        .from("product_categories")
        .update({ display_order: item.displayOrder })
        .eq("id", item.id);

      if (error) {
        throw new Error(`Failed to reorder product categories: ${error.message}`);
      }
    }
  }

  /**
   * Stage 2: query `products` where category_id = categoryId.
   * Returns 0 until the products table exists.
   */
  async getProductCount(categoryId: string): Promise<number> {
    const { count, error } = await this.client
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("category_id", categoryId);

    if (error) {
      throw new Error(`Failed to count products: ${error.message}`);
    }

    return count ?? 0;
  }

  async getDeleteBlockers(categoryId: string): Promise<string[]> {
    const blockers: string[] = [];
    const productCount = await this.getProductCount(categoryId);
    if (productCount > 0) {
      const word = productCount === 1 ? "product" : "products";
      blockers.push(`${productCount} ${word} reference this category`);
    }
    return blockers;
  }

  async delete(id: string): Promise<void> {
    const blockers = await this.getDeleteBlockers(id);
    if (blockers.length > 0) {
      throw new Error(
        `Cannot delete product category. ${blockers.join("; ")}. Archive instead.`
      );
    }

    const { error } = await this.client
      .from("product_categories")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(`Failed to delete product category: ${error.message}`);
    }
  }
}
