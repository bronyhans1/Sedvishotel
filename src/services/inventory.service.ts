import { mapDbStockMovementToStockMovement } from "@/lib/inventory/mapper";
import {
  computeInventoryValue,
  isLowStock,
  isOutOfStock,
} from "@/lib/inventory/low-stock";
import { sessionHasPermission } from "@/lib/auth/permissions";
import type { IActivityLogRepository } from "@/repositories/activity-log.repository";
import type { IInventoryRepository } from "@/repositories/inventory.repository";
import type { IProductRepository } from "@/repositories/product.repository";
import type { AuthSession } from "@/services/auth.service";
import { ServiceError } from "@/services/types";
import type { ServiceContext } from "@/services/types";
import { ActivityActionCodes } from "@/types/database/enums";
import type {
  InventoryStats,
  OpeningBalanceInput,
  StockAdjustmentInput,
  StockMovement,
  StockMovementInput,
} from "@/types/inventory";
import { mapDbProductToProduct } from "@/lib/products/mapper";

/** Future system setting hook — negative stock disabled by default. */
export function isNegativeStockAllowed(): boolean {
  return false;
}

export interface IInventoryService {
  getStats(ctx: ServiceContext, session: AuthSession): Promise<InventoryStats>;
  listMovements(
    ctx: ServiceContext,
    session: AuthSession,
    options?: {
      productId?: string;
      movementType?: string;
      fromDate?: string;
      toDate?: string;
      limit?: number;
    }
  ): Promise<StockMovement[]>;
  getMovement(
    ctx: ServiceContext,
    session: AuthSession,
    id: string
  ): Promise<StockMovement | null>;
  getCurrentStock(
    ctx: ServiceContext,
    session: AuthSession,
    productId: string
  ): Promise<number>;
  openingBalance(
    ctx: ServiceContext,
    session: AuthSession,
    input: OpeningBalanceInput
  ): Promise<StockMovement>;
  stockIn(
    ctx: ServiceContext,
    session: AuthSession,
    input: StockMovementInput
  ): Promise<StockMovement>;
  stockOut(
    ctx: ServiceContext,
    session: AuthSession,
    input: StockMovementInput
  ): Promise<StockMovement>;
  adjustStock(
    ctx: ServiceContext,
    session: AuthSession,
    input: StockAdjustmentInput
  ): Promise<StockMovement>;
  createMovement(
    ctx: ServiceContext,
    session: AuthSession,
    input: StockMovementInput & {
      movementType: import("@/types/database").DbStockMovementType;
      allowRepeatOpening?: boolean;
    }
  ): Promise<StockMovement>;
}

export class InventoryService implements IInventoryService {
  constructor(
    private readonly inventory: IInventoryRepository,
    private readonly products: IProductRepository,
    private readonly activityLogs: IActivityLogRepository
  ) {}

  private require(
    session: AuthSession,
    action: "view" | "create" | "edit" | "delete" | "manage"
  ): void {
    if (!sessionHasPermission(session, "inventory", action)) {
      throw new ServiceError(
        `Forbidden: missing permission inventory.${action}`,
        "FORBIDDEN",
        403
      );
    }
  }

  private async resolveProduct(productId: string) {
    const row = await this.products.getById(productId);
    if (!row) {
      throw new ServiceError("Product not found.", "NOT_FOUND", 404);
    }
    return row;
  }

