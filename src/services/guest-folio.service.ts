import { calculateFolioBalance } from "@/lib/folio/balance";
import {
  deriveAuthoritativeSettlement,
  isFolioAuthoritative,
  resolveInvoiceStatusFromSettlement,
  resolvePaymentStatusFromSettlement,
  type AuthoritativeSettlement,
} from "@/lib/folio/authoritative-settlement";
import {
  mapDbFolioToGuestFolio,
  mapDbFolioToListItem,
} from "@/lib/folio/mapper";
import { sessionHasPermission } from "@/lib/auth/permissions";
import { roundCurrency } from "@/lib/payments/currency";
import type { IActivityLogRepository } from "@/repositories/activity-log.repository";
import type { IGuestFolioRepository } from "@/repositories/guest-folio.repository";
import type { IInvoiceRepository } from "@/repositories/invoice.repository";
import type { IPaymentRepository } from "@/repositories/payment.repository";
import type { IReservationRepository } from "@/repositories/reservation.repository";
import type { AuthSession } from "@/services/auth.service";
import { ServiceError } from "@/services/types";
import type { ServiceContext } from "@/services/types";
import { ActivityActionCodes } from "@/types/database/enums";
import type { DbReservationWithRelations, DbSaleWithRelations } from "@/types/database";
import type {
  CreateGuestFolioInput,
  FolioEntry,
  FolioListItem,
  GuestFolio,
  ManualChargeInput,
  ManualCreditInput,
  PostFolioEntryInput,
} from "@/types/folio";

const CHECKED_IN_ONLY = "Only checked-in reservations may receive folio entries.";

export interface IGuestFolioService {
  createFolio(
    ctx: ServiceContext,
    session: AuthSession,
    input: CreateGuestFolioInput
  ): Promise<GuestFolio>;
  ensureFolioForReservation(
    ctx: ServiceContext,
    session: AuthSession,
    reservation: DbReservationWithRelations
  ): Promise<GuestFolio>;
  postEntry(
    ctx: ServiceContext,
    session: AuthSession,
    input: PostFolioEntryInput
  ): Promise<FolioEntry>;
  postAccommodationCharge(
    ctx: ServiceContext,
    session: AuthSession,
    reservationId: string
  ): Promise<FolioEntry | null>;
  postPaymentCredit(
    ctx: ServiceContext,
    session: AuthSession,
    reservationId: string,
    amount: number,
    reference?: string
  ): Promise<FolioEntry>;
  postPosRoomCharge(
    ctx: ServiceContext,
    session: AuthSession,
    sale: DbSaleWithRelations
  ): Promise<FolioEntry>;
  postManualCharge(
    ctx: ServiceContext,
    session: AuthSession,
    input: ManualChargeInput
  ): Promise<FolioEntry>;
  postManualCredit(
    ctx: ServiceContext,
    session: AuthSession,
    input: ManualCreditInput
  ): Promise<FolioEntry>;
  closeFolio(
    ctx: ServiceContext,
    session: AuthSession,
    folioId: string
  ): Promise<GuestFolio>;
  calculateBalance(
    ctx: ServiceContext,
    session: AuthSession,
    reservationId: string
  ): Promise<number>;
  getFolio(
    ctx: ServiceContext,
    session: AuthSession,
    folioId: string
  ): Promise<GuestFolio | null>;
  getFolioByReservation(
    ctx: ServiceContext,
    session: AuthSession,
    reservationId: string
  ): Promise<GuestFolio | null>;
  listFolios(
    ctx: ServiceContext,
    session: AuthSession,
    options?: {
      status?: "open" | "closed" | "archived";
      fromDate?: string;
      toDate?: string;
    }
  ): Promise<FolioListItem[]>;
  listEntries(
    ctx: ServiceContext,
    session: AuthSession,
    folioId: string
  ): Promise<FolioEntry[]>;
  assertCheckoutAllowed(
    ctx: ServiceContext,
    session: AuthSession,
    reservationId: string
  ): Promise<void>;
  integrateOnCheckIn(
    ctx: ServiceContext,
    session: AuthSession,
    reservation: DbReservationWithRelations,
    options?: { skipPrepaidCredit?: boolean }
  ): Promise<void>;
  integratePaymentCredit(
    ctx: ServiceContext,
    session: AuthSession,
    reservationId: string,
    amount: number,
    reference?: string
  ): Promise<void>;
  integratePosRoomCharge(
    ctx: ServiceContext,
    session: AuthSession,
    sale: DbSaleWithRelations
  ): Promise<void>;
  integrateOnCheckOut(
    ctx: ServiceContext,
    session: AuthSession,
    reservationId: string
  ): Promise<void>;
  getAuthoritativeSettlement(
    reservationId: string
  ): Promise<AuthoritativeSettlement | null>;
  syncReservationSettlement(reservationId: string): Promise<void>;
  integratePaymentRefund(
    ctx: ServiceContext,
    session: AuthSession,
    reservationId: string,
    amount: number,
    reference?: string
  ): Promise<void>;
  integrateEarlyCheckoutAdjustment(
    ctx: ServiceContext,
    session: AuthSession,
    reservationId: string,
    amount: number,
    reference: string,
    reason: string
  ): Promise<void>;
  integrateLateCheckoutFee(
    ctx: ServiceContext,
    session: AuthSession,
    reservationId: string,
    amount: number,
    reason: string
  ): Promise<void>;
  integrateStayExtensionCharge(
    ctx: ServiceContext,
    session: AuthSession,
    reservationId: string,
    amount: number,
    extraNights: number,
    notes?: string | null
  ): Promise<void>;
  integrateRoomMoveAdjustment(
    ctx: ServiceContext,
    session: AuthSession,
    reservationId: string,
    amount: number,
    direction: "debit" | "credit",
    reason: string
  ): Promise<void>;
}

