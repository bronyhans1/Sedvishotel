import { getWalkInAccess } from "@/lib/auth/walk-in-access";
import { computeVatOnBase, computeInvoiceTotal } from "@/lib/payments/payment-settlement";
import { buildProgrammaticPaymentIdempotencyKey } from "@/lib/payments/atomic-commit";
import { resolvePaymentTransactionVat } from "@/lib/payments/resolve-vat";
import { roundCurrency } from "@/lib/payments/currency";
import { normalizeRoomNumber } from "@/lib/rooms/floor-layout";
import type { IActivityLogRepository } from "@/repositories/activity-log.repository";
import type { IGuestRepository } from "@/repositories/guest.repository";
import type { IPaymentRepository } from "@/repositories/payment.repository";
import type { IReservationRepository } from "@/repositories/reservation.repository";
import type { IRoomRepository } from "@/repositories/room.repository";
import type { ISettingsRepository } from "@/repositories/settings.repository";
import type { AuthSession } from "@/services/auth.service";
import { ServiceError } from "@/services/types";
import type { ServiceContext } from "@/services/types";
import { ActivityActionCodes } from "@/types/database/enums";
import type { DbPaymentStatus } from "@/types/database";
import type {
  WalkInFormValues,
  WalkInResult,
  WalkInRoomOption,
} from "@/types/walk-in";
import { nightsBetween } from "@/lib/utils";
import { resolveFloorLabel } from "@/lib/rooms/mapper";

export interface IWalkInService {
  getAvailableRooms(
    ctx: ServiceContext,
    session: AuthSession,
    checkIn: string,
    checkOut: string
  ): Promise<WalkInRoomOption[]>;
  completeWalkIn(
    ctx: ServiceContext,
    session: AuthSession,
    values: WalkInFormValues
  ): Promise<WalkInResult>;
}

function resolvePaymentStatus(
  totalDue: number,
  amountPaid: number
): DbPaymentStatus {
  const balance = Math.max(0, totalDue - amountPaid);
  if (balance <= 0) return "paid";
  if (amountPaid > 0) return "partial";
  return "pending";
}

export class WalkInService implements IWalkInService {
  constructor(
    private readonly guests: IGuestRepository,
    private readonly reservations: IReservationRepository,
    private readonly rooms: IRoomRepository,
    private readonly payments: IPaymentRepository,
    private readonly activityLogs: IActivityLogRepository,
    private readonly settings: ISettingsRepository,
    private readonly folios?: import("@/services/guest-folio.service").IGuestFolioService
  ) {}

