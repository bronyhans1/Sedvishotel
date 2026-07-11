import type { BaseRepository } from "@/repositories/base.repository";
import type { DbRoom, DbRoomStatus, DbRoomWithType } from "@/types/database";

export interface IRoomRepository {
  getAll(includeArchived?: boolean): Promise<DbRoomWithType[]>;
  getById(id: string): Promise<DbRoomWithType | null>;
  getByNumber(roomNumber: string): Promise<DbRoomWithType | null>;
  create(
    data: Omit<DbRoom, "id" | "created_at" | "updated_at">
  ): Promise<DbRoomWithType>;
  update(id: string, data: Partial<DbRoom>): Promise<DbRoomWithType>;
  changeStatus(id: string, status: DbRoomStatus): Promise<DbRoomWithType>;
  archive(id: string): Promise<DbRoomWithType>;
  countByStatus(): Promise<Record<DbRoomStatus, number>>;
  getDeleteBlockers(roomId: string): Promise<string[]>;
  delete(id: string): Promise<void>;
}

export type RoomRepository = IRoomRepository & BaseRepository;
