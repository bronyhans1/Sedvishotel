import type { BaseRepository } from "@/repositories/base.repository";
import type {
  DbShiftHandover,
  DbShiftHandoverIssue,
  DbShiftHandoverTask,
} from "@/types/database";

export interface IShiftHandoverRepository {
  getOpenShift(): Promise<DbShiftHandover | null>;
  getByNumber(handoverNumber: string): Promise<DbShiftHandover | null>;
  getById(id: string): Promise<DbShiftHandover | null>;
  listAll(): Promise<DbShiftHandover[]>;
  getLatestClosed(): Promise<DbShiftHandover | null>;
  getPendingAcknowledgement(): Promise<DbShiftHandover | null>;
  getNextHandoverNumber(): Promise<string>;
  create(
    data: Omit<DbShiftHandover, "id" | "created_at" | "updated_at">
  ): Promise<DbShiftHandover>;
  update(id: string, data: Partial<DbShiftHandover>): Promise<DbShiftHandover>;
}

export interface IShiftHandoverTaskRepository {
  listPending(): Promise<DbShiftHandoverTask[]>;
  listForShift(shiftHandoverId: string): Promise<DbShiftHandoverTask[]>;
  create(
    data: Omit<DbShiftHandoverTask, "id" | "created_at" | "updated_at">
  ): Promise<DbShiftHandoverTask>;
  complete(
    id: string,
    completedBy: string,
    completedDuringShiftId: string | null
  ): Promise<DbShiftHandoverTask>;
  countCompletedDuringShift(shiftHandoverId: string): Promise<number>;
}

export interface IShiftHandoverIssueRepository {
  listOpen(): Promise<DbShiftHandoverIssue[]>;
  create(
    data: Omit<DbShiftHandoverIssue, "id" | "created_at" | "updated_at">
  ): Promise<DbShiftHandoverIssue>;
  resolve(
    id: string,
    resolvedBy: string,
    resolvedDuringShiftId: string | null
  ): Promise<DbShiftHandoverIssue>;
  countResolvedDuringShift(shiftHandoverId: string): Promise<number>;
}

export type ShiftHandoverRepository = IShiftHandoverRepository & BaseRepository;
