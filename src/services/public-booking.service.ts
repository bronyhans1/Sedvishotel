import { mapShmsAvailabilityToPublicRooms } from "@/lib/public/map-shms-availability";
import { buildCapacityMessage, validateMinimumStay } from "@/lib/public/booking-validation";
import { phonesMatch } from "@/lib/public/phone";
import {
  getBedPreferenceLabel,
  resolvePublicRoomSlug,
  roomTypeMatchesPublicCategory,
} from "@/lib/public/room-categories";
import { notifyWebsiteReservation } from "@/lib/notifications/operational-notifications";
import { computeStayPricing } from "@/lib/reservations/pricing";
import { mapDbReservationToReservation } from "@/lib/reservations/mapper";
import type { IActivityLogRepository } from "@/repositories/activity-log.repository";
import type { IGuestRepository } from "@/repositories/guest.repository";
import type { INotificationRepository } from "@/repositories/notification.repository";
import type { IReservationRepository } from "@/repositories/reservation.repository";
import type { IRoomRepository } from "@/repositories/room.repository";
import type { TaxAndChargeSettings } from "@/repositories/settings.repository";
import { ServiceError } from "@/services/types";
import { ActivityActionCodes } from "@/types/database/enums";
import type { DbRoomWithType } from "@/types/database";
import type {
  BookingConfirmation,
  BookingGuest,
  BookingSearch,
  PublicRoom,
  ReservationLookupResult,
} from "@/types/public";
import type { Reservation } from "@/types/reservation";

export type WebsiteReservationInput = {
  search: BookingSearch;
  roomTypeSlug: string;
  guest: BookingGuest;
  bedPreference?: string;
};

export type PublicAvailabilityResult =
  | { success: true; rooms: PublicRoom[] }
  | {
      success: false;
      error: string;
      code: "VALIDATION" | "NO_AVAILABILITY" | "CAPACITY";
      rooms: PublicRoom[];
    };

export interface IPublicBookingService {
  checkAvailability(
    search: BookingSearch,
    catalog: PublicRoom[]
  ): Promise<PublicAvailabilityResult>;
  submitWebsiteReservation(input: WebsiteReservationInput): Promise<BookingConfirmation>;
  lookupReservation(
    reservationNumber: string,
    phone: string
  ): Promise<ReservationLookupResult | null>;
}

export class PublicBookingService implements IPublicBookingService {
  constructor(
    private readonly reservations: IReservationRepository,
    private readonly guests: IGuestRepository,
    private readonly rooms: IRoomRepository,
    private readonly notifications: INotificationRepository,
    private readonly activityLogs: IActivityLogRepository,
    private readonly pricingSettings: TaxAndChargeSettings
  ) {}

  private validateSearch(search: BookingSearch): void {
    const dateError = validateMinimumStay(search.checkIn, search.checkOut);
    if (dateError) {
      throw new ServiceError(dateError, "VALIDATION", 400);
    }
    if (search.adults < 1) {
      throw new ServiceError("At least one adult is required.", "VALIDATION", 400);
    }
  }

