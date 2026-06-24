import { ROOM_ARCHIVED_MARKER } from "@/lib/rooms/constants";
import { isUuid } from "@/lib/rooms/mapper";
import { normalizeRoomNumber } from "@/lib/rooms/floor-layout";
import type { IRoomRepository } from "@/repositories/room.repository";
import type { SupabaseServerClient } from "@/lib/supabase/server";
import type { DbRoom, DbRoomStatus, DbRoomWithType } from "@/types/database";

const ROOM_SELECT = `
  *,
  room_type:room_types!rooms_room_type_id_fkey (*),
  floor_record:floors!rooms_floor_id_fkey (*)
`;

type RoomRow = DbRoom & {
  room_type: DbRoomWithType["room_type"] | null;
  floor_record: DbRoomWithType["floor_record"] | null;
};

function toRoomWithType(row: RoomRow | null): DbRoomWithType | null {
  if (!row?.room_type || !row?.floor_record) return null;
  return { ...row, room_type: row.room_type, floor_record: row.floor_record };
}

export class SupabaseRoomRepository implements IRoomRepository {
  constructor(private readonly client: SupabaseServerClient) {}

  async getAll(includeArchived = false): Promise<DbRoomWithType[]> {
    const { data, error } = await this.client
      .from("rooms")
      .select(ROOM_SELECT)
      .order("room_number", { ascending: true });

    if (error) {
      throw new Error(`Failed to list rooms: ${error.message}`);
    }

    const rows = (data ?? []) as unknown as RoomRow[];
    return rows
      .map(toRoomWithType)
      .filter((r): r is DbRoomWithType => Boolean(r))
      .filter((r) => includeArchived || !(r.notes ?? "").includes(ROOM_ARCHIVED_MARKER));
  }

  async getById(id: string): Promise<DbRoomWithType | null> {
    if (isUuid(id)) {
      const { data, error } = await this.client
        .from("rooms")
        .select(ROOM_SELECT)
        .eq("id", id)
        .maybeSingle();

      if (error) {
        throw new Error(`Failed to load room: ${error.message}`);
      }
      return toRoomWithType((data ?? null) as unknown as RoomRow | null);
    }

    return this.getByNumber(id);
  }

  async getByNumber(roomNumber: string): Promise<DbRoomWithType | null> {
    const normalized = normalizeRoomNumber(roomNumber);
    const { data, error } = await this.client
      .from("rooms")
      .select(ROOM_SELECT)
      .eq("room_number", normalized)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load room by number: ${error.message}`);
    }

    return toRoomWithType((data ?? null) as unknown as RoomRow | null);
  }

  async create(
    data: Omit<DbRoom, "id" | "created_at" | "updated_at">
  ): Promise<DbRoomWithType> {
    const { data: row, error } = await this.client
      .from("rooms")
      .insert(data)
      .select(ROOM_SELECT)
      .single();

    if (error || !row) {
      throw new Error(`Failed to create room: ${error?.message ?? "unknown"}`);
    }

    const mapped = toRoomWithType(row as unknown as RoomRow);
    if (!mapped) {
      throw new Error("Failed to load room relations for new room");
    }
    return mapped;
  }

  async update(id: string, data: Partial<DbRoom>): Promise<DbRoomWithType> {
    const { data: row, error } = await this.client
      .from("rooms")
      .update(data)
      .eq("id", id)
      .select(ROOM_SELECT)
      .single();

    if (error || !row) {
      throw new Error(`Failed to update room: ${error?.message ?? "unknown"}`);
    }

    const mapped = toRoomWithType(row as unknown as RoomRow);
    if (!mapped) {
      throw new Error("Failed to load room relations after update");
    }
    return mapped;
  }

  async changeStatus(id: string, status: DbRoomStatus): Promise<DbRoomWithType> {
    return this.update(id, { status });
  }

  async archive(id: string): Promise<DbRoomWithType> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error("Room not found");
    }
    const notes = `${existing.notes ?? ""}\n${ROOM_ARCHIVED_MARKER}`.trim();
    return this.update(id, { notes, status: "maintenance" });
  }

  async countByStatus(): Promise<Record<DbRoomStatus, number>> {
    const rooms = await this.getAll(false);
    const counts: Record<DbRoomStatus, number> = {
      available: 0,
      occupied: 0,
      reserved: 0,
      cleaning: 0,
      maintenance: 0,
    };
    for (const room of rooms) {
      counts[room.status] += 1;
    }
    return counts;
  }

  async getDeleteBlockers(roomId: string): Promise<string[]> {
    const blockers: string[] = [];
    const { count, error } = await this.client
      .from("reservations")
      .select("*", { count: "exact", head: true })
      .eq("room_id", roomId);

    if (error) {
      throw new Error(`Failed to check reservations: ${error.message}`);
    }

    if ((count ?? 0) > 0) {
      blockers.push(`${count} reservation(s) reference this room`);
    }

    return blockers;
  }

  async delete(id: string): Promise<void> {
    const blockers = await this.getDeleteBlockers(id);
    if (blockers.length > 0) {
      throw new Error(
        `Cannot delete room. ${blockers.join("; ")}. Archive instead.`
      );
    }

    const { error } = await this.client.from("rooms").delete().eq("id", id);
    if (error) {
      throw new Error(`Failed to delete room: ${error.message}`);
    }
  }
}
