import type { DbStockMovement, DbStockMovementWithRelations } from "@/types/database";
import { resolveMovementSource } from "@/lib/inventory/movement-source";
import type { StockMovement } from "@/types/inventory";

export function mapDbStockMovementToStockMovement(
  row: DbStockMovementWithRelations
): StockMovement {
  return {
    id: row.id,
    productId: row.product_id,
    productName: row.product?.name ?? "—",
    productSku: row.product?.sku ?? "—",
    productBarcode: row.product?.barcode ?? "—",
    movementType: row.movement_type,
    quantity: Number(row.quantity),
    previousStock: Number(row.previous_stock),
    newStock: Number(row.new_stock),
    referenceType: row.reference_type,
    referenceId: row.reference_id,
    reason: row.reason,
    notes: row.notes,
    movementSource: resolveMovementSource(row.reference_type, row.movement_type),
    performedById: row.performed_by,
    performedByName: row.performer?.full_name ?? null,
    createdAt: row.created_at,
  };
}

export type RecordStockMovementParams = {
  productId: string;
  movementType: DbStockMovement["movement_type"];
  quantity: number;
  referenceType?: string | null;
  referenceId?: string | null;
  reason?: string | null;
  notes?: string | null;
  performedBy?: string | null;
  allowNegative?: boolean;
  allowRepeatOpening?: boolean;
};
