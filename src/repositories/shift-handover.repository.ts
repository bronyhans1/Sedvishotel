import type { BaseRepository } from "@/repositories/base.repository";
import type { DbShiftHandover } from "@/types/database";

export interface IShiftHandoverRepository {
  getOpenShift(): Promise<DbShiftHandover | null>;
  getByNumber(handoverNumber: string): Promise<DbShiftHandover | null>;
  getById(id: string): Promise<DbShiftHandover | null>;
  listAll(): Promise<DbShiftHandover[]>;
  getNextHandoverNumber(): Promise<string>;
  create(
    data: Omit<DbShiftHandover, "id" | "created_at" | "updated_at">
  ): Promise<DbShiftHandover>;
  update(id: string, data: Partial<DbShiftHandover>): Promise<DbShiftHandover>;
}

export type ShiftHandoverRepository = IShiftHandoverRepository & BaseRepository;