  private async log(
    ctx: ServiceContext,
    session: AuthSession,
    input: {
      action: string;
      actionCode: string;
      entityId: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<void> {
    await this.activityLogs.create({
      userId: ctx.userId,
      userName: session.fullName,
      action: input.action,
      actionCode: input.actionCode,
      module: "inventory",
      entityType: "stock_movement",
      entityId: input.entityId,
      metadata: input.metadata,
    });
  }

  private mapMovement(row: Awaited<ReturnType<IInventoryRepository["getMovement"]>>) {
    if (!row) {
      throw new ServiceError("Stock movement not found.", "NOT_FOUND", 404);
    }
    return mapDbStockMovementToStockMovement(row);
  }

  async getStats(ctx: ServiceContext, session: AuthSession): Promise<InventoryStats> {
    this.require(session, "view");
    const productRows = await this.products.list(true);
    const products = productRows.map(mapDbProductToProduct);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todaysMovements = await this.inventory.countMovementsSince(
      startOfDay.toISOString()
    );

    return {
      totalProducts: products.length,
      totalInventoryValue: computeInventoryValue(products),
      lowStockProducts: products.filter(isLowStock).length,
      outOfStockProducts: products.filter(isOutOfStock).length,
      todaysMovements,
    };
  }

  async listMovements(
    _ctx: ServiceContext,
    session: AuthSession,
    options?: {
      productId?: string;
      movementType?: string;
      fromDate?: string;
      toDate?: string;
      limit?: number;
    }
  ): Promise<StockMovement[]> {
    this.require(session, "view");
    const rows = await this.inventory.listMovements({
      productId: options?.productId,
      movementType: options?.movementType as
        | import("@/types/database").DbStockMovementType
        | undefined,
      fromDate: options?.fromDate,
      toDate: options?.toDate,
      limit: options?.limit,
    });
    return rows.map(mapDbStockMovementToStockMovement);
  }

  async getMovement(
    _ctx: ServiceContext,
    session: AuthSession,
    id: string
  ): Promise<StockMovement | null> {
    this.require(session, "view");
    const row = await this.inventory.getMovement(id);
    return row ? mapDbStockMovementToStockMovement(row) : null;
  }

  async getCurrentStock(
    _ctx: ServiceContext,
    session: AuthSession,
    productId: string
  ): Promise<number> {
    this.require(session, "view");
    return this.inventory.getCurrentStock(productId);
  }

  async openingBalance(
    ctx: ServiceContext,
    session: AuthSession,
    input: OpeningBalanceInput
  ): Promise<StockMovement> {
    this.require(session, "create");
    const product = await this.resolveProduct(input.productId);

    if (input.quantity < 0) {
      throw new ServiceError("Opening balance cannot be negative.", "VALIDATION", 400);
    }

    const allowRepeatOpening = sessionHasPermission(session, "inventory", "manage");
    const hasOpening = await this.inventory.hasOpeningBalance(input.productId);
    if (hasOpening && !allowRepeatOpening) {
      throw new ServiceError(
        "Opening balance already recorded. Inventory Manage permission is required to set again.",
        "VALIDATION",
        400
      );
    }

    const row = await this.inventory.openingBalance({
      productId: input.productId,
      movementType: "opening_balance",
      quantity: input.quantity,
      reason: input.reason ?? "Opening Balance",
      notes: input.notes ?? null,
      performedBy: ctx.userId,
      allowNegative: isNegativeStockAllowed(),
      allowRepeatOpening,
    });

    await this.log(ctx, session, {
      action: `Opening balance recorded for ${product.name}`,
      actionCode: ActivityActionCodes.INVENTORY_OPENING_BALANCE,
      entityId: row.id,
      metadata: {
        product_id: product.id,
        quantity: input.quantity,
        new_stock: row.new_stock,
      },
    });

    const full = await this.inventory.getMovement(row.id);
    return this.mapMovement(full);
  }

  async stockIn(
    ctx: ServiceContext,
    session: AuthSession,
    input: StockMovementInput
  ): Promise<StockMovement> {
    this.require(session, "create");
    const product = await this.resolveProduct(input.productId);

    if (input.quantity <= 0) {
      throw new ServiceError("Stock in quantity must be greater than zero.", "VALIDATION", 400);
    }

    const row = await this.inventory.stockIn({
      productId: input.productId,
      movementType: "stock_in",
      quantity: input.quantity,
      reason: input.reason ?? "Stock In",
      notes: input.notes ?? null,
      referenceType: input.referenceType ?? null,
      referenceId: input.referenceId ?? null,
      performedBy: ctx.userId,
      allowNegative: isNegativeStockAllowed(),
    });

    await this.log(ctx, session, {
      action: `Stock in recorded for ${product.name}`,
      actionCode: ActivityActionCodes.INVENTORY_STOCK_IN,
      entityId: row.id,
      metadata: { product_id: product.id, quantity: input.quantity },
    });

    const full = await this.inventory.getMovement(row.id);
    return this.mapMovement(full);
  }

  async stockOut(
    ctx: ServiceContext,
    session: AuthSession,
    input: StockMovementInput
  ): Promise<StockMovement> {
    this.require(session, "create");
    const product = await this.resolveProduct(input.productId);

    if (input.quantity <= 0) {
      throw new ServiceError("Stock out quantity must be greater than zero.", "VALIDATION", 400);
    }

    try {
      const row = await this.inventory.stockOut({
        productId: input.productId,
        movementType: "stock_out",
        quantity: input.quantity,
        reason: input.reason ?? "Stock Out",
        notes: input.notes ?? null,
        referenceType: input.referenceType ?? null,
        referenceId: input.referenceId ?? null,
        performedBy: ctx.userId,
        allowNegative: isNegativeStockAllowed(),
      });

      await this.log(ctx, session, {
        action: `Stock out recorded for ${product.name}`,
        actionCode: ActivityActionCodes.INVENTORY_STOCK_OUT,
        entityId: row.id,
        metadata: { product_id: product.id, quantity: input.quantity },
      });

      const full = await this.inventory.getMovement(row.id);
      return this.mapMovement(full);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.toLowerCase().includes("insufficient stock")) {
        throw new ServiceError(
          `Insufficient stock for ${product.name}.`,
          "VALIDATION",
          400
        );
      }
      throw err;
    }
  }

  async adjustStock(
    ctx: ServiceContext,
    session: AuthSession,
    input: StockAdjustmentInput
  ): Promise<StockMovement> {
    this.require(session, "edit");
    const product = await this.resolveProduct(input.productId);

    if (input.physicalCount < 0) {
      throw new ServiceError("Physical count cannot be negative.", "VALIDATION", 400);
    }

    const previous = Number(product.current_stock);
    const delta = input.physicalCount - previous;

    if (delta === 0) {
      throw new ServiceError(
        "Physical count matches system stock. No adjustment needed.",
        "VALIDATION",
        400
      );
    }

    try {
      const row = await this.inventory.adjustStock({
        productId: input.productId,
        movementType: "adjustment",
        quantity: delta,
        reason: input.reason ?? "Physical Count",
        notes: input.notes ?? null,
        performedBy: ctx.userId,
        allowNegative: isNegativeStockAllowed(),
      });

      await this.log(ctx, session, {
        action: `Stock adjusted for ${product.name}`,
        actionCode: ActivityActionCodes.INVENTORY_ADJUSTMENT,
        entityId: row.id,
        metadata: {
          product_id: product.id,
          previous_stock: previous,
          physical_count: input.physicalCount,
          delta,
        },
      });

      const full = await this.inventory.getMovement(row.id);
      return this.mapMovement(full);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.toLowerCase().includes("insufficient stock")) {
        throw new ServiceError(
          `Adjustment would result in negative stock for ${product.name}.`,
          "VALIDATION",
          400
        );
      }
      throw err;
    }
  }