export class GuestFolioService implements IGuestFolioService {
  constructor(
    private readonly folios: IGuestFolioRepository,
    private readonly reservations: IReservationRepository,
    private readonly activityLogs: IActivityLogRepository,
    private readonly invoices?: IInvoiceRepository,
    private readonly payments?: IPaymentRepository
  ) {}

  private mapFolioEntries(
    folio: NonNullable<Awaited<ReturnType<IGuestFolioRepository["getOpenByReservationId"]>>>
  ): FolioEntry[] {
    return (folio.entries ?? []).map((entry) => ({
      id: entry.id,
      folioId: entry.folio_id,
      entryType: entry.entry_type,
      sourceModule: entry.source_module,
      sourceReference: entry.source_reference,
      description: entry.description,
      quantity: Number(entry.quantity),
      unitAmount: Number(entry.unit_amount),
      subtotal: Number(entry.subtotal),
      vatAmount: Number(entry.vat_amount),
      total: Number(entry.total),
      debitCredit: entry.debit_credit,
      createdById: entry.created_by,
      createdByName: null,
      createdAt: entry.created_at,
    }));
  }

  async getAuthoritativeSettlement(
    reservationId: string
  ): Promise<AuthoritativeSettlement | null> {
    const reservation = await this.reservations.getById(reservationId);
    if (!reservation || !isFolioAuthoritative(reservation.status)) {
      return null;
    }

    const folio = await this.folios.getOpenByReservationId(reservationId);
    if (!folio) return null;

    return deriveAuthoritativeSettlement(this.mapFolioEntries(folio));
  }

  async syncReservationSettlement(reservationId: string): Promise<void> {
    const settlement = await this.getAuthoritativeSettlement(reservationId);
    if (!settlement) return;

    const outstanding = roundCurrency(Math.max(0, settlement.outstandingBalance));

    await this.reservations.update(reservationId, {
      total_amount: settlement.totalAmount,
      amount_paid: settlement.amountPaid,
      balance: outstanding,
    });

    if (this.invoices) {
      const invoice = await this.invoices.getByReservationId(reservationId);
      if (invoice) {
        await this.invoices.update(invoice.id, {
          total_amount: settlement.totalAmount,
          amount_paid: settlement.amountPaid,
          balance: outstanding,
          status: resolveInvoiceStatusFromSettlement(
            settlement.totalAmount,
            settlement.amountPaid,
            outstanding
          ),
        });
      }
    }

    if (this.payments) {
      const payment = await this.payments.getByReservationId(reservationId);
      if (payment) {
        await this.payments.update(payment.id, {
          total_due: settlement.totalAmount,
          balance_after: outstanding,
          status: resolvePaymentStatusFromSettlement(
            settlement.totalAmount,
            outstanding
          ),
        });
      }
    }
  }

