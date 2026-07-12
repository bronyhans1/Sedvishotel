import { getInvoiceAccess } from "@/lib/auth/invoice-access";
import {
  buildInvoiceLineItems,
  mapDbInvoiceToInvoice,
} from "@/lib/invoices/mapper";
import { resolveEffectiveCheckOutDate } from "@/lib/reservations/effective-checkout-date";
import type { IActivityLogRepository } from "@/repositories/activity-log.repository";
import type { IInvoiceRepository } from "@/repositories/invoice.repository";
import type { IReservationRepository } from "@/repositories/reservation.repository";
import type { AuthSession } from "@/services/auth.service";
import { ServiceError } from "@/services/types";
import type { ServiceContext } from "@/services/types";
import { ActivityActionCodes } from "@/types/database/enums";
import type { DbInvoiceStatus } from "@/types/database";
import type { Invoice } from "@/types/invoice";

export interface IInvoiceService {
  getAll(ctx: ServiceContext, session: AuthSession): Promise<Invoice[]>;
  getById(
    ctx: ServiceContext,
    session: AuthSession,
    invoiceId: string
  ): Promise<Invoice | null>;
  getByReservationId(
    ctx: ServiceContext,
    session: AuthSession,
    reservationId: string
  ): Promise<Invoice | null>;
  create(
    ctx: ServiceContext,
    session: AuthSession,
    reservationId: string
  ): Promise<Invoice>;
  markPaid(
    ctx: ServiceContext,
    session: AuthSession,
    invoiceId: string
  ): Promise<Invoice>;
}

function resolveInvoiceStatus(
  totalAmount: number,
  amountPaid: number
): DbInvoiceStatus {
  const balance = Math.max(0, totalAmount - amountPaid);
  if (balance <= 0) return "paid";
  if (amountPaid > 0) return "partial";
  return "outstanding";
}

export class InvoiceService implements IInvoiceService {
  constructor(
    private readonly invoices: IInvoiceRepository,
    private readonly reservations: IReservationRepository,
    private readonly activityLogs: IActivityLogRepository
  ) {}

