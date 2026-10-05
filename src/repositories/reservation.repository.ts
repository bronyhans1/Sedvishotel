import type { ReservationListFilters } from "@/lib/reservations/list-order";
import type { BaseRepository } from "@/repositories/base.repository";
import type { PaginatedResult } from "@/repositories/types";
import type {
  DbReservation,
  DbReservationGuestRole,
  DbReservationWithRelations,
} from "@/types/database";
import type { ReservationStats } from "@/types/reservation";

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
  /**
   * One operational page for the reservations screen.
   * Does not change getAll().
   */
  listPage(input: {
    page: number;
    pageSize: number;
    businessDate: string;
    filters: ReservationListFilters;
  }): Promise<PaginatedResult<DbReservationWithRelations>>;
  /** Status counts for every visible reservation, ignoring list filters and page. */
  countListStats(): Promise<ReservationStats>;
  /** Room-type labels present on visible reservations, for the list filter. */
  listVisibleRoomTypeOptions(): Promise<{ id: string; name: string }[]>;
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
