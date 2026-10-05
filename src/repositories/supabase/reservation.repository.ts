import { BLOCKING_RESERVATION_STATUSES } from "@/lib/reservations/constants";
import {
  reservationMatchesListFilters,
  sortReservationListRows,
  type ReservationListFilters,
  type ReservationListRow,
} from "@/lib/reservations/list-order";
import { isUuid } from "@/lib/reservations/mapper";
import { throwIfReservationOverlapError } from "@/lib/reservations/room-conflict";
import { ROOM_ARCHIVED_MARKER } from "@/lib/rooms/constants";
import type {
  AvailabilityQuery,
  ExtendStayAvailabilityQuery,
  ExtendStayAvailabilityResult,
  IReservationRepository,
} from "@/repositories/reservation.repository";
import type { PaginatedResult } from "@/repositories/types";
import type { SupabaseServerClient } from "@/lib/supabase/server";
import type {
  DbReservation,
  DbReservationGuestRole,
  DbReservationWithRelations,
  DbRoomWithType,
} from "@/types/database";
import type { BookingSource, ReservationStats, ReservationStatus } from "@/types/reservation";

const RESERVATION_SELECT = `
  *,
  guest:guests!reservations_guest_id_fkey (*),
  room:rooms!reservations_room_id_fkey (
    *,
    room_type:room_types!rooms_room_type_id_fkey (*),
    floor_record:floors!rooms_floor_id_fkey (*)
  ),
  room_type:room_types!reservations_room_type_id_fkey (*)
`;

/**
 * Analytics: full reservation columns, but only fields used by
 * mapDbReservationToReservation on related entities.
 */
const RESERVATION_ANALYTICS_SELECT = `
  *,
  guest:guests!reservations_guest_id_fkey (id, full_name, phone, email),
  room:rooms!reservations_room_id_fkey (
    id,
    room_number,
    floor_id,
    floor,
    notes,
    status,
    room_type_id,
    room_type:room_types!rooms_room_type_id_fkey (
      id, slug, name, default_price, capacity, description, amenities
    ),
    floor_record:floors!rooms_floor_id_fkey (id, name, display_order)
  ),
  room_type:room_types!reservations_room_type_id_fkey (
    id, slug, name, default_price, capacity, description, amenities
  )
`;

/** Same required relations as getAll(), without the full nested trees. */
const RESERVATION_LIST_KEY_SELECT = `
  id,
  status,
  booking_source,
  check_in_date,
  check_out_date,
  actual_check_out_date,
  reservation_number,
  guest:guests!reservations_guest_id_fkey!inner (full_name),
  room:rooms!reservations_room_id_fkey!inner (
    room_number,
    room_type:room_types!rooms_room_type_id_fkey!inner (id),
    floor_record:floors!rooms_floor_id_fkey!inner (id)
  ),
  room_type:room_types!reservations_room_type_id_fkey!inner (slug, name)
`;

const RESERVATION_LIST_COUNT_SELECT = `
  id,
  guest:guests!reservations_guest_id_fkey!inner (id),
  room:rooms!reservations_room_id_fkey!inner (
    id,
    room_type:room_types!rooms_room_type_id_fkey!inner (id),
    floor_record:floors!rooms_floor_id_fkey!inner (id)
  ),
  room_type:room_types!reservations_room_type_id_fkey!inner (id)
`;

const LIST_READ_BATCH = 1000;

const ROOM_SELECT = `
  *,
  room_type:room_types!rooms_room_type_id_fkey (*),
  floor_record:floors!rooms_floor_id_fkey (*)
`;

type ReservationRow = DbReservation & {
  guest: DbReservationWithRelations["guest"] | null;
  room: DbRoomWithType | null;
  room_type: DbReservationWithRelations["room_type"] | null;
};

type RoomRow = DbRoomWithType;

function toReservationWithRelations(
  row: ReservationRow | null
): DbReservationWithRelations | null {
  if (!row?.guest || !row.room?.room_type || !row.room?.floor_record || !row.room_type) {
    return null;
  }
  return {
    ...row,
    guest: row.guest,
    room: row.room as DbRoomWithType,
    room_type: row.room_type,
  };
}

