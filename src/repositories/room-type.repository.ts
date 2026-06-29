import type { BaseRepository } from "@/repositories/base.repository";
import type { DbRoomType, DbRoomTypeStatus } from "@/types/database";

export interface IRoomTypeRepository {
  getAll(includeArchived?: boolean): Promise<DbRoomType[]>;
  getById(idOrSlug: string): Promise<DbRoomType | null>;
  create(data: Omit<DbRoomType, "id" | "created_at" | "updated_at">): Promise<DbRoomType>;
  update(id: string, data: Partial<DbRoomType>): Promise<DbRoomType>;
  archive(id: string): Promise<DbRoomType>;
  /** Room numbers assigned to a room type (UUID). */
  getAssignedRoomNumbers(roomTypeId: string): Promise<string[]>;
  findBySlug(slug: string): Promise<DbRoomType | null>;
  getNextSortOrder(): Promise<number>;
  /** Returns blocking reasons when delete is not allowed. */
  getDeleteBlockers(roomTypeId: string): Promise<string[]>;
  delete(id: string): Promise<void>;
}

export type RoomTypeRepository = IRoomTypeRepository & BaseRepository;
