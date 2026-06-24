import type { BaseRepository } from "@/repositories/base.repository";
import type { DbFloor } from "@/types/database";

export interface IFloorRepository {
  getAll(includeArchived?: boolean): Promise<DbFloor[]>;
  getById(id: string): Promise<DbFloor | null>;
  create(data: Omit<DbFloor, "id" | "created_at" | "updated_at">): Promise<DbFloor>;
  update(id: string, data: Partial<DbFloor>): Promise<DbFloor>;
  archive(id: string): Promise<DbFloor>;
  getRoomCount(floorId: string): Promise<number>;
  getNextDisplayOrder(): Promise<number>;
  reorder(items: { id: string; displayOrder: number }[]): Promise<void>;
}

export type FloorRepository = IFloorRepository & BaseRepository;
