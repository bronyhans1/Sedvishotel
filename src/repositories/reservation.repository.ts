import type { BaseRepository } from "@/repositories/base.repository";
import type {
  DbReservation,
  DbReservationGuestRole,
  DbReservationWithRelations,
} from "@/types/database";

export interface AvailabilityQuery {
  checkIn: string;
  checkOut: string;
  roomTypeId?: string;
  excludeReservationId?: string;
}

/**
 * Same-room stay extension window — half-open [checkIn, checkOut).
 * Ignores rooms.status; only checks reservation / block overlap on one room.
 */
export interface ExtendStayAvailabilityQuery {
  roomId: string;
  checkIn: string;
  checkOut: string;
  excludeReservationId: string;
}

export type ExtendStayAvailabilityResult =
  | { available: true }
  | { available: false; reason: "reservation" | "block" | "invalid_dates" };

export interface IReservationRepository {
  getAll(): Promise<DbReservationWithRelations[]>;
  /** Leaner relation select for analytics computes (same reservation rows). */
  listForAnalytics(): Promise<DbReservationWithRelations[]>;
  getById(id: string): Promise<DbReservationWithRelations | null>;
  getByNumber(reservationNumber: string): Promise<DbReservationWithRelations | null>;
  getByGuestId(guestId: string): Promise<DbReservationWithRelations[]>;
  countCheckInsToday(startIso: string, endIso: string): Promise<number>;
  countCheckOutsToday(startIso: string, endIso: string): Promise<number>;
  getByRoomId(roomId: string): Promise<DbReservationWithRelations[]>;
  findPendingCheckIns(asOfDate: string): Promise<DbReservationWithRelations[]>;
  findCheckedIn(): Promise<DbReservationWithRelations[]>;
  checkAvailability(query: AvailabilityQuery): Promise<string[]>;
  /**
   * Can the guest remain in this specific room for the extension window?
   * Does not consult rooms.status (occupied rooms remain valid).
   */
  checkExtendStayAvailability(
    query: ExtendStayAvailabilityQuery
  ): Promise<ExtendStayAvailabilityResult>;
  getNextReservationNumber(): Promise<string>;
  create(
    data: Omit<DbReservation, "id" | "created_at" | "updated_at" | "reservation_number">
  ): Promise<DbReservation>;
  update(id: string, data: Partial<DbReservation>): Promise<DbReservation>;
  cancel(id: string, reason?: string): Promise<DbReservation>;
  linkGuest(
    reservationId: string,
    guestId: string,
    role: DbReservationGuestRole
  ): Promise<void>;
}

export type ReservationRepository = IReservationRepository & BaseRepository;
