import { getCheckInAccess } from "@/lib/auth/check-in-access";
import { getCheckOutAccess } from "@/lib/auth/check-out-access";
import { getReservationAccess } from "@/lib/auth/reservation-access";
import { getTodayDateString } from "@/lib/dates/today";
import { combineDateAndTime, getCurrentTimeString } from "@/lib/dates/time";
import { roundCurrency, computeOutstandingBalance } from "@/lib/payments/currency";
import { computeTransactionTotals } from "@/lib/payments/totals";
import { sessionHasPermission } from "@/lib/auth/permissions";
import { TAX_RATE } from "@/lib/reservations/constants";
import { mapDbReservationToReservation } from "@/lib/reservations/mapper";
import {
  canEarlyCheckOut,
  computeEarlyCheckout,
} from "@/lib/reservations/early-checkout";
import {
  canExtendStay,
  computeStayExtension,
} from "@/lib/reservations/extend-stay";
import {
  canMoveRoom,
  computeRoomMovePriceDifference,
} from "@/lib/reservations/room-move";
import { canLateCheckOut } from "@/lib/reservations/late-checkout";
import {
  computeLateCheckoutFee,
  lateCheckoutPolicyLabel,
} from "@/lib/reservations/late-checkout-fee";
import { buildActiveStaysFromReservations } from "@/lib/stays/mapper";
import { computeStayStats } from "@/lib/stays/stats";
import { normalizeRoomNumber } from "@/lib/rooms/floor-layout";
import { resolveFloorLabel } from "@/lib/rooms/mapper";
import type { IActivityLogRepository } from "@/repositories/activity-log.repository";
import type { IGuestRepository } from "@/repositories/guest.repository";
import type {
  AvailabilityQuery,
  IReservationRepository,
} from "@/repositories/reservation.repository";
import type { IRoomRepository } from "@/repositories/room.repository";
import type { IPaymentRepository } from "@/repositories/payment.repository";
import type { IPaymentService } from "@/services/payment.service";
import type { AuthSession } from "@/services/auth.service";
import { ServiceError } from "@/services/types";
import type { ServiceContext } from "@/services/types";
import { ActivityActionCodes } from "@/types/database/enums";
import type {
  DbReservation,
  DbReservationStatus,
  DbReservationWithRelations,
  DbRoomStatus,
} from "@/types/database";
import type { EarlyCheckOutInput, EarlyCheckOutPreview } from "@/types/early-checkout";
import type {
  CheckoutPolicy,
  LateCheckOutInput,
  LateCheckOutPreview,
} from "@/types/late-checkout";
import type { ExtendStayInput, ExtendStayPreview } from "@/types/extend-stay";
import type { RoomMoveInput, RoomMovePreview } from "@/types/room-move";
import type { TransactionPaymentMethod } from "@/types/payment";
import type { Reservation, ReservationFormValues } from "@/types/reservation";
import type { ActiveStay, StayStats } from "@/types/stay";
import { nightsBetween } from "@/lib/utils";

export type AvailableRoom = {
  roomNumber: string;
  status: DbRoomStatus;
  floorLabel: string;
  roomTypeName: string;
  nightlyRate: number;
};

export type CheckInPageStats = {
  todayArrivals: number;
  pendingCheckIns: number;
  completedCheckInsToday: number;
  walkInsToday: number;
};

export type CheckOutPageStats = {
  departuresToday: number;
  pendingCheckOuts: number;
  completedCheckOutsToday: number;
  roomsAwaitingCleaning: number;
};

export interface IReservationService {
  listReservations(ctx: ServiceContext, session: AuthSession): Promise<Reservation[]>;
  getReservationById(
    ctx: ServiceContext,
    session: AuthSession,
    id: string
  ): Promise<Reservation | null>;
  createReservation(
    ctx: ServiceContext,
    session: AuthSession,
    values: ReservationFormValues
  ): Promise<Reservation>;
  updateReservation(
    ctx: ServiceContext,
    session: AuthSession,
    id: string,
    values: ReservationFormValues
  ): Promise<Reservation>;
  cancelReservation(
    ctx: ServiceContext,
    session: AuthSession,
    id: string,
    reason?: string
  ): Promise<Reservation>;
  checkAvailability(
    ctx: ServiceContext,
    session: AuthSession,
    query: AvailabilityQuery
  ): Promise<AvailableRoom[]>;
  listPendingCheckIns(
    ctx: ServiceContext,
    session: AuthSession,
    asOfDate?: string
  ): Promise<Reservation[]>;
  listCheckedInReservations(
    ctx: ServiceContext,
    session: AuthSession
  ): Promise<Reservation[]>;
  getCheckInPageStats(
    ctx: ServiceContext,
    session: AuthSession,
    asOfDate?: string
  ): Promise<CheckInPageStats>;
  getCheckOutPageStats(
    ctx: ServiceContext,
    session: AuthSession,
    asOfDate?: string
  ): Promise<CheckOutPageStats>;
  completeCheckIn(
    ctx: ServiceContext,
    session: AuthSession,
    reservationId: string
  ): Promise<Reservation>;
  completeCheckOut(
    ctx: ServiceContext,
    session: AuthSession,
    reservationId: string
  ): Promise<Reservation>;
  previewEarlyCheckOut(
    ctx: ServiceContext,
    session: AuthSession,
    reservationId: string,
    actualCheckOutDate?: string
  ): Promise<EarlyCheckOutPreview>;
  completeEarlyCheckOut(
    ctx: ServiceContext,
    session: AuthSession,
    reservationId: string,
    input: EarlyCheckOutInput,
    paymentService: IPaymentService,
    payments: IPaymentRepository
  ): Promise<Reservation>;
  previewLateCheckOut(
    ctx: ServiceContext,
    session: AuthSession,
    reservationId: string,
    policy: CheckoutPolicy,
    actualCheckoutTime?: string,
    complimentary?: boolean
  ): Promise<LateCheckOutPreview>;
  completeLateCheckOut(
    ctx: ServiceContext,
    session: AuthSession,
    reservationId: string,
    input: LateCheckOutInput,
    policy: CheckoutPolicy,
    paymentService: IPaymentService,
    payments: IPaymentRepository
  ): Promise<Reservation>;
  previewExtendStay(
    ctx: ServiceContext,
    session: AuthSession,
    reservationId: string,
    newCheckOutDate: string
  ): Promise<ExtendStayPreview>;
  completeExtendStay(
    ctx: ServiceContext,
    session: AuthSession,
    reservationId: string,
    input: ExtendStayInput,
    paymentService: IPaymentService,
    payments: IPaymentRepository
  ): Promise<Reservation>;
  previewRoomMove(
    ctx: ServiceContext,
    session: AuthSession,
    reservationId: string,
    newRoomNumber?: string
  ): Promise<RoomMovePreview>;
  completeRoomMove(
    ctx: ServiceContext,
    session: AuthSession,
    reservationId: string,
    input: RoomMoveInput,
    paymentService: IPaymentService,
    payments: IPaymentRepository
  ): Promise<Reservation>;
  listActiveStays(
    ctx: ServiceContext,
    session: AuthSession
  ): Promise<ActiveStay[]>;
  getStayPageStats(
    ctx: ServiceContext,
    session: AuthSession,
    asOfDate?: string
  ): Promise<StayStats>;
}