  private require(
    session: AuthSession,
    action: "view" | "create" | "edit" | "delete" | "manage"
  ): void {
    if (!sessionHasPermission(session, "guest_folio", action)) {
      throw new ServiceError(
        `Forbidden: missing permission guest_folio.${action}`,
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
      module: "guest_folio",
      entityType: "guest_folio",
      entityId: input.entityId,
      metadata: input.metadata ?? {},
      status: "success",
    });
  }

  private async assertCheckedIn(reservationId: string) {
    const reservation = await this.reservations.getById(reservationId);
    if (!reservation) {
      throw new ServiceError("Reservation not found.", "NOT_FOUND", 404);
    }
    if (reservation.status !== "checked_in") {
      throw new ServiceError(CHECKED_IN_ONLY, "VALIDATION", 400);
    }
    return reservation;
  }

  async createFolio(
    ctx: ServiceContext,
    session: AuthSession,
    input: CreateGuestFolioInput
  ): Promise<GuestFolio> {
    this.require(session, "create");
    await this.assertCheckedIn(input.reservationId);

    const existing = await this.folios.getOpenByReservationId(input.reservationId);
    if (existing) {
      return mapDbFolioToGuestFolio(existing);
    }

    const folioNumber = await this.folios.getNextFolioNumber();
    const row = await this.folios.createFolio({
      reservationId: input.reservationId,
      guestId: input.guestId,
      roomId: input.roomId ?? null,
      folioNumber,
    });

    await this.log(ctx, session, {
      action: `Guest folio opened (${folioNumber})`,
      actionCode: ActivityActionCodes.FOLIO_CREATED,
      entityId: row.id,
      metadata: { reservation_id: input.reservationId, folio_number: folioNumber },
    });

    const full = await this.folios.getById(row.id);
    if (!full) {
      throw new ServiceError("Failed to load created folio.", "INTERNAL", 500);
    }
    return mapDbFolioToGuestFolio(full);
  }

  async ensureFolioForReservation(
    ctx: ServiceContext,
    session: AuthSession,
    reservation: DbReservationWithRelations
  ): Promise<GuestFolio> {
    const existing = await this.folios.getOpenByReservationId(reservation.id);
    if (existing) {
      return mapDbFolioToGuestFolio(existing);
    }

    return this.createFolio(ctx, session, {
      reservationId: reservation.id,
      guestId: reservation.guest_id,
      roomId: reservation.room_id,
    });
  }

  async postEntry(
    ctx: ServiceContext,
    session: AuthSession,
    input: PostFolioEntryInput,
    options?: { internal?: boolean }
  ): Promise<FolioEntry> {
    if (!options?.internal) {
      this.require(session, "create");
    }
    const folio = await this.folios.getById(input.folioId);
    if (!folio || folio.status !== "open") {
      throw new ServiceError("Open folio not found.", "NOT_FOUND", 404);
    }
    await this.assertCheckedIn(folio.reservation_id);

    const row = await this.folios.postEntry({
      folioId: input.folioId,
      entryType: input.entryType,
      sourceModule: input.sourceModule,
      sourceReference: input.sourceReference ?? null,
      description: input.description,
      quantity: input.quantity ?? 1,
      unitAmount: input.unitAmount ?? input.subtotal,
      subtotal: input.subtotal,
      vatAmount: input.vatAmount ?? 0,
      total: input.total,
      debitCredit: input.debitCredit,
      createdBy: ctx.userId,
    });

    const actionCode =
      input.debitCredit === "credit"
        ? ActivityActionCodes.FOLIO_CREDIT_POSTED
        : ActivityActionCodes.FOLIO_CHARGE_POSTED;

    await this.log(ctx, session, {
      action: `Folio ${input.debitCredit} posted: ${input.description}`,
      actionCode,
      entityId: input.folioId,
      metadata: {
        entry_type: input.entryType,
        total: input.total,
        source_module: input.sourceModule,
      },
    });

    await this.syncReservationSettlement(folio.reservation_id);

    return {
      id: row.id,
      folioId: row.folio_id,
      entryType: row.entry_type,
      sourceModule: row.source_module,
      sourceReference: row.source_reference,
      description: row.description,
      quantity: Number(row.quantity),
      unitAmount: Number(row.unit_amount),
      subtotal: Number(row.subtotal),
      vatAmount: Number(row.vat_amount),
      total: Number(row.total),
      debitCredit: row.debit_credit,
      createdById: row.created_by,
      createdByName: session.fullName,
      createdAt: row.created_at,
    };
  }