  private requireComplete(session: AuthSession): void {
    if (!getWalkInAccess(session).canComplete) {
      throw new ServiceError(
        "Forbidden: walk_in.create or walk_in.manage required.",
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
      module: string;
      entityType: string;
      entityId: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<void> {
    await this.activityLogs.create({
      userId: ctx.userId,
      userName: session.fullName,
      action: input.action,
      actionCode: input.actionCode,
      module: input.module,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: input.metadata,
    });
  }

  async getAvailableRooms(
    _ctx: ServiceContext,
    session: AuthSession,
    checkIn: string,
    checkOut: string
  ): Promise<WalkInRoomOption[]> {
    if (!getWalkInAccess(session).canView) {
      throw new ServiceError("Forbidden: walk_in.view required.", "FORBIDDEN", 403);
    }
    if (!checkIn || !checkOut || checkOut <= checkIn) {
      return [];
    }

    const roomIds = await this.reservations.checkAvailability({
      checkIn,
      checkOut,
    });
    const allRooms = await this.rooms.getAll(false);

    return allRooms
      .filter((room) => room.status === "available" && roomIds.includes(room.id))
      .map((room) => ({
        id: room.id,
        roomNumber: room.room_number,
        roomType: room.room_type.name,
        price: Number(room.room_type.default_price),
        floorLabel: resolveFloorLabel(room),
      }));
  }

  async completeWalkIn(
    ctx: ServiceContext,
    session: AuthSession,
    values: WalkInFormValues
  ): Promise<WalkInResult> {
    this.requireComplete(session);

    if (!values.fullName.trim()) {
      throw new ServiceError("Guest name is required.", "VALIDATION", 400);
    }
    if (!values.roomNumber) {
      throw new ServiceError("Room is required.", "VALIDATION", 400);
    }
    if (!values.checkInDate || !values.checkOutDate) {
      throw new ServiceError("Stay dates are required.", "VALIDATION", 400);
    }
    if (values.checkOutDate <= values.checkInDate) {
      throw new ServiceError("Check-out must be after check-in.", "VALIDATION", 400);
    }
    if (values.amountPaid < 0) {
      throw new ServiceError("Amount paid cannot be negative.", "VALIDATION", 400);
    }

    const room = await this.rooms.getByNumber(
      normalizeRoomNumber(values.roomNumber)
    );
    if (!room) {
      throw new ServiceError("Room not found.", "NOT_FOUND", 404);
    }
    if (room.status !== "available") {
      throw new ServiceError(
        "Only available rooms can be assigned for walk-in.",
        "CONFLICT",
        409
      );
    }

    const availableIds = await this.reservations.checkAvailability({
      checkIn: values.checkInDate,
      checkOut: values.checkOutDate,
    });
    if (!availableIds.includes(room.id)) {
      throw new ServiceError(
        "Room is not available for the selected dates.",
        "CONFLICT",
        409
      );
    }

    let guestId: string;
    let guestCreated = false;
    const email = values.email.trim();

    if (email) {
      const existing = await this.guests.findByEmail(email);
      if (existing) {
        guestId = existing.id;
        await this.guests.update(guestId, {
          full_name: values.fullName.trim(),
          phone: values.phone.trim() || null,
          nationality: values.nationality.trim() || null,
          id_type: values.idType,
          id_number: values.idNumber.trim() || null,
          guest_status: "in_house",
        });
      } else {
        const created = await this.guests.create({
          full_name: values.fullName.trim(),
          phone: values.phone.trim() || null,
          email,
          nationality: values.nationality.trim() || null,
          id_type: values.idType,
          id_number: values.idNumber.trim() || null,
          address: "Walk-in registration",
          guest_status: "in_house",
          vip_status: false,
          notes: ["Walk-in guest"],
          document_urls: [],
        });
        guestId = created.id;
        guestCreated = true;
      }
    } else {
      const created = await this.guests.create({
        full_name: values.fullName.trim(),
        phone: values.phone.trim() || null,
        email: null,
        nationality: values.nationality.trim() || null,
        id_type: values.idType,
        id_number: values.idNumber.trim() || null,
        address: "Walk-in registration",
        guest_status: "in_house",
        vip_status: false,
        notes: ["Walk-in guest"],
        document_urls: [],
      });
      guestId = created.id;
      guestCreated = true;
    }

    if (guestCreated) {
      await this.log(ctx, session, {
        action: `Created guest ${values.fullName.trim()}`,
        actionCode: ActivityActionCodes.GUEST_CREATED,
        module: "guests",
        entityType: "guest",
        entityId: guestId,
        metadata: { source: "walk_in" },
      });
    }

    const roomRate = Number(room.room_type.default_price);
    const numberOfNights = nightsBetween(values.checkInDate, values.checkOutDate);
    const subtotal = roomRate * numberOfNights;
    const discount = roundCurrency(values.discount ?? 0);
    const taxSettings = await this.settings.getTaxAndCharges();
    const taxRate = taxSettings?.taxRate ?? 0.15;
    const globalVatEnabled = taxRate > 0;
    const vatApplied = globalVatEnabled && (values.vatApplied ?? true);
    const chargeBase = roundCurrency(Math.max(0, subtotal - discount));
    const taxes = vatApplied ? computeVatOnBase(chargeBase, taxRate) : 0;
    const totalAmount = computeInvoiceTotal(chargeBase, vatApplied, taxRate);
    const amountPaid = roundCurrency(values.amountPaid);
    const balance = Math.max(0, roundCurrency(totalAmount - amountPaid));
    const now = new Date().toISOString();

    const reservation = await this.reservations.create({
      guest_id: guestId,
      room_id: room.id,
      room_type_id: room.room_type_id,
      check_in_date: values.checkInDate,
      check_out_date: values.checkOutDate,
      adults: 1,
      children: 0,
      status: "checked_in",
      booking_source: "walk_in",
      room_rate: roomRate,
      number_of_nights: numberOfNights,
      subtotal,
      taxes,
      service_charge: 0,
      total_amount: totalAmount,
      amount_paid: amountPaid,
      balance,
      special_requests: null,
      internal_notes: "Walk-in booking",
      created_by: ctx.userId,
      cancelled_at: null,
      checked_in_at: now,
      checked_out_at: null,
      original_check_out_date: null,
      actual_check_out_date: null,
      early_checkout_reason: null,
      early_checkout_notes: null,
      early_checkout_refund_amount: null,
      late_checkout_fee: null,
      late_checkout_reason: null,
      late_checkout_notes: null,
      late_checkout_at: null,
      late_checkout_complimentary: false,
      late_checkout_hours_late: null,
      late_checkout_policy_type: null,
      stay_extension_history: [],
      room_move_history: [],
    });

    await this.reservations.linkGuest(reservation.id, guestId, "primary");

    await this.log(ctx, session, {
      action: `Created reservation ${reservation.reservation_number}`,
      actionCode: ActivityActionCodes.RESERVATION_CREATED,
      module: "reservations",
      entityType: "reservation",
      entityId: reservation.id,
      metadata: { source: "walk_in", booking_source: "walk_in" },
    });

    await this.log(ctx, session, {
      action: `Checked in ${reservation.reservation_number}`,
      actionCode: ActivityActionCodes.RESERVATION_CHECKED_IN,
      module: "reservations",
      entityType: "reservation",
      entityId: reservation.id,
      metadata: { source: "walk_in" },
    });

    await this.rooms.changeStatus(room.id, "occupied");
    await this.log(ctx, session, {
      action: `Room ${room.room_number} marked occupied (walk-in)`,
      actionCode: ActivityActionCodes.ROOM_STATUS_CHANGED,
      module: "rooms",
      entityType: "room",
      entityId: room.id,
      metadata: {
        reservation_id: reservation.id,
        previous_status: "available",
        new_status: "occupied",
      },
    });

    const reservationDetail = await this.reservations.getById(reservation.id);
    if (this.folios && reservationDetail) {
      await this.folios.integrateOnCheckIn(ctx, session, reservationDetail, {
        skipPrepaidCredit: true,
      });
    }

    let paymentId: string | undefined;
    if (amountPaid > 0) {
      const vatResolution = resolvePaymentTransactionVat(
        session,
        ctx,
        {
          guestId,
          reservationId: reservation.id,
          amount: amountPaid,
          method: values.paymentMethod,
          referenceNumber: "",
          notes: values.paymentNotes?.trim() ?? "Walk-in payment",
          vatApplied: values.vatApplied,
          vatExemptionReason: values.vatExemptionReason,
          vatExemptionNotes: values.vatExemptionNotes,
        },
        taxRate,
        chargeBase,
        now
      );
      const { vatOverridden: _vatOverridden, ...transactionVatFields } =
        vatResolution;

      const commitResult = await this.payments.commitPaymentAtomically({
        idempotencyKey: buildProgrammaticPaymentIdempotencyKey(
          "walk_in",
          reservation.id
        ),
        mode: "new",
        reservationId: reservation.id,
        guestId,
        recordedBy: ctx.userId,
        paymentMethod: values.paymentMethod,
        paymentAmount: amountPaid,
        totalDue: totalAmount,
        balanceAfter: balance,
        paymentStatus: resolvePaymentStatus(totalAmount, amountPaid),
        paymentDate: now,
        paymentNotes: values.paymentNotes?.trim() || "Walk-in payment",
        transaction: {
          description: "Walk-in payment",
          amount: amountPaid,
          method: values.paymentMethod,
          transacted_at: now,
          ...transactionVatFields,
        },
        reservationAmountPaid: amountPaid,
        reservationBalance: balance,
        reservationTotalAmount: totalAmount,
        reservationTaxes: taxes,
        postFolioCredit: Boolean(this.folios),
        folioCreditAmount: amountPaid,
      });
      paymentId = commitResult.paymentId;

      if (!commitResult.idempotentReplay) {
        await this.log(ctx, session, {
          action: "Payment recorded",
          actionCode: ActivityActionCodes.PAYMENT_RECORDED,
          module: "payments",
          entityType: "payment",
          entityId: commitResult.paymentId,
          metadata: {
            reservation_id: reservation.id,
            amount: amountPaid,
            source: "walk_in",
            vat_applied: transactionVatFields.vat_applied,
            vat_amount: transactionVatFields.vat_amount,
          },
        });

        if (vatResolution.vatOverridden) {
          await this.log(ctx, session, {
            action: "VAT overridden on payment",
            actionCode: ActivityActionCodes.PAYMENT_VAT_OVERRIDDEN,
            module: "payments",
            entityType: "payment",
            entityId: commitResult.paymentId,
            metadata: {
              source: "walk_in",
              vat_applied: transactionVatFields.vat_applied,
              exemption_reason: transactionVatFields.vat_exemption_reason,
            },
          });
        }

        if (this.folios) {
          await this.folios.syncReservationSettlement(reservation.id);
        }
      }
    }

    return {
      guestId,
      reservationId: reservation.id,
      paymentId,
    };
  }
}