  private require(
    session: AuthSession,
    action: "view" | "create" | "markPaid"
  ): void {
    const access = getInvoiceAccess(session);
    const allowed =
      (action === "view" && access.canView) ||
      (action === "create" && access.canCreate) ||
      (action === "markPaid" && access.canMarkPaid);

    if (!allowed) {
      throw new ServiceError(
        `Forbidden: missing permission invoices.${action}`,
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
      invoiceId: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<void> {
    await this.activityLogs.create({
      userId: ctx.userId,
      userName: session.fullName,
      action: input.action,
      actionCode: input.actionCode,
      module: "invoices",
      entityType: "invoice",
      entityId: input.invoiceId,
      metadata: input.metadata,
    });
  }

  async getAll(_ctx: ServiceContext, session: AuthSession): Promise<Invoice[]> {
    this.require(session, "view");
    const rows = await this.invoices.getAll();
    return rows.map(mapDbInvoiceToInvoice);
  }

  async getById(
    _ctx: ServiceContext,
    session: AuthSession,
    invoiceId: string
  ): Promise<Invoice | null> {
    this.require(session, "view");
    const row = await this.invoices.getById(invoiceId);
    if (!row) return null;
    return mapDbInvoiceToInvoice(row);
  }

  async getByReservationId(
    _ctx: ServiceContext,
    session: AuthSession,
    reservationId: string
  ): Promise<Invoice | null> {
    this.require(session, "view");
    const row = await this.invoices.getByReservationId(reservationId);
    if (!row) return null;
    return mapDbInvoiceToInvoice(row);
  }

  async create(
    ctx: ServiceContext,
    session: AuthSession,
    reservationId: string
  ): Promise<Invoice> {
    this.require(session, "create");

    const reservation = await this.reservations.getById(reservationId);
    if (!reservation) {
      throw new ServiceError("Reservation not found.", "NOT_FOUND", 404);
    }
    if (reservation.status === "cancelled") {
      throw new ServiceError(
        "Cannot generate invoice for a cancelled reservation.",
        "VALIDATION",
        400
      );
    }

    const existing = await this.invoices.getByReservationId(reservation.id);
    if (existing) {
      return mapDbInvoiceToInvoice(existing);
    }

    const roomCharges = Number(reservation.subtotal);
    const rackRate = Number(reservation.rack_rate ?? reservation.room_rate);
    const chargedRate = Number(reservation.room_rate);
    const discounts = Math.max(
      0,
      (rackRate - chargedRate) * reservation.number_of_nights
    );
    const taxes = Number(reservation.taxes);
    const serviceCharge = Number(reservation.service_charge);
    const additionalCharges = 0;
    const totalAmount = Number(reservation.total_amount);
    const amountPaid = Number(reservation.amount_paid);
    const balance = Math.max(0, totalAmount - amountPaid);
    const invoiceNumber = await this.invoices.getNextInvoiceNumber();

    const lineItems = buildInvoiceLineItems({
      numberOfNights: reservation.number_of_nights,
      roomRate: Number(reservation.room_rate),
      roomCharges,
      taxes,
      serviceCharge,
      additionalCharges,
      discounts,
      amountPaid,
    });

    const row = await this.invoices.create({
      invoice_number: invoiceNumber,
      reservation_id: reservation.id,
      guest_id: reservation.guest_id,
      invoice_date: new Date().toISOString().slice(0, 10),
      check_in_date: reservation.check_in_date,
      check_out_date: resolveEffectiveCheckOutDate({
        status: reservation.status,
        check_out_date: reservation.check_out_date,
        actual_check_out_date: reservation.actual_check_out_date,
      }),
      number_of_nights: reservation.number_of_nights,
      room_rate: Number(reservation.room_rate),
      room_charges: roomCharges,
      taxes,
      service_charge: serviceCharge,
      additional_charges: additionalCharges,
      discounts,
      total_amount: totalAmount,
      amount_paid: amountPaid,
      balance,
      status: resolveInvoiceStatus(totalAmount, amountPaid),
      line_items: lineItems,
      issued_by: ctx.userId,
    });

    await this.log(ctx, session, {
      action: "Invoice generated",
      actionCode: ActivityActionCodes.INVOICE_GENERATED,
      invoiceId: row.id,
      metadata: {
        reservationId: reservation.id,
        invoiceNumber,
        totalAmount,
        balance,
      },
    });

    const loaded = await this.invoices.getById(row.id);
    if (!loaded) {
      throw new ServiceError("Invoice not found after create.", "INTERNAL", 500);
    }
    return mapDbInvoiceToInvoice(loaded);
  }

  async markPaid(
    ctx: ServiceContext,
    session: AuthSession,
    invoiceId: string
  ): Promise<Invoice> {
    this.require(session, "markPaid");

    const existing = await this.invoices.getById(invoiceId);
    if (!existing) {
      throw new ServiceError("Invoice not found.", "NOT_FOUND", 404);
    }
    if (existing.status === "paid") {
      throw new ServiceError("Invoice is already paid.", "VALIDATION", 400);
    }

    const totalAmount = Number(existing.total_amount);
    await this.invoices.markPaid(existing.id);

    await this.reservations.update(existing.reservation_id, {
      amount_paid: totalAmount,
      balance: 0,
    });

    await this.log(ctx, session, {
      action: "Invoice marked paid",
      actionCode: ActivityActionCodes.INVOICE_PAID,
      invoiceId: existing.id,
      metadata: {
        reservationId: existing.reservation_id,
        totalAmount,
      },
    });

    const loaded = await this.invoices.getById(existing.id);
    if (!loaded) {
      throw new ServiceError("Invoice not found after update.", "INTERNAL", 500);
    }
    return mapDbInvoiceToInvoice(loaded);
  }
}
