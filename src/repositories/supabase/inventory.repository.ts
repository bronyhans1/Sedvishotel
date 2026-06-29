import type { RecordStockMovementParams } from "@/lib/inventory/mapper";
import type { IInventoryRepository } from "@/repositories/inventory.repository";
import type { SupabaseServerClient } from "@/lib/supabase/server";
import type {
  DbStockMovement,
  DbStockMovementType,
  DbStockMovementWithRelations,
} from "@/types/database";

const MOVEMENT_SELECT = `
  *,
  product:products!stock_movements_product_id_fkey (
    id,
    name,
    sku,
    barcode,
    unit
  ),
  performer:users!stock_movements_performed_by_fkey (
    id,
    full_name
  )
`;

type MovementRow = DbStockMovement & {
  product: DbStockMovementWithRelations["product"];
  performer: DbStockMovementWithRelations["performer"];
};

function toMovementWithRelations(
  row: MovementRow | null
): DbStockMovementWithRelations | null {
  if (!row) return null;
  return {
    ...row,
    product: row.product ?? null,
    performer: row.performer ?? null,
  };
}

export class SupabaseInventoryRepository implements IInventoryRepository {
  constructor(private readonly client: SupabaseServerClient) {}

  async getCurrentStock(productId: string): Promise<number> {
    const { data, error } = await this.client
      .from("products")
      .select("current_stock")
      .eq("id", productId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to read current stock: ${error.message}`);
    }
    if (!data) {
      throw new Error("Product not found");
    }
    return Number(data.current_stock);
  }

  async createMovement(params: RecordStockMovementParams): Promise<DbStockMovement> {
    const { data, error } = await this.client.rpc("record_stock_movement", {
      p_product_id: params.productId,
      p_movement_type: params.movementType,
      p_quantity: params.quantity,
      p_reference_type: params.referenceType ?? null,
      p_reference_id: params.referenceId ?? null,
      p_reason: params.reason ?? null,
      p_notes: params.notes ?? null,
      p_performed_by: params.performedBy ?? null,
      p_allow_negative: params.allowNegative ?? false,
      p_allow_repeat_opening: params.allowRepeatOpening ?? false,
    });

    if (error) {
      throw new Error(`Failed to record stock movement: ${error.message}`);
    }
    if (!data) {
      throw new Error("Failed to record stock movement: empty response");
    }

    return data as DbStockMovement;
  }

  async openingBalance(params: RecordStockMovementParams): Promise<DbStockMovement> {
    return this.createMovement({
      ...params,
      movementType: "opening_balance",
    });
  }

  async stockIn(params: RecordStockMovementParams): Promise<DbStockMovement> {
    return this.createMovement({
      ...params,
      movementType: "stock_in",
    });
  }

  async stockOut(params: RecordStockMovementParams): Promise<DbStockMovement> {
    return this.createMovement({
      ...params,
      movementType: "stock_out",
    });
  }

  async adjustStock(params: RecordStockMovementParams): Promise<DbStockMovement> {
    return this.createMovement({
      ...params,
      movementType: "adjustment",
    });
  }

  async hasOpeningBalance(productId: string): Promise<boolean> {
    const { count, error } = await this.client
      .from("stock_movements")
      .select("*", { count: "exact", head: true })
      .eq("product_id", productId)
      .eq("movement_type", "opening_balance");

    if (error) {
      throw new Error(`Failed to check opening balance: ${error.message}`);
    }
    return (count ?? 0) > 0;
  }

  async listMovements(options?: {
    productId?: string;
    movementType?: DbStockMovementType;
    fromDate?: string;
    toDate?: string;
    limit?: number;
  }): Promise<DbStockMovementWithRelations[]> {
    let query = this.client
      .from("stock_movements")
      .select(MOVEMENT_SELECT)
      .order("created_at", { ascending: false });

    if (options?.productId) {
      query = query.eq("product_id", options.productId);
    }
    if (options?.movementType) {
      query = query.eq("movement_type", options.movementType);
    }
    if (options?.fromDate) {
      query = query.gte("created_at", options.fromDate);
    }
    if (options?.toDate) {
      query = query.lte("created_at", options.toDate);
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to list stock movements: ${error.message}`);
    }

    return (data ?? [])
      .map((row) => toMovementWithRelations(row as unknown as MovementRow))
      .filter((r): r is DbStockMovementWithRelations => Boolean(r));
  }

  async getMovement(id: string): Promise<DbStockMovementWithRelations | null> {
    const { data, error } = await this.client
      .from("stock_movements")
      .select(MOVEMENT_SELECT)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load stock movement: ${error.message}`);
    }

    return toMovementWithRelations(data as unknown as MovementRow);
  }

  async getLowStockProducts() {
    const { data, error } = await this.client
      .from("products")
      .select("id, name, sku, current_stock, minimum_stock")
      .eq("is_active", true)
      .order("current_stock", { ascending: true });

    if (error) {
      throw new Error(`Failed to load low stock products: ${error.message}`);
    }

    return (data ?? []).filter(
      (row) => Number(row.current_stock) <= Number(row.minimum_stock)
    );
  }

  async countMovementsSince(sinceIso: string): Promise<number> {
    const { count, error } = await this.client
      .from("stock_movements")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sinceIso);

    if (error) {
      throw new Error(`Failed to count movements: ${error.message}`);
    }
    return count ?? 0;
  }
}