  private validateGuest(guest: BookingGuest): void {
    if (!guest.fullName.trim()) {
      throw new ServiceError("Guest name is required.", "VALIDATION", 400);
    }
    if (!guest.phone.trim()) {
      throw new ServiceError("Phone number is required.", "VALIDATION", 400);
    }
    const email = guest.email?.trim() ?? "";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new ServiceError("Please enter a valid email address.", "VALIDATION", 400);
    }
  }

  private async getBaseAvailableRooms(
    checkIn: string,
    checkOut: string,
    publicCategorySlug?: string
  ): Promise<DbRoomWithType[]> {
    const availableIds = await this.reservations.checkAvailability({
      checkIn,
      checkOut,
    });

    const allRooms = await this.rooms.getAll(false);

    return allRooms
      .filter((room) => availableIds.includes(room.id))
      .filter((room) => room.room_type.status === "active")
      .filter((room) => {
        if (!publicCategorySlug) return true;
        return roomTypeMatchesPublicCategory(room.room_type, publicCategorySlug);
      })
      .sort((a, b) => a.room_number.localeCompare(b.room_number));
  }

  private filterByCapacity(rooms: DbRoomWithType[], adults: number): DbRoomWithType[] {
    return rooms.filter((room) => room.room_type.capacity >= adults);
  }

  async checkAvailability(
    search: BookingSearch,
    catalog: PublicRoom[]
  ): Promise<PublicAvailabilityResult> {
    try {
      this.validateSearch(search);
    } catch (err) {
      if (err instanceof ServiceError && err.code === "VALIDATION") {
        return {
          success: false,
          error: err.message,
          code: "VALIDATION",
          rooms: [],
        };
      }
      throw err;
    }

    const publicCategory = search.roomTypeId
      ? String(resolvePublicRoomSlug(search.roomTypeId))
      : undefined;

    const baseRooms = await this.getBaseAvailableRooms(
      search.checkIn,
      search.checkOut,
      publicCategory
    );

    const eligibleRooms = this.filterByCapacity(baseRooms, search.adults);

    if (eligibleRooms.length === 0) {
      if (baseRooms.length > 0) {
        return {
          success: false,
          error: buildCapacityMessage(search.adults),
          code: "CAPACITY",
          rooms: [],
        };
      }

      return {
        success: false,
        error: "No rooms are available for the selected dates.",
        code: "NO_AVAILABILITY",
        rooms: [],
      };
    }

    const rooms = mapShmsAvailabilityToPublicRooms(
      eligibleRooms,
      search.adults,
      catalog,
      publicCategory
    );

    return { success: true, rooms };
  }

  private async pickAvailableRoom(
    checkIn: string,
    checkOut: string,
    adults: number,
    publicCategorySlug: string
  ): Promise<DbRoomWithType> {
    const baseRooms = await this.getBaseAvailableRooms(
      checkIn,
      checkOut,
      publicCategorySlug
    );
    const eligible = this.filterByCapacity(baseRooms, adults);
    const room = eligible[0];

    if (!room) {
      if (baseRooms.length > 0) {
        throw new ServiceError(buildCapacityMessage(adults), "CAPACITY", 409);
      }
      throw new ServiceError(
        "No rooms are available for the selected dates.",
        "NO_AVAILABILITY",
        409
      );
    }

    return room;
  }

  private async resolveGuest(guest: BookingGuest): Promise<string> {
    const phone = guest.phone.trim();
    const email = guest.email?.trim().toLowerCase() ?? "";

    if (email) {
      const existing = await this.guests.findByEmail(email);
      if (existing) {
        await this.guests.update(existing.id, {
          full_name: guest.fullName.trim(),
          phone: phone || null,
        });
        return existing.id;
      }
    }

    if (phone) {
      const existingByPhone = await this.guests.findByPhone(phone);
      if (existingByPhone) {
        await this.guests.update(existingByPhone.id, {
          full_name: guest.fullName.trim(),
          phone,
          email: email || existingByPhone.email,
        });
        return existingByPhone.id;
      }
    }

    const created = await this.guests.create({
      full_name: guest.fullName.trim(),
      phone: phone || null,
      email: email || null,
      nationality: null,
      id_type: null,
      id_number: null,
      address: null,
      guest_status: "reserved",
      vip_status: false,
      notes: ["Website booking"],
      document_urls: [],
    });
    return created.id;
  }

  async submitWebsiteReservation(
    input: WebsiteReservationInput
  ): Promise<BookingConfirmation> {
    this.validateSearch(input.search);
    this.validateGuest(input.guest);

    const publicCategory = String(resolvePublicRoomSlug(input.roomTypeSlug));
    const room = await this.pickAvailableRoom(
      input.search.checkIn,
      input.search.checkOut,
      input.search.adults,
      publicCategory
    );

    const guestId = await this.resolveGuest(input.guest);
    const roomRate = Number(room.room_type.default_price);
    const { numberOfNights, subtotal, serviceCharge, taxes, totalAmount } =
      computeStayPricing({
        roomRate,
        checkIn: input.search.checkIn,
        checkOut: input.search.checkOut,
        taxRate: this.pricingSettings.taxRate,
        serviceChargeRate: this.pricingSettings.serviceCharge,
      });

    const specialNotes = [
      input.search.specialRequests?.trim(),
      input.bedPreference && input.bedPreference !== "none"
        ? `Bed preference: ${getBedPreferenceLabel(input.bedPreference as "double" | "queen" | "none")}`
        : null,
    ]
      .filter(Boolean)
      .join(" · ");

    const row = await this.reservations.create({
      guest_id: guestId,
      room_id: room.id,
      room_type_id: room.room_type_id,
      check_in_date: input.search.checkIn,
      check_out_date: input.search.checkOut,
      adults: input.search.adults,
      children: input.search.children,
      status: "pending",
      booking_source: "website",
      rack_rate: roomRate,
      room_rate: roomRate,
      discount_amount: 0,
      discount_percent: 0,
      pricing_mode: "standard",
      pricing_source: "room_type_default",
      pricing_rule_id: null,
      override_reason: null,
      override_reason_detail: null,
      overridden_by: null,
      approved_by: null,
      override_at: null,
      rate_override_history: [],
      number_of_nights: numberOfNights,
      subtotal,
      taxes,
      service_charge: serviceCharge,
      total_amount: totalAmount,
      amount_paid: 0,
      balance: totalAmount,
      special_requests: specialNotes || null,
      internal_notes: "Submitted via public website",
      created_by: null,
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

    await this.activityLogs.create({
      userName: "Website Guest",
      action: `Website reservation submitted (${row.reservation_number})`,
      actionCode: ActivityActionCodes.RESERVATION_CREATED,
      module: "reservations",
      entityType: "reservation",
      entityId: row.id,
      metadata: { source: "website", booking_source: "website" },
      status: "success",
    });

    const detail = await this.reservations.getById(row.id);
    if (!detail) {
      throw new ServiceError("Failed to load created reservation.", "INTERNAL", 500);
    }

    const reservation: Reservation = mapDbReservationToReservation(detail);

    await notifyWebsiteReservation(this.notifications, {
      reservationId: reservation.id,
      reservationNumber: reservation.reservationNumber,
      guestName: reservation.guestName,
      roomTypeName: reservation.roomTypeName,
      checkIn: reservation.checkInDate,
      checkOut: reservation.checkOutDate,
    });

    return {
      reservationNumber: reservation.reservationNumber,
      guestName: reservation.guestName,
      email: input.guest.email?.trim() ?? "",
      roomName: reservation.roomTypeName,
      roomSlug: publicCategory,
      bedPreference: input.bedPreference,
      bedPreferenceLabel:
        input.bedPreference && input.bedPreference !== "none"
          ? getBedPreferenceLabel(input.bedPreference as "double" | "queen" | "none")
          : undefined,
      checkIn: reservation.checkInDate,
      checkOut: reservation.checkOutDate,
      adults: reservation.adults,
      children: reservation.children,
      nights: numberOfNights,
      subtotal,
      serviceCharge,
      taxes,
      total: totalAmount,
      status: "pending",
      paymentStatus: "pending",
    };
  }

  async lookupReservation(
    reservationNumber: string,
    phone: string
  ): Promise<ReservationLookupResult | null> {
    const normalizedNumber = reservationNumber.trim();
    const normalizedPhone = phone.trim();
    if (!normalizedNumber || !normalizedPhone) return null;

    const row = await this.reservations.getByNumber(normalizedNumber);
    if (!row || !phonesMatch(row.guest.phone, normalizedPhone)) {
      return null;
    }

    const statusLabels: Record<string, string> = {
      pending: "Pending Review",
      confirmed: "Confirmed",
      checked_in: "Checked In",
      checked_out: "Checked Out",
      checked_out_early: "Checked Out Early",
      cancelled: "Cancelled",
      no_show: "No Show",
    };

    const paymentStatus =
      Number(row.amount_paid) >= Number(row.total_amount)
        ? "Fully Paid"
        : Number(row.amount_paid) > 0
          ? "Partially Paid"
          : "Pending";

    return {
      reservationNumber: row.reservation_number,
      guestName: row.guest.full_name,
      phone: row.guest.phone ?? "",
      roomName: row.room_type.name,
      checkIn: row.check_in_date,
      checkOut: row.check_out_date,
      status: statusLabels[row.status] ?? row.status,
      statusCode: row.status,
      paymentStatus,
    };
  }
}
