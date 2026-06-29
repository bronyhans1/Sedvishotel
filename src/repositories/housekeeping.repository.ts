import type { BaseRepository } from "@/repositories/base.repository";
import type { DbHousekeepingStatus, DbHousekeepingTask } from "@/types/database";

export interface IHousekeepingRepository {
  findById(id: string): Promise<DbHousekeepingTask | null>;
  findByRoomId(roomId: string): Promise<DbHousekeepingTask | null>;
  findAll(status?: DbHousekeepingStatus): Promise<DbHousekeepingTask[]>;
  create(
    data: Omit<DbHousekeepingTask, "id" | "created_at" | "updated_at">
  ): Promise<DbHousekeepingTask>;
  assignStaff(taskId: string, staffUserId: string): Promise<DbHousekeepingTask>;
  updateStatus(
    taskId: string,
    status: DbHousekeepingStatus,
    extra?: Partial<DbHousekeepingTask>
  ): Promise<DbHousekeepingTask>;
}

export type HousekeepingRepository = IHousekeepingRepository & BaseRepository;
