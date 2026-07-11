import { BLOCKING_RESERVATION_STATUSES } from "@/lib/reservations/constants";
import { isUuid } from "@/lib/reservations/mapper";
import { throwIfReservationOverlapError } from "@/lib/reservations/room-conflict";
import { ROOM_ARCHIVED_MARKER } from "@/lib/rooms/constants";
import type {
  AvailabilityQuery,
  IReservationRepository,
} from "@/repositories/reservation.repository";
import type { SupabaseServerClient } from "@/lib/supabase/server";
import type {
  DbReservation,
  DbReservationGuestRole,
  DbReservationWithRelations,
  DbRoomWithType,
} from "@/types/database";

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

    return rooms
      .filter((room) => !bookedRoomIds.has(room.id))
      .map((room) => room.id);
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