export class SupabaseReservationRepository implements IReservationRepository {
  constructor(private readonly client: SupabaseServerClient) {}

  async getAll(): Promise<DbReservationWithRelations[]> {
    const { data, error } = await this.client
      .from("reservations")
      .select(RESERVATION_SELECT)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to list reservations: ${error.message}`);
    }

    return (data ?? [])
      .map((row) => toReservationWithRelations(row as unknown as ReservationRow))
      .filter((r): r is DbReservationWithRelations => Boolean(r));
  }

  async listPage(input: {
    page: number;
    pageSize: number;
    businessDate: string;
    filters: ReservationListFilters;
  }): Promise<PaginatedResult<DbReservationWithRelations>> {
    const page = input.page > 0 ? Math.floor(input.page) : 1;
    const pageSize = input.pageSize > 0 ? Math.floor(input.pageSize) : 25;
    const ordered = sortReservationListRows(
      (await this.listVisibleReservationKeys()).filter((row) =>
        reservationMatchesListFilters(row, input.filters)
      ),
      input.businessDate
    );
    const from = (page - 1) * pageSize;
    const pageKeys = ordered.slice(from, from + pageSize);
    if (pageKeys.length === 0) {
      return { data: [], total: ordered.length, page, pageSize };
    }

    const { data, error } = await this.client
      .from("reservations")
      .select(RESERVATION_SELECT)
      .in(
        "id",
        pageKeys.map((row) => row.id)
      );

    if (error) {
      throw new Error(`Failed to list reservations: ${error.message}`);
    }

    const byId = new Map<string, DbReservationWithRelations>();
    for (const raw of data ?? []) {
      const row = toReservationWithRelations(raw as unknown as ReservationRow);
      if (row) byId.set(row.id, row);
    }

    return {
      data: pageKeys.flatMap((key) => {
        const row = byId.get(key.id);
        return row ? [row] : [];
      }),
      total: ordered.length,
      page,
      pageSize,
    };
  }

  async countListStats(): Promise<ReservationStats> {
    const [total, pending, confirmed, checkedIn, checkedOut, cancelled] =
      await Promise.all([
        this.countVisibleReservations(),
        this.countVisibleReservations("pending"),
        this.countVisibleReservations("confirmed"),
        this.countVisibleReservations("checked_in"),
        this.countVisibleReservations(["checked_out", "checked_out_early"]),
        this.countVisibleReservations("cancelled"),
      ]);

    return {
      total,
      pending,
      confirmed,
      checkedIn,
      checkedOut,
      cancelled,
    };
  }

  async listVisibleRoomTypeOptions(): Promise<{ id: string; name: string }[]> {
    const byId = new Map<string, string>();
    for (const row of await this.listVisibleReservationKeys()) {
      if (!row.roomTypeId) continue;
      byId.set(row.roomTypeId, row.roomTypeName);
    }
    return [...byId.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  private async listVisibleReservationKeys(): Promise<
    (ReservationListRow & { roomTypeName: string })[]
  > {
    const rows: (ReservationListRow & { roomTypeName: string })[] = [];
    for (let offset = 0; ; offset += LIST_READ_BATCH) {
      const { data, error } = await this.client
        .from("reservations")
        .select(RESERVATION_LIST_KEY_SELECT)
        .order("id", { ascending: true })
        .range(offset, offset + LIST_READ_BATCH - 1);

      if (error) {
        throw new Error(`Failed to load reservation list keys: ${error.message}`);
      }

      const batch = data ?? [];
      for (const raw of batch) {
        const row = raw as unknown as {
          id: string;
          status: ReservationStatus;
          booking_source: BookingSource;
          check_in_date: string;
          check_out_date: string;
          actual_check_out_date: string | null;
          reservation_number: string;
          guest: { full_name: string };
          room: { room_number: string };
          room_type: { slug: string; name: string };
        };
        rows.push({
          id: row.id,
          status: row.status,
          bookingSource: row.booking_source,
          roomTypeId: row.room_type.slug,
          roomTypeName: row.room_type.name,
          checkInDate: row.check_in_date,
          checkOutDate: row.check_out_date,
          actualCheckOutDate: row.actual_check_out_date,
          reservationNumber: row.reservation_number,
          guestName: row.guest.full_name,
          roomNumber: row.room.room_number,
        });
      }
      if (batch.length < LIST_READ_BATCH) break;
    }
    return rows;
  }

  private async countVisibleReservations(
    status?: ReservationStatus | ReservationStatus[]
  ): Promise<number> {
    let query = this.client
      .from("reservations")
      .select(RESERVATION_LIST_COUNT_SELECT, { count: "exact", head: true });
    if (Array.isArray(status)) query = query.in("status", status);
    else if (status) query = query.eq("status", status);

    const { count, error } = await query;
    if (error) {
      throw new Error(`Failed to count reservations: ${error.message}`);
    }
    return count ?? 0;
  }

  async listForAnalytics(): Promise<DbReservationWithRelations[]> {
    const { data, error } = await this.client
      .from("reservations")
      .select(RESERVATION_ANALYTICS_SELECT)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(
        `Failed to list reservations for analytics: ${error.message}`
      );
    }

    return (data ?? [])
      .map((row) => toReservationWithRelations(row as unknown as ReservationRow))
      .filter((r): r is DbReservationWithRelations => Boolean(r));
  }

  async getById(id: string): Promise<DbReservationWithRelations | null> {
    if (isUuid(id)) {
      const { data, error } = await this.client
        .from("reservations")
        .select(RESERVATION_SELECT)
        .eq("id", id)
        .maybeSingle();

      if (error) {
        throw new Error(`Failed to load reservation: ${error.message}`);
      }

      return toReservationWithRelations(
        (data ?? null) as unknown as ReservationRow | null
      );
    }

    return this.getByNumber(id);
  }

  async getByNumber(
    reservationNumber: string
  ): Promise<DbReservationWithRelations | null> {
    const { data, error } = await this.client
      .from("reservations")
      .select(RESERVATION_SELECT)
      .eq("reservation_number", reservationNumber)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load reservation by number: ${error.message}`);
    }

    return toReservationWithRelations(
      (data ?? null) as unknown as ReservationRow | null
    );
  }

  async getByGuestId(guestId: string): Promise<DbReservationWithRelations[]> {
    const { data, error } = await this.client
      .from("reservations")
      .select(RESERVATION_SELECT)
      .eq("guest_id", guestId)
      .order("check_in_date", { ascending: false });

    if (error) {
      throw new Error(`Failed to load guest reservations: ${error.message}`);
    }

    return (data ?? [])
      .map((row) => toReservationWithRelations(row as unknown as ReservationRow))
      .filter((r): r is DbReservationWithRelations => Boolean(r));
  }

  async getByRoomId(roomId: string): Promise<DbReservationWithRelations[]> {
    const { data, error } = await this.client
      .from("reservations")
      .select(RESERVATION_SELECT)
      .eq("room_id", roomId)
      .order("check_in_date", { ascending: false });

    if (error) {
      throw new Error(`Failed to load room reservations: ${error.message}`);
    }

    return (data ?? [])
      .map((row) => toReservationWithRelations(row as unknown as ReservationRow))
      .filter((r): r is DbReservationWithRelations => Boolean(r));
  }

  async findPendingCheckIns(
    asOfDate: string
  ): Promise<DbReservationWithRelations[]> {
    const { data, error } = await this.client
      .from("reservations")
      .select(RESERVATION_SELECT)
      .eq("status", "confirmed")
      .lte("check_in_date", asOfDate)
      .order("check_in_date", { ascending: true });

    if (error) {
      throw new Error(`Failed to load pending check-ins: ${error.message}`);
    }

    return (data ?? [])
      .map((row) => toReservationWithRelations(row as unknown as ReservationRow))
      .filter((r): r is DbReservationWithRelations => Boolean(r));
  }

  async findCheckedIn(): Promise<DbReservationWithRelations[]> {
    const { data, error } = await this.client
      .from("reservations")
      .select(RESERVATION_SELECT)
      .eq("status", "checked_in")
      .order("check_out_date", { ascending: true });

    if (error) {
      throw new Error(`Failed to load checked-in reservations: ${error.message}`);
    }

    return (data ?? [])
      .map((row) => toReservationWithRelations(row as unknown as ReservationRow))
      .filter((r): r is DbReservationWithRelations => Boolean(r));
  }

  async checkAvailability(query: AvailabilityQuery): Promise<string[]> {
    const { checkIn, checkOut, roomTypeId, excludeReservationId } = query;
    if (!checkIn || !checkOut || checkOut <= checkIn) return [];

    const { data: roomsData, error: roomsError } = await this.client
      .from("rooms")
      .select(ROOM_SELECT)
      .order("room_number", { ascending: true });

    if (roomsError) {
      throw new Error(`Failed to load rooms for availability: ${roomsError.message}`);
    }

    const rooms = ((roomsData ?? []) as unknown as RoomRow[]).filter(
      (r) =>
        !(r.notes ?? "").includes(ROOM_ARCHIVED_MARKER) &&
        r.status === "available" &&
        (!roomTypeId || r.room_type?.slug === roomTypeId)
    );

    let resQuery = this.client
      .from("reservations")
      .select("room_id")
      .in("status", BLOCKING_RESERVATION_STATUSES)
      .lt("check_in_date", checkOut)
      .gt("check_out_date", checkIn);

    if (excludeReservationId) {
      resQuery = resQuery.neq("id", excludeReservationId);
    }

    const { data: bookedData, error: bookedError } = await resQuery;

    if (bookedError) {
      throw new Error(`Failed to check availability: ${bookedError.message}`);
    }

    const bookedRoomIds = new Set(
      (bookedData ?? []).map((r) => String(r.room_id))
    );

    const { data: blockedData, error: blockedError } = await this.client
      .from("reservation_blocks")
      .select("room_id, group_reservation_id, hold_until")
      .eq("status", "blocked")
      .gt("hold_until", new Date().toISOString());

    if (blockedError) {
      throw new Error(`Failed to check reservation blocks: ${blockedError.message}`);
    }

    let blockedRoomIds = new Set<string>();
    if ((blockedData ?? []).length > 0) {
      const groupIds = [
        ...new Set((blockedData ?? []).map((row) => String(row.group_reservation_id))),
      ];
      const { data: groups, error: groupError } = await this.client
        .from("group_reservations")
        .select("id, arrival_date, departure_date")
        .in("id", groupIds);

      if (groupError) {
        throw new Error(`Failed to load groups for blocks: ${groupError.message}`);
      }

      const overlappingGroupIds = new Set(
        (groups ?? [])
          .filter((g) => g.arrival_date < checkOut && g.departure_date > checkIn)
          .map((g) => String(g.id))
      );

      blockedRoomIds = new Set(
        (blockedData ?? [])
          .filter((row) => overlappingGroupIds.has(String(row.group_reservation_id)))
          .map((row) => String(row.room_id))
      );
    }

    return rooms
      .filter((room) => !bookedRoomIds.has(room.id) && !blockedRoomIds.has(room.id))
      .map((room) => room.id);
  }

  /**
   * Same-room extension overlap check.
   * Intentionally ignores rooms.status — the guest already occupies the room.
   */
  async checkExtendStayAvailability(
    query: ExtendStayAvailabilityQuery
  ): Promise<ExtendStayAvailabilityResult> {
    const { roomId, checkIn, checkOut, excludeReservationId } = query;
    if (!checkIn || !checkOut || checkOut <= checkIn) {
      return { available: false, reason: "invalid_dates" };
    }

    const { data: bookedData, error: bookedError } = await this.client
      .from("reservations")
      .select("id")
      .eq("room_id", roomId)
      .in("status", BLOCKING_RESERVATION_STATUSES)
      .lt("check_in_date", checkOut)
      .gt("check_out_date", checkIn)
      .neq("id", excludeReservationId);

    if (bookedError) {
      throw new Error(
        `Failed to check extend-stay availability: ${bookedError.message}`
      );
    }

    if ((bookedData ?? []).length > 0) {
      return { available: false, reason: "reservation" };
    }

    const { data: blockedData, error: blockedError } = await this.client
      .from("reservation_blocks")
      .select("room_id, group_reservation_id, hold_until")
      .eq("status", "blocked")
      .eq("room_id", roomId)
      .gt("hold_until", new Date().toISOString());

    if (blockedError) {
      throw new Error(
        `Failed to check extend-stay reservation blocks: ${blockedError.message}`
      );
    }

    if ((blockedData ?? []).length > 0) {
      const groupIds = [
        ...new Set(
          (blockedData ?? []).map((row) => String(row.group_reservation_id))
        ),
      ];
      const { data: groups, error: groupError } = await this.client
        .from("group_reservations")
        .select("id, arrival_date, departure_date")
        .in("id", groupIds);

      if (groupError) {
        throw new Error(
          `Failed to load groups for extend-stay blocks: ${groupError.message}`
        );
      }

      const hasOverlappingBlock = (groups ?? []).some(
        (g) => g.arrival_date < checkOut && g.departure_date > checkIn
      );

      if (hasOverlappingBlock) {
        return { available: false, reason: "block" };
      }
    }

    return { available: true };
  }

  async getNextReservationNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `SHMS-${year}-`;

    const { count, error } = await this.client
      .from("reservations")
      .select("*", { count: "exact", head: true })
      .like("reservation_number", `${prefix}%`);

    if (error) {
      throw new Error(`Failed to generate reservation number: ${error.message}`);
    }

    const seq = String((count ?? 0) + 1).padStart(4, "0");
    return `${prefix}${seq}`;
  }

  async create(
    data: Omit<
      DbReservation,
      "id" | "created_at" | "updated_at" | "reservation_number"
    >
  ): Promise<DbReservation> {
    const reservationNumber = await this.getNextReservationNumber();
    const { data: row, error } = await this.client
      .from("reservations")
      .insert({ ...data, reservation_number: reservationNumber })
      .select("*")
      .single();

    if (error || !row) {
      throwIfReservationOverlapError(
        error,
        `Failed to create reservation: ${error?.message ?? "unknown"}`
      );
    }

    return row;
  }

  async update(id: string, data: Partial<DbReservation>): Promise<DbReservation> {
    const { data: row, error } = await this.client
      .from("reservations")
      .update(data)
      .eq("id", id)
      .select("*")
      .single();

    if (error || !row) {
      throwIfReservationOverlapError(
        error,
        `Failed to update reservation: ${error?.message ?? "unknown"}`
      );
    }

    return row;
  }

  async cancel(id: string, reason?: string): Promise<DbReservation> {
    const notes = reason?.trim() || null;
    return this.update(id, {
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      internal_notes: notes,
    });
  }

  async linkGuest(
    reservationId: string,
    guestId: string,
    role: DbReservationGuestRole
  ): Promise<void> {
    const { error } = await this.client.from("reservation_guests").insert({
      reservation_id: reservationId,
      guest_id: guestId,
      role,
    });

    if (error) {
      throw new Error(`Failed to link guest to reservation: ${error.message}`);
    }
  }

  async countCheckInsToday(startIso: string, endIso: string): Promise<number> {
    const { count, error } = await this.client
      .from("reservations")
      .select("*", { count: "exact", head: true })
      .gte("checked_in_at", startIso)
      .lte("checked_in_at", endIso);

    if (error) {
      throw new Error(`Failed to count check-ins today: ${error.message}`);
    }

    return count ?? 0;
  }

  async countCheckOutsToday(startIso: string, endIso: string): Promise<number> {
    const { count, error } = await this.client
      .from("reservations")
      .select("*", { count: "exact", head: true })
      .gte("checked_out_at", startIso)
      .lte("checked_out_at", endIso);

    if (error) {
      throw new Error(`Failed to count check-outs today: ${error.message}`);
    }

    return count ?? 0;
  }
}
