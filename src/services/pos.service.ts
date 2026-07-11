import { randomUUID } from "crypto";

import { PosAtomicError } from "@/lib/pos/atomic-commit";
import { mapDbSaleToHistoryItem, mapDbSaleToPosSale } from "@/lib/pos/mapper";
import { assertReservationEligibleForRoomCharge } from "@/lib/pos/room-charge-validation";
import { buildPosCartSettlement, isProductSellable } from "@/lib/pos/settlement";
import { mapDbProductToProduct } from "@/lib/products/mapper";
import { sessionHasPermission } from "@/lib/auth/permissions";
import type { IActivityLogRepository } from "@/repositories/activity-log.repository";
import type { IPosRepository, PosSaleListFilters } from "@/repositories/pos.repository";
import type { PaginatedResult, PaginationParams } from "@/repositories/types";
import type { IProductRepository } from "@/repositories/product.repository";
import type { IReservationRepository } from "@/repositories/reservation.repository";
import type { AuthSession } from "@/services/auth.service";
import { ServiceError } from "@/services/types";
import type { ServiceContext } from "@/services/types";
import { ActivityActionCodes } from "@/types/database/enums";
import type {
  CompletePosSaleInput,
  PosSale,
  PosSaleCompletionResult,
  PosSaleHistoryItem,
  SalePaymentStatus,
  PosVatOverride,
} from "@/types/pos";

export interface IPosService {
  completeSale(
    ctx: ServiceContext,
    session: AuthSession,
    input: CompletePosSaleInput,
    vatOverride?: PosVatOverride
  ): Promise<PosSaleCompletionResult>;
  getSale(ctx: ServiceContext, session: AuthSession, id: string): Promise<PosSale | null>;
  listSales(
    ctx: ServiceContext,
    session: AuthSession,
    filters?: PosSaleListFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResult<PosSaleHistoryItem>>;
  listCashiers(
    ctx: ServiceContext,
    session: AuthSession
  ): Promise<Array<{ id: string; fullName: string }>>;
  logReceiptPrinted(
    ctx: ServiceContext,
    session: AuthSession,
    saleId: string
  ): Promise<void>;
  logReceiptReprinted(
    ctx: ServiceContext,
    session: AuthSession,
    saleId: string
  ): Promise<void>;
}

export class PosService implements IPosService {
  constructor(
    private readonly pos: IPosRepository,
    private readonly products: IProductRepository,
    private readonly reservations: IReservationRepository,
    private readonly activityLogs: IActivityLogRepository,
    private readonly folios?: import("@/services/guest-folio.service").IGuestFolioService
  ) {}