  async postAccommodationCharge(
    ctx: ServiceContext,
    session: AuthSession,
    reservationId: string,
    options?: { internal?: boolean }
  ): Promise<FolioEntry | null> {
    const reservation = await this.assertCheckedIn(reservationId);
    const folio = options?.internal
      ? await this.ensureFolioInternal(reservation)
      : await this.ensureFolioForReservation(ctx, session, reservation);

    const hasCharge = await this.folios.hasEntryType(folio.id, "accommodation");
    if (hasCharge) return null;

    const subtotal = roundCurrency(Number(reservation.subtotal));
    const vatAmount = roundCurrency(Number(reservation.taxes));
    const total = roundCurrency(Number(reservation.total_amount));

    return this.postEntry(
      ctx,
      session,
      {
        folioId: folio.id,
        entryType: "accommodation",
        sourceModule: "reservations",
        sourceReference: reservation.reservation_number,
        description: "Accommodation Charge",
        subtotal,
        vatAmount,
        total,
        debitCredit: "debit",
      },
      options
    );
  }

  private async ensureFolioInternal(reservation: DbReservationWithRelations) {
    const existing = await this.folios.getOpenByReservationId(reservation.id);
    if (existing) {
      return mapDbFolioToGuestFolio(existing);
    }
    const folioNumber = await this.folios.getNextFolioNumber();
    const row = await this.folios.createFolio({
      reservationId: reservation.id,
      guestId: reservation.guest_id,
      roomId: reservation.room_id,
      folioNumber,
    });
    const full = await this.folios.getById(row.id);
    if (!full) {
      throw new ServiceError("Failed to load created folio.", "INTERNAL", 500);
    }
    return mapDbFolioToGuestFolio(full);
  }

  async postPaymentCredit(
    ctx: ServiceContext,
    session: AuthSession,
    reservationId: string,
    amount: number,
    reference?: string,
    options?: { internal?: boolean }
  ): Promise<FolioEntry> {
    const reservation = await this.assertCheckedIn(reservationId);
    const folio = options?.internal
      ? await this.ensureFolioInternal(reservation)
      : await this.ensureFolioForReservation(ctx, session, reservation);
    const total = roundCurrency(amount);

    const entry = await this.postEntry(
      ctx,
      session,
      {
        folioId: folio.id,
        entryType: "payment",
        sourceModule: "payments",
        sourceReference: reference ?? null,
        description: reference ? `Payment (${reference})` : "Payment",
        subtotal: total,
        vatAmount: 0,
        total,
        debitCredit: "credit",
      },
      options
    );

    if (!options?.internal) {
      await this.log(ctx, session, {
        action: `Payment posted to folio ${folio.folioNumber}`,
        actionCode: ActivityActionCodes.FOLIO_PAYMENT_POSTED,
        entityId: folio.id,
        metadata: { amount: total, reference },
      });
    }

    return entry;
  }

  async postPosRoomCharge(
    ctx: ServiceContext,
    session: AuthSession,
    sale: DbSaleWithRelations,
    options?: { internal?: boolean }
  ): Promise<FolioEntry> {
    if (!sale.reservation_id) {
      throw new ServiceError("Sale is not linked to a reservation.", "VALIDATION", 400);
    }

    const reservation = await this.assertCheckedIn(sale.reservation_id);
    const folio = options?.internal
      ? await this.ensureFolioInternal(reservation)
      : await this.ensureFolioForReservation(ctx, session, reservation);

    return this.postEntry(
      ctx,
      session,
      {
        folioId: folio.id,
        entryType: "retail_pos",
        sourceModule: "pos",
        sourceReference: sale.sale_number,
        description: `Retail POS — ${sale.sale_number}`,
        subtotal: roundCurrency(Number(sale.subtotal)),
        vatAmount: roundCurrency(Number(sale.vat_amount)),
        total: roundCurrency(Number(sale.total)),
        debitCredit: "debit",
      },
      options
    );
  }

