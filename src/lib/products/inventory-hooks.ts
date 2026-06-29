/**
 * Stage 4 integration hooks — future POS, Guest Folio, Restaurant, etc.
 * All stock changes MUST go through InventoryService.createMovement().
 */
import type { StockMovementType } from "@/types/inventory";

export type FutureStockMovementInput = {
  productId: string;
  movementType: StockMovementType;
  quantity: number;
  referenceType?: string;
  referenceId?: string;
  reason?: string;
  notes?: string;
};

/**
 * Stage 4 modules should call InventoryService.createMovement() with the
 * appropriate movement type (e.g. `pos_sale`, `room_charge`, `transfer_out`).
 *
 * Example (server-side):
 * ```ts
 * const inventory = await getInventoryService();
 * await inventory.createMovement(ctx, session, {
 *   productId,
 *   movementType: "pos_sale",
 *   quantity: soldQty,
 *   referenceType: "pos_sale",
 *   referenceId: saleId,
 *   reason: "POS Sale",
 * });
 * ```
 */
export const INVENTORY_ENGINE_ENTRYPOINT = "InventoryService.createMovement";