  /** Shared entry point for future POS, folio, restaurant modules. */
  async createMovement(
    ctx: ServiceContext,
    session: AuthSession,
    input: StockMovementInput & {
      movementType: import("@/types/database").DbStockMovementType;
      allowRepeatOpening?: boolean;
    }
  ): Promise<StockMovement> {
    const posMovementTypes = ["pos_sale", "room_charge"] as const;
    const isPosMovement = posMovementTypes.includes(
      input.movementType as (typeof posMovementTypes)[number]
    );

    if (isPosMovement) {
      const canPos = sessionHasPermission(session, "pos", "create");
      const canInventory = sessionHasPermission(session, "inventory", "manage");
      if (!canPos && !canInventory) {
        throw new ServiceError(
          "Forbidden: missing permission pos.create or inventory.manage",
          "FORBIDDEN",
          403
        );
      }
    } else {
      this.require(session, "manage");
    }

    const product = await this.resolveProduct(input.productId);

    const row = await this.inventory.createMovement({
      productId: input.productId,
      movementType: input.movementType,
      quantity: input.quantity,
      reason: input.reason ?? null,
      notes: input.notes ?? null,
      referenceType: input.referenceType ?? null,
      referenceId: input.referenceId ?? null,
      performedBy: ctx.userId,
      allowNegative: isNegativeStockAllowed(),
      allowRepeatOpening: input.allowRepeatOpening ?? false,
    });

    await this.log(ctx, session, {
      action: `Inventory movement (${input.movementType}) for ${product.name}`,
      actionCode: ActivityActionCodes.INVENTORY_UPDATED,
      entityId: row.id,
      metadata: {
        product_id: product.id,
        movement_type: input.movementType,
        quantity: input.quantity,
      },
    });

    const full = await this.inventory.getMovement(row.id);
    return this.mapMovement(full);
  }
}