  async postManualCharge(
    ctx: ServiceContext,
    session: AuthSession,
    input: ManualChargeInput
  ): Promise<FolioEntry> {
    this.require(session, "create");
    const folio = await this.folios.getById(input.folioId);
    if (!folio) {
      throw new ServiceError("Folio not found.", "NOT_FOUND", 404);
    }

    const vatAmount = roundCurrency(input.vatAmount ?? 0);
    const subtotal = roundCurrency(input.amount);
    const total = roundCurrency(subtotal + vatAmount);

    return this.postEntry(ctx, session, {
      folioId: input.folioId,
      entryType: "manual_charge",
      sourceModule: "guest_folio",
      description: input.description,
      subtotal,
      vatAmount,
      total,
      debitCredit: "debit",
    });
  }

  async postManualCredit(
    ctx: ServiceContext,
    session: AuthSession,
    input: ManualCreditInput
  ): Promise<FolioEntry> {
    if (!sessionHasPermission(session, "guest_folio", "manage")) {
      throw new ServiceError(
        "Manual credits require guest_folio.manage permission.",
        "FORBIDDEN",
        403
      );
    }

    const total = roundCurrency(input.amount);
    return this.postEntry(ctx, session, {
      folioId: input.folioId,
      entryType: "discount",
      sourceModule: "guest_folio",
      description: input.description,
      subtotal: total,
      vatAmount: 0,
      total,
      debitCredit: "credit",
    });
  }

  async closeFolio(
    ctx: ServiceContext,
    session: AuthSession,
    folioId: string
  ): Promise<GuestFolio> {
    this.require(session, "manage");
    const folio = await this.folios.getById(folioId);
    if (!folio) {
      throw new ServiceError("Folio not found.", "NOT_FOUND", 404);
    }

    const balance = calculateFolioBalance(
      (folio.entries ?? []).map((entry) => ({
        id: entry.id,
        folioId: entry.folio_id,
        entryType: entry.entry_type,
        sourceModule: entry.source_module,
        sourceReference: entry.source_reference,
        description: entry.description,
        quantity: Number(entry.quantity),
        unitAmount: Number(entry.unit_amount),
        subtotal: Number(entry.subtotal),
        vatAmount: Number(entry.vat_amount),
        total: Number(entry.total),
        debitCredit: entry.debit_credit,
        createdById: entry.created_by,
        createdByName: null,
        createdAt: entry.created_at,
      }))
    );

    if (balance !== 0) {
      throw new ServiceError(
        "Folio cannot be closed while an outstanding balance remains.",
        "VALIDATION",
        400
      );
    }

    await this.folios.closeFolio(folioId);
    await this.log(ctx, session, {
      action: `Folio closed (${folio.folio_number})`,
      actionCode: ActivityActionCodes.FOLIO_CLOSED,
      entityId: folioId,
    });

    const full = await this.folios.getById(folioId);
    if (!full) {
      throw new ServiceError("Failed to load closed folio.", "INTERNAL", 500);
    }
    return mapDbFolioToGuestFolio(full);
  }

  async calculateBalance(
    _ctx: ServiceContext,
    session: AuthSession,
    reservationId: string
  ): Promise<number> {
    this.require(session, "view");
    const folio = await this.folios.getOpenByReservationId(reservationId);
    if (!folio) return 0;
    return calculateFolioBalance(
      (folio.entries ?? []).map((entry) => ({
        id: entry.id,
        folioId: entry.folio_id,
        entryType: entry.entry_type,
        sourceModule: entry.source_module,
        sourceReference: entry.source_reference,
        description: entry.description,
        quantity: Number(entry.quantity),
        unitAmount: Number(entry.unit_amount),
        subtotal: Number(entry.subtotal),
        vatAmount: Number(entry.vat_amount),
        total: Number(entry.total),
        debitCredit: entry.debit_credit,
        createdById: entry.created_by,
        createdByName: null,
        createdAt: entry.created_at,
      }))
    );
  }