export class ReservationService implements IReservationService {
  constructor(
    private readonly reservations: IReservationRepository,
    private readonly guests: IGuestRepository,
    private readonly rooms: IRoomRepository,
    private readonly activityLogs: IActivityLogRepository
  ) {}

  private require(
    session: AuthSession,
    action: "view" | "create" | "edit" | "delete" | "manage"
  ): void {
    if (!sessionHasPermission(session, "reservations", action)) {
      throw new ServiceError(
        `Forbidden: missing permission reservations.${action}`,
        "FORBIDDEN",
        403
      );
    }
  }

  private requireStayOperations(session: AuthSession): void {
    const canOperate =
      getCheckOutAccess(session).canProcess ||
      getReservationAccess(session).canEdit;
    if (!canOperate) {
      throw new ServiceError(
        "Forbidden: check_out.edit or reservations.edit required.",
        "FORBIDDEN",
        403
      );
    }
  }

  private async syncPaymentLedgerAfterTotalChange(
    reservationId: string,
    newTotal: number,
    payments: IPaymentRepository
  ): Promise<void> {
    const payment = await payments.getByReservationId(reservationId);
    if (!payment) return;

    const transactions = await payments.getTransactions(payment.id);
    const totals = computeTransactionTotals(transactions);
    await payments.update(payment.id, {
      total_due: newTotal,
      balance_after: computeOutstandingBalance(newTotal, totals.netPaid),
    });
  }