  private require(
    session: AuthSession,
    action: "view" | "create" | "edit" | "delete" | "manage"
  ): void {
    if (!sessionHasPermission(session, "pos", action)) {
      throw new ServiceError(
        `Forbidden: missing permission pos.${action}`,
        "FORBIDDEN",
        403
      );
    }
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
      module: "pos",
      entityType: "sale",
      entityId: input.entityId,
      metadata: input.metadata ?? {},
      status: "success",
    });
  }

  private async resolvePaymentStatus(
    sale: Awaited<ReturnType<IPosRepository["getById"]>>
  ): Promise<SalePaymentStatus> {
    if (
      !sale ||
      sale.payment_status === "void" ||
      sale.customer_type !== "room_charge" ||
      !sale.reservation_id ||
      !this.folios
    ) {
      return sale?.payment_status ?? "pending";
    }

    const settlement = await this.folios.getRecordedSettlement(sale.reservation_id);
    if (!settlement || settlement.totalAmount <= 0) {
      return sale.payment_status;
    }

    return settlement.outstandingBalance <= 0 ? "paid" : "pending";
  }

  async getSale(
    ctx: ServiceContext,
    session: AuthSession,
    id: string
  ): Promise<PosSale | null> {
    this.require(session, "view");
    const row = await this.pos.getById(id);
    if (!row) return null;
    const paymentStatus = await this.resolvePaymentStatus(row);
    return mapDbSaleToPosSale(row, paymentStatus);
  }

  async listSales(
    ctx: ServiceContext,
    session: AuthSession,
    filters?: PosSaleListFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResult<PosSaleHistoryItem>> {
    this.require(session, "view");
    const result = await this.pos.findAll(filters, pagination);
    const roomChargeStatuses = new Map<string, Promise<SalePaymentStatus>>();
    const paymentStatuses = await Promise.all(
      result.data.map((sale) => {
        if (
          sale.customer_type !== "room_charge" ||
          sale.payment_status === "void" ||
          !sale.reservation_id
        ) {
          return this.resolvePaymentStatus(sale);
        }

        const existing = roomChargeStatuses.get(sale.reservation_id);
        if (existing) return existing;

        const resolved = this.resolvePaymentStatus(sale);
        roomChargeStatuses.set(sale.reservation_id, resolved);
        return resolved;
      })
    );
    return {
      ...result,
      data: result.data.map((sale, index) =>
        mapDbSaleToHistoryItem(sale, paymentStatuses[index])
      ),
    };
  }

  async listCashiers(
    _ctx: ServiceContext,
    session: AuthSession
  ): Promise<Array<{ id: string; fullName: string }>> {
    this.require(session, "view");
    const rows = await this.pos.listCashiers();
    return rows.map((row) => ({ id: row.id, fullName: row.fullName }));
  }

  async completeSale(
    ctx: ServiceContext,
    session: AuthSession,
    input: CompletePosSaleInput,
    vatOverride?: PosVatOverride
  ): Promise<PosSaleCompletionResult> {
    this.require(session, "create");

    if (!input.lines.length) {
      throw new ServiceError("Cart is empty.", "VALIDATION", 400);
    }

    const vatApplied = vatOverride?.vatApplied ?? input.vatApplied ?? true;
    if (
      vatOverride &&
      vatOverride.vatApplied === false &&
      !sessionHasPermission(session, "payments", "override_vat")
    ) {
      throw new ServiceError(
        "VAT override requires payments.override_vat permission.",
        "FORBIDDEN",
        403
      );
    }

    if (input.customerType === "room_charge") {
      if (!input.reservationId) {
        throw new ServiceError(
          "Select a checked-in guest to charge to room.",
          "VALIDATION",
          400
        );
      }
      const reservation = await this.reservations.getById(input.reservationId);
      assertReservationEligibleForRoomCharge(reservation);
      if (input.paymentMethod !== "room_charge") {
        throw new ServiceError(
          "Room charge sales must use Charge To Room payment method.",
          "VALIDATION",
          400
        );
      }
    } else if (input.paymentMethod === "room_charge") {
      throw new ServiceError(
        "Walk-in sales cannot use Charge To Room payment.",
        "VALIDATION",
        400
      );
    }

    for (const line of input.lines) {
      const productRow = await this.products.getById(line.productId);
      if (!productRow) {
        throw new ServiceError(`Product not found: ${line.name}`, "NOT_FOUND", 404);
      }
      const product = mapDbProductToProduct(productRow);
      if (!isProductSellable(product)) {
        throw new ServiceError(
          `${product.name} is out of stock or unavailable for sale.`,
          "VALIDATION",
          400
        );
      }
      if (product.currentStock < line.quantity) {
        throw new ServiceError(
          `Insufficient stock for ${product.name}. Available: ${product.currentStock}.`,
          "VALIDATION",
          400
        );
      }
    }

    const settlement = buildPosCartSettlement(
      input.lines,
      input.discount ?? 0,
      input.vatRate,
      vatApplied
    );

    const saleId = randomUUID();

    const commitResult = await this.pos.commitSaleAtomically({
      idempotencyKey: input.idempotencyKey,
      saleId,
      customerType: input.customerType,
      reservationId: input.reservationId ?? null,
      guestId: input.guestId ?? null,
      cashierId: ctx.userId,
      subtotal: settlement.subtotal,
      vatAmount: settlement.vatAmount,
      discount: settlement.discount,
      total: settlement.total,
      paymentStatus:
        input.customerType === "room_charge" ? "pending" : "paid",
      vatApplied,
      vatRate: input.vatRate,
      notes: input.notes ?? null,
      paymentMethod: input.paymentMethod,
      paymentReference: input.paymentReference ?? null,
      postFolioDebit: input.customerType === "room_charge",
      items: input.lines.map((line, index) => {
        const settled = settlement.lines[index];
        return {
          productId: line.productId,
          productName: line.name,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          vatApplicable: line.vatApplicable,
          vatAmount: settled.vatAmount,
          lineSubtotal: settled.lineSubtotal,
          total: settled.total,
        };
      }),
    });

    if (!commitResult.idempotentReplay) {
      const actionCode =
        input.customerType === "room_charge"
          ? ActivityActionCodes.POS_ROOM_CHARGE
          : ActivityActionCodes.POS_SALE_COMPLETED;

      await this.log(ctx, session, {
        action:
          input.customerType === "room_charge"
            ? `Room charge recorded (${commitResult.saleNumber})`
            : `POS sale completed (${commitResult.saleNumber})`,
        actionCode,
        entityId: commitResult.saleId,
        metadata: {
          sale_number: commitResult.saleNumber,
          total: settlement.total,
          payment_method: input.paymentMethod,
          reservation_id: input.reservationId ?? null,
          line_count: input.lines.length,
          receipt_number: commitResult.receiptNumber,
        },
      });
    }

    const row = await this.pos.getById(commitResult.saleId);
    if (!row) {
      throw new PosAtomicError();
    }

    if (
      !commitResult.idempotentReplay &&
      input.customerType === "room_charge" &&
      input.reservationId &&
      this.folios
    ) {
      await this.folios.syncReservationSettlement(input.reservationId);
    }

    const paymentStatus = await this.resolvePaymentStatus(row);

    return {
      sale: mapDbSaleToPosSale(row, paymentStatus),
      idempotentReplay: commitResult.idempotentReplay,
    };
  }

  async logReceiptPrinted(
    ctx: ServiceContext,
    session: AuthSession,
    saleId: string
  ): Promise<void> {
    this.require(session, "view");
    const sale = await this.pos.getById(saleId);
    if (!sale) {
      throw new ServiceError("Sale not found.", "NOT_FOUND", 404);
    }

    await this.log(ctx, session, {
      action: `Receipt printed for ${sale.sale_number}`,
      actionCode: ActivityActionCodes.POS_RECEIPT_PRINTED,
      entityId: saleId,
      metadata: { sale_number: sale.sale_number },
    });
  }

  async logReceiptReprinted(
    ctx: ServiceContext,
    session: AuthSession,
    saleId: string
  ): Promise<void> {
    this.require(session, "view");
    const sale = await this.pos.getById(saleId);
    if (!sale) {
      throw new ServiceError("Sale not found.", "NOT_FOUND", 404);
    }

    const reprintedAt = new Date().toISOString();

    await this.log(ctx, session, {
      action: `Receipt reprinted for ${sale.sale_number}`,
      actionCode: ActivityActionCodes.POS_RECEIPT_REPRINTED,
      entityId: saleId,
      metadata: {
        sale_number: sale.sale_number,
        cashier_name: sale.cashier?.full_name ?? null,
        sale_date: sale.created_at,
        reprinted_by: session.fullName,
        reprinted_at: reprintedAt,
      },
    });
  }
}