  async getFolio(
    _ctx: ServiceContext,
    session: AuthSession,
    folioId: string
  ): Promise<GuestFolio | null> {
    this.require(session, "view");
    const row = await this.folios.getById(folioId);
    return row ? mapDbFolioToGuestFolio(row) : null;
  }

  async getFolioByReservation(
    _ctx: ServiceContext,
    session: AuthSession,
    reservationId: string
  ): Promise<GuestFolio | null> {
    this.require(session, "view");
    const row = await this.folios.getOpenByReservationId(reservationId);
    return row ? mapDbFolioToGuestFolio(row) : null;
  }

  async listFolios(
    _ctx: ServiceContext,
    session: AuthSession,
    options?: {
      status?: "open" | "closed" | "archived";
      fromDate?: string;
      toDate?: string;
    }
  ): Promise<FolioListItem[]> {
    this.require(session, "view");
    const rows = await this.folios.list(options);
    return rows.map(mapDbFolioToListItem);
  }

  async listEntries(
    _ctx: ServiceContext,
    session: AuthSession,
    folioId: string
  ): Promise<FolioEntry[]> {
    this.require(session, "view");
    const folio = await this.getFolio(_ctx, session, folioId);
    return folio?.entries ?? [];
  }

  async assertCheckoutAllowed(
    _ctx: ServiceContext,
    session: AuthSession,
    reservationId: string
  ): Promise<void> {
    const balance = await this.calculateBalance(_ctx, session, reservationId);
    if (balance <= 0) return;

    const canOverride =
      sessionHasPermission(session, "guest_folio", "manage") ||
      sessionHasPermission(session, "check_out", "manage");

    if (!canOverride) {
      throw new ServiceError(
        `Outstanding folio balance of ${balance} must be settled before check-out.`,
        "VALIDATION",
        400
      );
    }
  }

  async integrateOnCheckIn(
    ctx: ServiceContext,
    session: AuthSession,
    reservation: DbReservationWithRelations,
    options?: { skipPrepaidCredit?: boolean }
  ): Promise<void> {
    await this.postAccommodationCharge(ctx, session, reservation.id, { internal: true });
    if (!options?.skipPrepaidCredit) {
      const amountPaid = roundCurrency(Number(reservation.amount_paid));
      if (amountPaid > 0) {
        await this.postPaymentCredit(
          ctx,
          session,
          reservation.id,
          amountPaid,
          reservation.reservation_number,
          { internal: true }
        );
      }
    }
    const folio = await this.folios.getOpenByReservationId(reservation.id);
    if (folio) {
      await this.log(ctx, session, {
        action: `Guest folio opened (${folio.folio_number})`,
        actionCode: ActivityActionCodes.FOLIO_CREATED,
        entityId: folio.id,
        metadata: {
          reservation_id: reservation.id,
          folio_number: folio.folio_number,
          source: "check_in",
        },
      });
    }

    await this.syncReservationSettlement(reservation.id);
  }

  async integratePaymentCredit(
    ctx: ServiceContext,
    session: AuthSession,
    reservationId: string,
    amount: number,
    reference?: string
  ): Promise<void> {
    await this.postPaymentCredit(ctx, session, reservationId, amount, reference, {
      internal: true,
    });
  }

  async integratePosRoomCharge(
    ctx: ServiceContext,
    session: AuthSession,
    sale: DbSaleWithRelations
  ): Promise<void> {
    await this.postPosRoomCharge(ctx, session, sale, { internal: true });
  }

  async integratePaymentRefund(
    ctx: ServiceContext,
    session: AuthSession,
    reservationId: string,
    amount: number,
    reference?: string
  ): Promise<void> {
    const total = roundCurrency(amount);
    if (total <= 0) return;

    const reservation = await this.assertCheckedIn(reservationId);
    const folio = await this.ensureFolioInternal(reservation);

    await this.postEntry(
      ctx,
      session,
      {
        folioId: folio.id,
        entryType: "refund",
        sourceModule: "payments",
        sourceReference: reference ?? null,
        description: reference ? `Refund (${reference})` : "Payment refund",
        subtotal: total,
        vatAmount: 0,
        total,
        debitCredit: "debit",
      },
      { internal: true }
    );
  }

