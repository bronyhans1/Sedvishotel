import type { IProductRepository } from "@/repositories/product.repository";
import type { SupabaseServerClient } from "@/lib/supabase/server";
import type { DbProduct, DbProductWithCategory } from "@/types/database";

const PRODUCT_SELECT = `
  *,
  category:product_categories!products_category_id_fkey (
    id,
    name,
    slug
  )
`;

type ProductRow = DbProduct & {
  category: DbProductWithCategory["category"];
};

function toProductWithCategory(
  row: ProductRow | null
): DbProductWithCategory | null {
  if (!row) return null;
  return {
    ...row,
    category: row.category ?? null,
  };
}

export class SupabaseProductRepository implements IProductRepository {
  constructor(private readonly client: SupabaseServerClient) {}

  async list(includeArchived = true): Promise<DbProductWithCategory[]> {
    let query = this.client
      .from("products")
      .select(PRODUCT_SELECT)
      .order("name", { ascending: true });

    if (!includeArchived) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to list products: ${error.message}`);
    }

    return (data ?? [])
      .map((row) => toProductWithCategory(row as unknown as ProductRow))
      .filter((r): r is DbProductWithCategory => Boolean(r));
  }

  async getById(id: string): Promise<DbProductWithCategory | null> {
    const { data, error } = await this.client
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load product: ${error.message}`);
    }

    return toProductWithCategory(data as unknown as ProductRow);
  }

  async findBySlug(slug: string): Promise<DbProduct | null> {
    const { data, error } = await this.client
      .from("products")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load product by slug: ${error.message}`);
    }

    return data;
  }

  async existsByBarcode(barcode: string, excludeId?: string): Promise<boolean> {
    const trimmed = barcode.trim();
    if (!trimmed) return false;

    let query = this.client
      .from("products")
      .select("id")
      .ilike("barcode", trimmed);

    if (excludeId) query = query.neq("id", excludeId);

    const { data, error } = await query.limit(1);
    if (error) {
      throw new Error(`Failed to check barcode: ${error.message}`);
    }
    return (data?.length ?? 0) > 0;
  }

  async existsBySku(sku: string, excludeId?: string): Promise<boolean> {
    const trimmed = sku.trim();
    if (!trimmed) return false;

    let query = this.client.from("products").select("id").ilike("sku", trimmed);
    if (excludeId) query = query.neq("id", excludeId);

    const { data, error } = await query.limit(1);
    if (error) {
      throw new Error(`Failed to check SKU: ${error.message}`);
    }
    return (data?.length ?? 0) > 0;
  }

  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    const trimmed = name.trim();
    if (!trimmed) return false;

    let query = this.client.from("products").select("id").ilike("name", trimmed);
    if (excludeId) query = query.neq("id", excludeId);

    const { data, error } = await query.limit(1);
    if (error) {
      throw new Error(`Failed to check product name: ${error.message}`);
    }
    return (data?.length ?? 0) > 0;
  }

  async getNextIdentifierSequence(): Promise<number> {
    const { data, error } = await this.client.rpc("next_product_identifier");

    if (error) {
      throw new Error(
        `Failed to resolve product identifier sequence: ${error.message}`
      );
    }

    return Number(data);
  }

  async create(
    data: Omit<DbProduct, "id" | "created_at" | "updated_at">
  ): Promise<DbProductWithCategory> {
    const { data: row, error } = await this.client
      .from("products")
      .insert(data)
      .select(PRODUCT_SELECT)
      .single();

    if (error || !row) {
      throw new Error(`Failed to create product: ${error?.message ?? "unknown"}`);
    }

    const mapped = toProductWithCategory(row as unknown as ProductRow);
    if (!mapped) {
      throw new Error("Failed to map created product.");
    }
    return mapped;
  }

  async update(
    id: string,
    data: Partial<DbProduct>
  ): Promise<DbProductWithCategory> {
    const { data: row, error } = await this.client
      .from("products")
      .update(data)
      .eq("id", id)
      .select(PRODUCT_SELECT)
      .single();

    if (error || !row) {
      throw new Error(`Failed to update product: ${error?.message ?? "unknown"}`);
    }

    const mapped = toProductWithCategory(row as unknown as ProductRow);
    if (!mapped) {
      throw new Error("Failed to map updated product.");
    }
    return mapped;
  }

  async archive(id: string): Promise<DbProductWithCategory> {
    return this.update(id, { is_active: false });
  }

  async restore(id: string): Promise<DbProductWithCategory> {
    return this.update(id, { is_active: true });
  }

  async updateImageUrl(
    id: string,
    imageUrl: string | null
  ): Promise<DbProductWithCategory> {
    return this.update(id, { image_url: imageUrl });
  }

  async search(query: string, limit = 50): Promise<DbProductWithCategory[]> {
    const trimmed = query.trim();
    if (!trimmed) return this.list(true);

    const pattern = `%${trimmed}%`;
    const { data, error } = await this.client
      .from("products")
      .select(PRODUCT_SELECT)
      .or(
        `name.ilike.${pattern},barcode.ilike.${pattern},sku.ilike.${pattern},description.ilike.${pattern}`
      )
      .order("name", { ascending: true })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to search products: ${error.message}`);
    }

    return (data ?? [])
      .map((row) => toProductWithCategory(row as unknown as ProductRow))
      .filter((r): r is DbProductWithCategory => Boolean(r));
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client.from("products").delete().eq("id", id);
    if (error) {
      throw new Error(`Failed to delete product: ${error.message}`);
    }
  }
}