  private async resolveRow(id: string) {
    const row = await this.reservations.getById(id);
    if (!row) {
      throw new ServiceError("Reservation not found.", "NOT_FOUND", 404);
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
      module: "reservations",
      entityType: "reservation",
      entityId: input.entityId,
      metadata: input.metadata,
    });
  }

  private computeFinancials(roomRate: number, checkIn: string, checkOut: string) {
    const numberOfNights = nightsBetween(checkIn, checkOut);
    const subtotal = roomRate * numberOfNights;
    const taxes = Math.round(subtotal * TAX_RATE);
    const totalAmount = subtotal + taxes;
    return { numberOfNights, subtotal, taxes, totalAmount };
  }

  private roomStatusForReservation(
    status: DbReservationStatus
  ): DbRoomStatus | null {
    switch (status) {
      case "confirmed":
        return "reserved";
      case "checked_in":
        return "occupied";
      case "checked_out":
      case "checked_out_early":
        return "cleaning";
      case "cancelled":
        return "available";
      default:
        return null;
    }
  }

  private async syncRoomStatus(
    ctx: ServiceContext,
    session: AuthSession,
    roomId: string,
    status: DbReservationStatus,
    reservationId: string
  ): Promise<void> {
    const next = this.roomStatusForReservation(status);
    if (!next) return;

    const room = await this.rooms.getById(roomId);
    if (!room) return;

    const previous = room.status;
    if (previous === next) return;

    await this.rooms.changeStatus(roomId, next);

    await this.activityLogs.create({
      userId: ctx.userId,
      userName: session.fullName,
      action: `Room ${room.room_number} status ${previous} → ${next} (reservation sync)`,
      actionCode: ActivityActionCodes.ROOM_STATUS_CHANGED,
      module: "rooms",
      entityType: "room",
      entityId: roomId,
      metadata: {
        reservation_id: reservationId,
        previous_status: previous,
        new_status: next,
      },
    });
  }

  private validateFormDates(checkIn: string, checkOut: string): void {
    if (!checkIn || !checkOut) {
      throw new ServiceError("Check-in and check-out dates are required.", "VALIDATION", 400);
    }
    if (checkOut <= checkIn) {
      throw new ServiceError("Check-out must be after check-in.", "VALIDATION", 400);
    }
  }

  private async assertRoomAvailable(
    roomId: string,
    checkIn: string,
    checkOut: string,
    excludeReservationId?: string
  ): Promise<void> {
    const available = await this.reservations.checkAvailability({
      checkIn,
      checkOut,
      excludeReservationId,
    });
    if (!available.includes(roomId)) {
      throw new ServiceError(
        "Room is not available for the selected dates.",
        "CONFLICT",
        409
      );
    }
  }

  private async resolveOrCreateGuest(
    values: ReservationFormValues
  ): Promise<string> {
    if (!values.guestName.trim()) {
      throw new ServiceError("Guest name is required.", "VALIDATION", 400);
    }

    const email = values.guestEmail.trim();
    if (email) {
      const existing = await this.guests.findByEmail(email);
      if (existing) {
        await this.guests.update(existing.id, {
          full_name: values.guestName.trim(),
          phone: values.guestPhone.trim() || null,
        });
        return existing.id;
      }
    }

    const created = await this.guests.create({
      full_name: values.guestName.trim(),
      phone: values.guestPhone.trim() || null,
      email: email || null,
      nationality: null,
      id_type: null,
      id_number: null,
      address: null,
      guest_status: "reserved",
      vip_status: false,
      notes: [],
      document_urls: [],
    });

    return created.id;
  }

  private async resolveRoom(roomNumber: string) {
    const room = await this.rooms.getByNumber(normalizeRoomNumber(roomNumber));
    if (!room) {
      throw new ServiceError("Room not found.", "NOT_FOUND", 404);
    }
    return room;
  }

  private statusTimestamps(
    status: DbReservationStatus,
    previous: DbReservationStatus
  ): Partial<{
    checked_in_at: string;
    checked_out_at: string;
    cancelled_at: string;
  }> {
    const now = new Date().toISOString();
    const patch: Partial<{
      checked_in_at: string;
      checked_out_at: string;
      cancelled_at: string;
    }> = {};

    if (status === "checked_in" && previous !== "checked_in") {
      patch.checked_in_at = now;
    }
    if (
      (status === "checked_out" || status === "checked_out_early") &&
      previous !== "checked_out" &&
      previous !== "checked_out_early"
    ) {
      patch.checked_out_at = now;
    }
    if (status === "cancelled" && previous !== "cancelled") {
      patch.cancelled_at = now;
    }

    return patch;
  }

  private assertEditableStatusTransition(
    previous: DbReservationStatus,
    next: DbReservationStatus
  ): void {
    if (previous === next) return;

    const blocked: Partial<Record<DbReservationStatus, DbReservationStatus[]>> = {
      confirmed: ["checked_in", "checked_out"],
      pending: ["checked_in", "checked_out"],
      checked_in: ["confirmed", "pending", "cancelled", "checked_out", "checked_out_early"],
      checked_out: ["confirmed", "pending", "checked_in", "cancelled", "checked_out_early"],
      checked_out_early: ["confirmed", "pending", "checked_in", "cancelled", "checked_out"],
    };

    const disallowed = blocked[previous];
    if (disallowed?.includes(next)) {
      throw new ServiceError(
        `Use the dedicated check-in, check-out, or cancel flow — cannot change reservation from ${previous} to ${next}.`,
        "VALIDATION",
        400
      );
    }
  }

  private async applyStatusTransition(
    ctx: ServiceContext,
    session: AuthSession,
    row: DbReservationWithRelations,
    previousStatus: DbReservationStatus,
    updated: DbReservation,
    roomId: string
  ): Promise<void> {
    const newStatus = updated.status;
    if (previousStatus === newStatus) return;

    if (newStatus === "checked_in") {
      await this.log(ctx, session, {
        action: `Checked in ${updated.reservation_number}`,
        actionCode: ActivityActionCodes.RESERVATION_CHECKED_IN,
        entityId: updated.id,
      });
      await this.guests.update(row.guest_id, { guest_status: "in_house" });
    } else if (newStatus === "checked_out" || newStatus === "checked_out_early") {
      await this.log(ctx, session, {
        action: `Checked out ${updated.reservation_number}`,
        actionCode: ActivityActionCodes.RESERVATION_CHECKED_OUT,
        entityId: updated.id,
      });
      await this.guests.update(row.guest_id, { guest_status: "checked_out" });
    } else if (newStatus === "cancelled") {
      await this.log(ctx, session, {
        action: `Cancelled reservation ${updated.reservation_number}`,
        actionCode: ActivityActionCodes.RESERVATION_CANCELLED,
        entityId: updated.id,
      });
      if (previousStatus === "confirmed" || previousStatus === "pending") {
        await this.guests.update(row.guest_id, { guest_status: "reserved" });
      }
    } else {
      await this.log(ctx, session, {
        action: `Updated reservation ${updated.reservation_number}`,
        actionCode: ActivityActionCodes.RESERVATION_UPDATED,
        entityId: updated.id,
        metadata: { status: newStatus },
      });
    }

    await this.syncRoomStatus(ctx, session, roomId, newStatus, updated.id);
  }

  async listReservations(
    _ctx: ServiceContext,
    session: AuthSession
  ): Promise<Reservation[]> {
    this.require(session, "view");
    const rows = await this.reservations.getAll();
    return rows.map(mapDbReservationToReservation);
  }

  async getReservationById(
    _ctx: ServiceContext,
    session: AuthSession,
    id: string
  ): Promise<Reservation | null> {
    this.require(session, "view");
    const row = await this.reservations.getById(id);
    return row ? mapDbReservationToReservation(row) : null;
  }

  async checkAvailability(
    _ctx: ServiceContext,
    session: AuthSession,
    query: AvailabilityQuery
  ): Promise<AvailableRoom[]> {
    this.require(session, "view");

    const roomIds = await this.reservations.checkAvailability(query);
    const allRooms = await this.rooms.getAll(false);
    const { resolveFloorLabel } = await import("@/lib/rooms/mapper");

    return allRooms
      .filter((room) => roomIds.includes(room.id))
      .map((room) => ({
        roomNumber: room.room_number,
        status: room.status,
        floorLabel: resolveFloorLabel(room),
        roomTypeName: room.room_type.name,
        nightlyRate: Number(room.room_type.default_price),
      }));
  }

  async createReservation(
    ctx: ServiceContext,
    session: AuthSession,
    values: ReservationFormValues
  ): Promise<Reservation> {
    this.require(session, "create");
    this.validateFormDates(values.checkInDate, values.checkOutDate);

    const guestId = await this.resolveOrCreateGuest(values);
    const room = await this.resolveRoom(values.roomNumber);
    await this.assertRoomAvailable(
      room.id,
      values.checkInDate,
      values.checkOutDate
    );

    const roomRate = Number(room.room_type.default_price);
    const { numberOfNights, subtotal, taxes, totalAmount } =
      this.computeFinancials(roomRate, values.checkInDate, values.checkOutDate);

    const row = await this.reservations.create({
      guest_id: guestId,
      room_id: room.id,
      room_type_id: room.room_type_id,
      check_in_date: values.checkInDate,
      check_out_date: values.checkOutDate,
      adults: values.adults,
      children: values.children,
      status: values.status,
      booking_source: values.bookingSource,
      room_rate: roomRate,
      number_of_nights: numberOfNights,
      subtotal,
      taxes,
      service_charge: 0,
      total_amount: totalAmount,
      amount_paid: 0,
      balance: totalAmount,
      special_requests: null,
      internal_notes: null,
      created_by: ctx.userId,
      cancelled_at: null,
      checked_in_at: null,
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

    await this.reservations.linkGuest(row.id, guestId, "primary");

    await this.log(ctx, session, {
      action: `Created reservation ${row.reservation_number}`,
      actionCode: ActivityActionCodes.RESERVATION_CREATED,
      entityId: row.id,
      metadata: { reservation_number: row.reservation_number },
    });

    await this.syncRoomStatus(ctx, session, room.id, values.status, row.id);

    const detail = await this.reservations.getById(row.id);
    if (!detail) {
      throw new ServiceError("Failed to load created reservation.", "INTERNAL", 500);
    }
    return mapDbReservationToReservation(detail);
  }

  async updateReservation(
    ctx: ServiceContext,
    session: AuthSession,
    id: string,
    values: ReservationFormValues
  ): Promise<Reservation> {
    if (!getReservationAccess(session).canEdit) {
      throw new ServiceError(
        "Forbidden: reservations.edit required.",
        "FORBIDDEN",
        403
      );
    }

    this.validateFormDates(values.checkInDate, values.checkOutDate);
    const existing = await this.resolveRow(id);
    const guestId = existing.guest_id;
    const room = await this.resolveRoom(values.roomNumber);

    const datesOrRoomChanged =
      values.checkInDate !== existing.check_in_date ||
      values.checkOutDate !== existing.check_out_date ||
      room.id !== existing.room_id;

    if (datesOrRoomChanged) {
      await this.assertRoomAvailable(
        room.id,
        values.checkInDate,
        values.checkOutDate,
        existing.id
      );
    }

    await this.guests.update(guestId, {
      full_name: values.guestName.trim(),
      phone: values.guestPhone.trim() || null,
      email: values.guestEmail.trim() || null,
    });

    const roomRate = Number(room.room_type.default_price);
    const { numberOfNights, subtotal, taxes, totalAmount } =
      this.computeFinancials(roomRate, values.checkInDate, values.checkOutDate);
    const balance = totalAmount - Number(existing.amount_paid);
    const previousStatus = existing.status;
    const newStatus = values.status as DbReservationStatus;

    const updated = await this.reservations.update(existing.id, {
      room_id: room.id,
      room_type_id: room.room_type_id,
      check_in_date: values.checkInDate,
      check_out_date: values.checkOutDate,
      adults: values.adults,
      children: values.children,
      status: newStatus,
      booking_source: values.bookingSource,
      room_rate: roomRate,
      number_of_nights: numberOfNights,
      subtotal,
      taxes,
      total_amount: totalAmount,
      balance,
      ...this.statusTimestamps(newStatus, previousStatus),
    });

    this.assertEditableStatusTransition(previousStatus, newStatus);

    const roomChanged = room.id !== existing.room_id;

    if (previousStatus !== newStatus) {
      await this.applyStatusTransition(
        ctx,
        session,
        existing,
        previousStatus,
        updated,
        room.id
      );
      if (roomChanged) {
        await this.rooms.changeStatus(existing.room_id, "available");
      }
    } else if (roomChanged) {
      await this.rooms.changeStatus(existing.room_id, "available");
      await this.syncRoomStatus(ctx, session, room.id, newStatus, updated.id);
      await this.log(ctx, session, {
        action: `Updated reservation ${updated.reservation_number}`,
        actionCode: ActivityActionCodes.RESERVATION_UPDATED,
        entityId: updated.id,
        metadata: { room_changed: true },
      });
    } else {
      await this.log(ctx, session, {
        action: `Updated reservation ${updated.reservation_number}`,
        actionCode: ActivityActionCodes.RESERVATION_UPDATED,
        entityId: updated.id,
      });
    }

    const detail = await this.reservations.getById(updated.id);
    if (!detail) {
      throw new ServiceError("Failed to load updated reservation.", "INTERNAL", 500);
    }
    return mapDbReservationToReservation(detail);
  }

  async cancelReservation(
    ctx: ServiceContext,
    session: AuthSession,
    id: string,
    reason?: string
  ): Promise<Reservation> {
    if (!getReservationAccess(session).canCancel) {
      throw new ServiceError(
        "Forbidden: cannot cancel reservations.",
        "FORBIDDEN",
        403
      );
    }

    const existing = await this.resolveRow(id);

    if (existing.status === "checked_in") {
      throw new ServiceError(
        "Checked-in reservations must be checked out before cancellation.",
        "CONFLICT",
        409
      );
    }

    const cancelled = await this.reservations.cancel(existing.id, reason);

    await this.log(ctx, session, {
      action: `Cancelled reservation ${cancelled.reservation_number}`,
      actionCode: ActivityActionCodes.RESERVATION_CANCELLED,
      entityId: cancelled.id,
      metadata: { reason: reason ?? null },
    });

    await this.syncRoomStatus(
      ctx,
      session,
      existing.room_id,
      "cancelled",
      cancelled.id
    );

    if (
      existing.status === "confirmed" ||
      existing.status === "pending"
    ) {
      await this.guests.update(existing.guest_id, { guest_status: "reserved" });
    }

    const detail = await this.reservations.getById(cancelled.id);
    if (!detail) {
      throw new ServiceError("Failed to load cancelled reservation.", "INTERNAL", 500);
    }
    return mapDbReservationToReservation(detail);
  }

  async listPendingCheckIns(
    _ctx: ServiceContext,
    session: AuthSession,
    asOfDate: string = getTodayDateString()
  ): Promise<Reservation[]> {
    this.require(session, "view");
    const rows = await this.reservations.findPendingCheckIns(asOfDate);
    return rows.map(mapDbReservationToReservation);
  }

  async listCheckedInReservations(
    _ctx: ServiceContext,
    session: AuthSession
  ): Promise<Reservation[]> {
    this.require(session, "view");
    const rows = await this.reservations.findCheckedIn();
    return rows.map(mapDbReservationToReservation);
  }

  async getCheckInPageStats(
    ctx: ServiceContext,
    session: AuthSession,
    asOfDate: string = getTodayDateString()
  ): Promise<CheckInPageStats> {
    this.require(session, "view");
    const all = await this.reservations.getAll();
    const reservations = all.map(mapDbReservationToReservation);
    const pending = await this.listPendingCheckIns(ctx, session, asOfDate);

    return {
      todayArrivals: reservations.filter(
        (r) =>
          r.checkInDate === asOfDate &&
          r.status !== "cancelled" &&
          r.status !== "no_show"
      ).length,
      pendingCheckIns: pending.length,
      completedCheckInsToday: reservations.filter(
        (r) => r.checkInDate === asOfDate && r.status === "checked_in"
      ).length,
      walkInsToday: reservations.filter(
        (r) =>
          r.bookingSource === "walk_in" &&
          r.checkInDate === asOfDate &&
          r.status === "checked_in"
      ).length,
    };
  }

  async getCheckOutPageStats(
    _ctx: ServiceContext,
    session: AuthSession,
    asOfDate: string = getTodayDateString()
  ): Promise<CheckOutPageStats> {
    void _ctx;
    this.require(session, "view");
    const all = await this.reservations.getAll();
    const reservations = all.map(mapDbReservationToReservation);
    const checkedIn = reservations.filter((r) => r.status === "checked_in");
    const departuresToday = checkedIn.filter((r) => r.checkOutDate === asOfDate);

    const rooms = await this.rooms.getAll(false);
    const roomsAwaitingCleaning = rooms.filter(
      (r) => r.status === "cleaning"
    ).length;

    return {
      departuresToday: departuresToday.length,
      pendingCheckOuts: departuresToday.length,
      completedCheckOutsToday: reservations.filter(
        (r) => r.checkOutDate === asOfDate && r.status === "checked_out"
      ).length,
      roomsAwaitingCleaning,
    };
  }

  async completeCheckIn(
    ctx: ServiceContext,
    session: AuthSession,
    reservationId: string
  ): Promise<Reservation> {
    if (!getCheckInAccess(session).canProcess) {
      throw new ServiceError(
        "Forbidden: check_in.edit required to complete check-in.",
        "FORBIDDEN",
        403
      );
    }

    const row = await this.resolveRow(reservationId);
    if (row.status !== "confirmed") {
      throw new ServiceError(
        "Only confirmed reservations can be checked in.",
        "VALIDATION",
        400
      );
    }

    const previousStatus = row.status;
    const updated = await this.reservations.update(row.id, {
      status: "checked_in",
      ...this.statusTimestamps("checked_in", previousStatus),
    });

    await this.applyStatusTransition(
      ctx,
      session,
      row,
      previousStatus,
      updated,
      row.room_id
    );

    const detail = await this.reservations.getById(updated.id);
    if (!detail) {
      throw new ServiceError("Failed to load checked-in reservation.", "INTERNAL", 500);
    }
    return mapDbReservationToReservation(detail);
  }

  async listActiveStays(
    _ctx: ServiceContext,
    session: AuthSession
  ): Promise<ActiveStay[]> {
    this.require(session, "view");
    const rows = await this.reservations.findCheckedIn();
    return buildActiveStaysFromReservations(rows);
  }

  async getStayPageStats(
    ctx: ServiceContext,
    session: AuthSession,
    asOfDate: string = getTodayDateString()
  ): Promise<StayStats> {
    this.require(session, "view");
    const stays = await this.listActiveStays(ctx, session);
    const reservations = await this.listReservations(ctx, session);
    return computeStayStats(stays, reservations, asOfDate);
  }

  async completeCheckOut(
    ctx: ServiceContext,
    session: AuthSession,
    reservationId: string
  ): Promise<Reservation> {
    if (!getCheckOutAccess(session).canProcess) {
      throw new ServiceError(
        "Forbidden: check_out.edit required to complete check-out.",
        "FORBIDDEN",
        403
      );
    }

    const row = await this.resolveRow(reservationId);
    if (row.status !== "checked_in") {
      throw new ServiceError(
        "Only checked-in reservations can be checked out.",
        "VALIDATION",
        400
      );
    }

    const previousStatus = row.status;
    const updated = await this.reservations.update(row.id, {
      status: "checked_out",
      ...this.statusTimestamps("checked_out", previousStatus),
    });

    await this.applyStatusTransition(
      ctx,
      session,
      row,
      previousStatus,
      updated,
      row.room_id
    );

    const detail = await this.reservations.getById(updated.id);
    if (!detail) {
      throw new ServiceError("Failed to load checked-out reservation.", "INTERNAL", 500);
    }
    return mapDbReservationToReservation(detail);
  }

  async previewEarlyCheckOut(
    _ctx: ServiceContext,
    session: AuthSession,
    reservationId: string,
    actualCheckOutDate: string = getTodayDateString()
  ): Promise<EarlyCheckOutPreview> {
    if (!getCheckOutAccess(session).canProcess) {
      throw new ServiceError(
        "Forbidden: check_out.edit required.",
        "FORBIDDEN",
        403
      );
    }

    const row = await this.resolveRow(reservationId);
    if (row.status !== "checked_in") {
      throw new ServiceError(
        "Only checked-in reservations can use early check-out.",
        "VALIDATION",
        400
      );
    }

    if (
      !canEarlyCheckOut(
        row.status,
        row.check_in_date,
        row.check_out_date,
        actualCheckOutDate
      )
    ) {
      throw new ServiceError(
        "Guest is not eligible for early check-out on this date.",
        "VALIDATION",
        400
      );
    }

    const computation = computeEarlyCheckout({
      checkInDate: row.check_in_date,
      scheduledCheckOutDate: row.check_out_date,
      actualCheckOutDate,
      originalNights: row.number_of_nights,
      totalAmount: Number(row.total_amount),
      roomRate: Number(row.room_rate),
      amountPaid: Number(row.amount_paid),
    });

    const guest = row.guest;
    const room = row.room;

    return {
      reservationId: row.id,
      reservationNumber: row.reservation_number,
      guestName: guest.full_name,
      roomNumber: room.room_number,
      originalCheckOutDate: row.check_out_date,
      actualCheckOutDate,
      originalNights: computation.originalNights,
      actualNights: computation.actualNights,
      unusedNights: computation.unusedNights,
      refundAmount: computation.refundAmount,
      roomRate: Number(row.room_rate),
      totalAmount: Number(row.total_amount),
      amountPaid: Number(row.amount_paid),
    };
  }

  async completeEarlyCheckOut(
    ctx: ServiceContext,
    session: AuthSession,
    reservationId: string,
    input: EarlyCheckOutInput,
    paymentService: IPaymentService,
    payments: IPaymentRepository
  ): Promise<Reservation> {
    if (!getCheckOutAccess(session).canProcess) {
      throw new ServiceError(
        "Forbidden: check_out.edit required to complete early check-out.",
        "FORBIDDEN",
        403
      );
    }

    const trimmedReason = input.reason.trim();
    if (!trimmedReason) {
      throw new ServiceError("Early check-out reason is required.", "VALIDATION", 400);
    }

    const actualCheckOutDate = input.actualCheckOutDate?.trim() || getTodayDateString();
    const row = await this.resolveRow(reservationId);

    if (row.status !== "checked_in") {
      throw new ServiceError(
        "Only checked-in reservations can use early check-out.",
        "VALIDATION",
        400
      );
    }

    if (
      !canEarlyCheckOut(
        row.status,
        row.check_in_date,
        row.check_out_date,
        actualCheckOutDate
      )
    ) {
      throw new ServiceError(
        "Guest is not eligible for early check-out on this date.",
        "VALIDATION",
        400
      );
    }

    const computation = computeEarlyCheckout({
      checkInDate: row.check_in_date,
      scheduledCheckOutDate: row.check_out_date,
      actualCheckOutDate,
      originalNights: row.number_of_nights,
      totalAmount: Number(row.total_amount),
      roomRate: Number(row.room_rate),
      amountPaid: Number(row.amount_paid),
    });

    const previousStatus = row.status;
    const scheduledCheckOut = row.check_out_date;
    const notes = input.notes?.trim() || null;

    const updated = await this.reservations.update(row.id, {
      status: "checked_out_early",
      check_out_date: actualCheckOutDate,
      number_of_nights: computation.actualNights,
      subtotal: computation.actualSubtotal,
      taxes: computation.actualTaxes,
      total_amount: computation.actualTotal,
      balance: computation.actualBalance,
      original_check_out_date: scheduledCheckOut,
      actual_check_out_date: actualCheckOutDate,
      early_checkout_reason: trimmedReason,
      early_checkout_notes: notes,
      early_checkout_refund_amount: computation.refundAmount,
      ...this.statusTimestamps("checked_out_early", previousStatus),
    });

    await this.applyStatusTransition(
      ctx,
      session,
      row,
      previousStatus,
      updated,
      row.room_id
    );

    await this.log(ctx, session, {
      action: `Early check-out ${updated.reservation_number}`,
      actionCode: ActivityActionCodes.RESERVATION_EARLY_CHECKOUT,
      entityId: updated.id,
      metadata: {
        reservation_number: updated.reservation_number,
        guest: row.guest.full_name,
        room: row.room.room_number,
        unused_nights: computation.unusedNights,
        refund_amount: computation.refundAmount,
        reason: trimmedReason,
        original_check_out_date: scheduledCheckOut,
        actual_check_out_date: actualCheckOutDate,
      },
    });

    if (computation.refundAmount > 0) {
      const payment = await payments.getByReservationId(row.id);
      if (!payment) {
        throw new ServiceError(
          "Payment record required to process early check-out refund.",
          "VALIDATION",
          400
        );
      }

      const refundReason = `Early Check-Out: ${trimmedReason}`;
      const refundMethod: TransactionPaymentMethod =
        payment.method === "mixed" ? "cash" : payment.method;
      await paymentService.refund(ctx, session, payment.id, {
        amount: computation.refundAmount,
        method: refundMethod,
        reason: refundReason,
        notes: notes ?? "",
      });
    }

    const detail = await this.reservations.getById(updated.id);
    if (!detail) {
      throw new ServiceError("Failed to load early check-out reservation.", "INTERNAL", 500);
    }
    return mapDbReservationToReservation(detail);
  }

  async previewLateCheckOut(
    _ctx: ServiceContext,
    session: AuthSession,
    reservationId: string,
    policy: CheckoutPolicy,
    actualCheckoutTime: string = getCurrentTimeString(),
    complimentary = false
  ): Promise<LateCheckOutPreview> {
    if (!getCheckOutAccess(session).canProcess) {
      throw new ServiceError(
        "Forbidden: check_out.edit required.",
        "FORBIDDEN",
        403
      );
    }

    const row = await this.resolveRow(reservationId);
    const asOfDate = getTodayDateString();

    if (row.status !== "checked_in") {
      throw new ServiceError(
        "Only checked-in reservations can use late check-out.",
        "VALIDATION",
        400
      );
    }

    if (
      !canLateCheckOut(
        row.status,
        row.check_out_date,
        asOfDate,
        actualCheckoutTime,
        policy.checkOutTime
      )
    ) {
      throw new ServiceError(
        "Guest is not eligible for late check-out at this time.",
        "VALIDATION",
        400
      );
    }

    const roomRate = Number(row.room_rate);
    const feeResult = computeLateCheckoutFee({
      policy,
      actualCheckoutTime,
      roomRate,
      complimentary,
    });

    return {
      reservationId: row.id,
      reservationNumber: row.reservation_number,
      guestName: row.guest.full_name,
      guestId: row.guest_id,
      roomNumber: row.room.room_number,
      scheduledCheckOutDate: row.check_out_date,
      policyCheckOutTime: policy.checkOutTime,
      actualCheckoutTime,
      lateCheckoutFee: feeResult.fee,
      hoursLate: feeResult.hoursLate,
      policyType: feeResult.policyType,
      policyLabel: lateCheckoutPolicyLabel(feeResult.policyType),
      roomRate,
      balance: Number(row.balance),
      totalAmount: Number(row.total_amount),
      complimentary,
    };
  }

  async completeLateCheckOut(
    ctx: ServiceContext,
    session: AuthSession,
    reservationId: string,
    input: LateCheckOutInput,
    policy: CheckoutPolicy,
    paymentService: IPaymentService,
    payments: IPaymentRepository
  ): Promise<Reservation> {
    if (!getCheckOutAccess(session).canProcess) {
      throw new ServiceError(
        "Forbidden: check_out.edit required to complete late check-out.",
        "FORBIDDEN",
        403
      );
    }

    const trimmedReason = input.reason.trim();
    if (!trimmedReason) {
      throw new ServiceError("Late check-out reason is required.", "VALIDATION", 400);
    }

    const actualCheckoutTime = input.actualCheckoutTime.trim() || getCurrentTimeString();
    const asOfDate = getTodayDateString();
    const row = await this.resolveRow(reservationId);

    if (row.status !== "checked_in") {
      throw new ServiceError(
        "Only checked-in reservations can use late check-out.",
        "VALIDATION",
        400
      );
    }

    if (
      !canLateCheckOut(
        row.status,
        row.check_out_date,
        asOfDate,
        actualCheckoutTime,
        policy.checkOutTime
      )
    ) {
      throw new ServiceError(
        "Guest is not eligible for late check-out at this time.",
        "VALIDATION",
        400
      );
    }

    const complimentary = Boolean(input.complimentary);
    const roomRate = Number(row.room_rate);
    const feeResult = computeLateCheckoutFee({
      policy,
      actualCheckoutTime,
      roomRate,
      complimentary,
    });
    const fee = feeResult.fee;

    if (!complimentary && fee <= 0) {
      throw new ServiceError("Late check-out fee must be greater than zero.", "VALIDATION", 400);
    }

    const notes = input.notes?.trim() || null;
    const lateCheckoutAt = combineDateAndTime(asOfDate, actualCheckoutTime);
    const previousStatus = row.status;

    if (!complimentary && fee > 0) {
      const newTotal = roundCurrency(Number(row.total_amount) + fee);
      const newBalance = roundCurrency(Number(row.balance) + fee);

      await this.reservations.update(row.id, {
        total_amount: newTotal,
        balance: newBalance,
      });

      const existingPayment = await payments.getByReservationId(row.id);
      if (existingPayment) {
        const transactions = await payments.getTransactions(existingPayment.id);
        const totals = computeTransactionTotals(transactions);
        await payments.update(existingPayment.id, {
          total_due: newTotal,
          balance_after: computeOutstandingBalance(newTotal, totals.netPaid),
        });
      }

      await paymentService.create(ctx, session, {
        reservationId: row.id,
        guestId: row.guest_id,
        amount: fee,
        method: input.paymentMethod,
        referenceNumber: "",
        notes: `Late Check-Out: ${trimmedReason}${notes ? ` — ${notes}` : ""}`,
      });
    }

    const updated = await this.reservations.update(row.id, {
      status: "checked_out",
      late_checkout_fee: fee,
      late_checkout_reason: trimmedReason,
      late_checkout_notes: notes,
      late_checkout_at: lateCheckoutAt,
      late_checkout_complimentary: complimentary,
      late_checkout_hours_late: feeResult.hoursLate,
      late_checkout_policy_type: feeResult.policyType,
      ...this.statusTimestamps("checked_out", previousStatus),
    });

    await this.applyStatusTransition(
      ctx,
      session,
      row,
      previousStatus,
      updated,
      row.room_id
    );

    await this.log(ctx, session, {
      action: `Late check-out ${updated.reservation_number}`,
      actionCode: ActivityActionCodes.RESERVATION_LATE_CHECKOUT,
      entityId: updated.id,
      metadata: {
        reservation_number: updated.reservation_number,
        guest: row.guest.full_name,
        room: row.room.room_number,
        fee,
        complimentary,
        hours_late: feeResult.hoursLate,
        policy_type: feeResult.policyType,
        reason: trimmedReason,
        actual_checkout_time: actualCheckoutTime,
        late_checkout_at: lateCheckoutAt,
      },
    });

    const detail = await this.reservations.getById(updated.id);
    if (!detail) {
      throw new ServiceError("Failed to load late check-out reservation.", "INTERNAL", 500);
    }
    return mapDbReservationToReservation(detail);
  }

  async previewExtendStay(
    _ctx: ServiceContext,
    session: AuthSession,
    reservationId: string,
    newCheckOutDate: string
  ): Promise<ExtendStayPreview> {
    this.requireStayOperations(session);
    const row = await this.resolveRow(reservationId);

    if (!canExtendStay(row.status, row.check_out_date, newCheckOutDate)) {
      throw new ServiceError(
        "Only checked-in stays can be extended to a later checkout date.",
        "VALIDATION",
        400
      );
    }

    const computation = computeStayExtension({
      checkInDate: row.check_in_date,
      currentCheckOutDate: row.check_out_date,
      newCheckOutDate,
      roomRate: Number(row.room_rate),
      currentTotalAmount: Number(row.total_amount),
      amountPaid: Number(row.amount_paid),
    });

    return {
      reservationId: row.id,
      reservationNumber: row.reservation_number,
      guestName: row.guest.full_name,
      roomNumber: row.room.room_number,
      currentCheckOutDate: row.check_out_date,
      newCheckOutDate,
      currentNights: computation.currentNights,
      newNights: computation.newNights,
      extraNights: computation.extraNights,
      currentTotal: Number(row.total_amount),
      newTotal: computation.newTotal,
      extraAmount: computation.extraAmount,
      amountPaid: Number(row.amount_paid),
      paymentRequired: computation.paymentRequired,
    };
  }

  async completeExtendStay(
    ctx: ServiceContext,
    session: AuthSession,
    reservationId: string,
    input: ExtendStayInput,
    paymentService: IPaymentService,
    payments: IPaymentRepository
  ): Promise<Reservation> {
    this.requireStayOperations(session);

    const newCheckOutDate = input.newCheckOutDate.trim();
    const row = await this.resolveRow(reservationId);

    if (!canExtendStay(row.status, row.check_out_date, newCheckOutDate)) {
      throw new ServiceError(
        "Only checked-in stays can be extended to a later checkout date.",
        "VALIDATION",
        400
      );
    }

    await this.assertRoomAvailable(
      row.room_id,
      row.check_out_date,
      newCheckOutDate,
      row.id
    );

    const computation = computeStayExtension({
      checkInDate: row.check_in_date,
      currentCheckOutDate: row.check_out_date,
      newCheckOutDate,
      roomRate: Number(row.room_rate),
      currentTotalAmount: Number(row.total_amount),
      amountPaid: Number(row.amount_paid),
    });

    const notes = input.notes?.trim() || null;
    const extendedAt = new Date().toISOString();
    const existingHistory = Array.isArray(row.stay_extension_history)
      ? [...row.stay_extension_history]
      : [];

    existingHistory.push({
      from_checkout: row.check_out_date,
      to_checkout: newCheckOutDate,
      extra_nights: computation.extraNights,
      extra_amount: computation.extraAmount,
      notes,
      extended_at: extendedAt,
    });

    await this.reservations.update(row.id, {
      check_out_date: newCheckOutDate,
      number_of_nights: computation.newNights,
      subtotal: computation.newSubtotal,
      taxes: computation.newTaxes,
      total_amount: computation.newTotal,
      balance: computation.newBalance,
      stay_extension_history: existingHistory,
    });

    await this.syncPaymentLedgerAfterTotalChange(row.id, computation.newTotal, payments);

    if (
      computation.extraAmount > 0 &&
      input.recordPayment !== false &&
      input.paymentMethod
    ) {
      await paymentService.create(ctx, session, {
        reservationId: row.id,
        guestId: row.guest_id,
        amount: computation.extraAmount,
        method: input.paymentMethod,
        referenceNumber: "",
        notes: `Stay extension${notes ? ` — ${notes}` : ""}`,
      });
    }

    await this.log(ctx, session, {
      action: `Extended stay ${row.reservation_number}`,
      actionCode: ActivityActionCodes.RESERVATION_EXTEND_STAY,
      entityId: row.id,
      metadata: {
        reservation_number: row.reservation_number,
        guest: row.guest.full_name,
        room: row.room.room_number,
        old_checkout: row.check_out_date,
        new_checkout: newCheckOutDate,
        extra_nights: computation.extraNights,
        extra_amount: computation.extraAmount,
      },
    });

    const detail = await this.reservations.getById(row.id);
    if (!detail) {
      throw new ServiceError("Failed to load extended reservation.", "INTERNAL", 500);
    }
    return mapDbReservationToReservation(detail);
  }

  async previewRoomMove(
    ctx: ServiceContext,
    session: AuthSession,
    reservationId: string,
    newRoomNumber?: string
  ): Promise<RoomMovePreview> {
    this.requireStayOperations(session);
    const row = await this.resolveRow(reservationId);

    if (!canMoveRoom(row.status)) {
      throw new ServiceError(
        "Only checked-in guests can be moved to another room.",
        "VALIDATION",
        400
      );
    }

    const available = await this.checkAvailability(ctx, session, {
      checkIn: row.check_in_date,
      checkOut: row.check_out_date,
      excludeReservationId: row.id,
    });

    const options = available
      .filter((room) => room.roomNumber !== row.room.room_number)
      .map((room) => ({
        roomNumber: room.roomNumber,
        roomTypeName: room.roomTypeName,
        floorLabel: room.floorLabel,
        nightlyRate: room.nightlyRate,
      }));

    const selected =
      newRoomNumber?.trim() ||
      options[0]?.roomNumber ||
      row.room.room_number;
    const newRoom = await this.resolveRoom(selected);
    const { numberOfNights, subtotal, taxes, totalAmount } = this.computeFinancials(
      Number(newRoom.room_type.default_price),
      row.check_in_date,
      row.check_out_date
    );
    const priceDifference = computeRoomMovePriceDifference(
      Number(row.total_amount),
      totalAmount
    );

    return {
      reservationId: row.id,
      reservationNumber: row.reservation_number,
      guestName: row.guest.full_name,
      currentRoomNumber: row.room.room_number,
      currentRoomTypeName: row.room_type.name,
      currentFloorLabel: resolveFloorLabel(row.room),
      newRoomNumber: newRoom.room_number,
      newRoomTypeName: newRoom.room_type.name,
      newFloorLabel: resolveFloorLabel(newRoom),
      newNightlyRate: Number(newRoom.room_type.default_price),
      priceDifference,
      availableRooms: options,
    };
  }

  async completeRoomMove(
    ctx: ServiceContext,
    session: AuthSession,
    reservationId: string,
    input: RoomMoveInput,
    paymentService: IPaymentService,
    payments: IPaymentRepository
  ): Promise<Reservation> {
    this.requireStayOperations(session);

    const trimmedReason = input.reason.trim();
    if (!trimmedReason) {
      throw new ServiceError("Room move reason is required.", "VALIDATION", 400);
    }

    const row = await this.resolveRow(reservationId);
    if (!canMoveRoom(row.status)) {
      throw new ServiceError(
        "Only checked-in guests can be moved to another room.",
        "VALIDATION",
        400
      );
    }

    const newRoom = await this.resolveRoom(input.newRoomNumber.trim());
    if (newRoom.id === row.room_id) {
      throw new ServiceError("Guest is already assigned to this room.", "VALIDATION", 400);
    }

    await this.assertRoomAvailable(
      newRoom.id,
      row.check_in_date,
      row.check_out_date,
      row.id
    );

    const oldRoomId = row.room_id;
    const oldRoomNumber = row.room.room_number;
    const newRate = Number(newRoom.room_type.default_price);
    const { numberOfNights, subtotal, taxes, totalAmount } = this.computeFinancials(
      newRate,
      row.check_in_date,
      row.check_out_date
    );
    const priceDifference = computeRoomMovePriceDifference(
      Number(row.total_amount),
      totalAmount
    );
    const newBalance = roundCurrency(totalAmount - Number(row.amount_paid));
    const notes = input.notes?.trim() || null;
    const movedAt = new Date().toISOString();
    const existingHistory = Array.isArray(row.room_move_history)
      ? [...row.room_move_history]
      : [];

    existingHistory.push({
      from_room: oldRoomNumber,
      to_room: newRoom.room_number,
      reason: trimmedReason,
      notes,
      price_difference: priceDifference,
      moved_at: movedAt,
    });

    await this.reservations.update(row.id, {
      room_id: newRoom.id,
      room_type_id: newRoom.room_type_id,
      room_rate: newRate,
      number_of_nights: numberOfNights,
      subtotal,
      taxes,
      total_amount: totalAmount,
      balance: newBalance,
      room_move_history: existingHistory,
    });

    await this.syncPaymentLedgerAfterTotalChange(row.id, totalAmount, payments);

    if (priceDifference > 0 && input.paymentMethod) {
      await paymentService.create(ctx, session, {
        reservationId: row.id,
        guestId: row.guest_id,
        amount: priceDifference,
        method: input.paymentMethod,
        referenceNumber: "",
        notes: `Room move upgrade: ${trimmedReason}${notes ? ` — ${notes}` : ""}`,
      });
    } else if (priceDifference < 0) {
      const payment = await payments.getByReservationId(row.id);
      if (!payment) {
        throw new ServiceError(
          "Payment record required to process room move refund.",
          "VALIDATION",
          400
        );
      }
      const refundMethod: TransactionPaymentMethod =
        payment.method === "mixed" ? "cash" : payment.method;
      await paymentService.refund(ctx, session, payment.id, {
        amount: Math.abs(priceDifference),
        method: refundMethod,
        reason: `Room Move: ${trimmedReason}`,
        notes: notes ?? "",
      });
    }

    await this.rooms.changeStatus(oldRoomId, "cleaning");
    await this.rooms.changeStatus(newRoom.id, "occupied");

    await this.log(ctx, session, {
      action: `Moved guest ${row.reservation_number} ${oldRoomNumber} → ${newRoom.room_number}`,
      actionCode: ActivityActionCodes.RESERVATION_ROOM_MOVE,
      entityId: row.id,
      metadata: {
        reservation_number: row.reservation_number,
        guest: row.guest.full_name,
        old_room: oldRoomNumber,
        new_room: newRoom.room_number,
        reason: trimmedReason,
        price_difference: priceDifference,
      },
    });

    const detail = await this.reservations.getById(row.id);
    if (!detail) {
      throw new ServiceError("Failed to load moved reservation.", "INTERNAL", 500);
    }
    return mapDbReservationToReservation(detail);
  }
}