  private async postStayModificationEntry(
    ctx: ServiceContext,
    session: AuthSession,
    reservationId: string,
    input: {
      entryType: FolioEntry["entryType"];
      description: string;
      amount: number;
      debitCredit: "debit" | "credit";
      sourceReference?: string | null;
    }
  ): Promise<void> {
    const total = roundCurrency(input.amount);
    if (total <= 0) return;

    const reservation = await this.assertCheckedIn(reservationId);
    const folio = await this.ensureFolioInternal(reservation);

    await this.postEntry(
      ctx,
      session,
      {
        folioId: folio.id,
        entryType: input.entryType,
        sourceModule: "reservations",
        sourceReference: input.sourceReference ?? null,
        description: input.description,
        subtotal: total,
        vatAmount: 0,
        total,
        debitCredit: input.debitCredit,
      },
      { internal: true }
    );
  }

  async integrateEarlyCheckoutAdjustment(
    ctx: ServiceContext,
    session: AuthSession,
    reservationId: string,
    amount: number,
    reference: string,
    reason: string
  ): Promise<void> {
    await this.postStayModificationEntry(ctx, session, reservationId, {
      entryType: "adjustment",
      description: `Early check-out adjustment — ${reason}`,
      amount,
      debitCredit: "credit",
      sourceReference: reference,
    });
  }

  async integrateLateCheckoutFee(
    ctx: ServiceContext,
    session: AuthSession,
    reservationId: string,
    amount: number,
    reason: string
  ): Promise<void> {
    await this.postStayModificationEntry(ctx, session, reservationId, {
      entryType: "misc_charge",
      description: `Late check-out fee — ${reason}`,
      amount,
      debitCredit: "debit",
    });
  }

  async integrateStayExtensionCharge(
    ctx: ServiceContext,
    session: AuthSession,
    reservationId: string,
    amount: number,
    extraNights: number,
    notes?: string | null
  ): Promise<void> {
    const suffix = notes?.trim() ? ` — ${notes.trim()}` : "";
    await this.postStayModificationEntry(ctx, session, reservationId, {
      entryType: "accommodation",
      description: `Stay extension (${extraNights} night${extraNights === 1 ? "" : "s"})${suffix}`,
      amount,
      debitCredit: "debit",
    });
  }

  async integrateRoomMoveAdjustment(
    ctx: ServiceContext,
    session: AuthSession,
    reservationId: string,
    amount: number,
    direction: "debit" | "credit",
    reason: string
  ): Promise<void> {
    const label =
      direction === "debit" ? "Room move upgrade" : "Room move downgrade";
    await this.postStayModificationEntry(ctx, session, reservationId, {
      entryType: "adjustment",
      description: `${label} — ${reason}`,
      amount,
      debitCredit: direction,
    });
  }

  async integrateOnCheckOut(
    ctx: ServiceContext,
    session: AuthSession,
    reservationId: string
  ): Promise<void> {
    const folio = await this.folios.getOpenByReservationId(reservationId);
    if (!folio) return;

    const balance = calculateFolioBalance(
      (folio.entries ?? []).map((entry) => ({
        id: entry.id,
        folioId: entry.folio_id,
        entryType: entry.entry_type,
        sourceModule: entry.source_module,
        sourceReference: entry.source_reference,
        description: entry.description,
        quantity: Number(entry.quantity),
        unitAmount: Number(entry.unit_amount),
        subtotal: Number(entry.subtotal),
        vatAmount: Number(entry.vat_amount),
        total: Number(entry.total),
        debitCredit: entry.debit_credit,
        createdById: entry.created_by,
        createdByName: null,
        createdAt: entry.created_at,
      }))
    );

    if (balance === 0) {
      await this.folios.closeFolio(folio.id);
      await this.log(ctx, session, {
        action: `Folio closed on check-out (${folio.folio_number})`,
        actionCode: ActivityActionCodes.FOLIO_CLOSED,
        entityId: folio.id,
        metadata: { reservation_id: reservationId },
      });
    }
  }
}
