import type {
  GuestDirectoryStats,
  GuestListFilters,
  GuestListStay,
} from "@/lib/guests/list-order";
import type { BaseRepository } from "@/repositories/base.repository";
import type { PaginatedResult } from "@/repositories/types";
import type { DbGuest } from "@/types/database";

export type GuestListPageResult = PaginatedResult<DbGuest> & {
  stays: GuestListStay[];
  /** Full non-archived directory. Ignores search, status, and page. */
  stats: GuestDirectoryStats;
};

/** Columns needed for reports guest KPIs. */
export type AnalyticsGuestRow = {
  id: string;
  total_visits: number;
  vip_status: boolean;
  notes: DbGuest["notes"];
};

export interface IGuestRepository {
  getAll(includeArchived?: boolean): Promise<DbGuest[]>;
  /**
   * One operational page for the guests screen.
   * Does not change getAll().
   */
  listPage(input: {
    page: number;
    pageSize: number;
    businessDate: string;
    filters: GuestListFilters;
  }): Promise<GuestListPageResult>;
  /** Column-scoped guest rows for analytics (excludes archived in-repo). */
  listForAnalytics(): Promise<AnalyticsGuestRow[]>;
  getById(id: string): Promise<DbGuest | null>;
  findByEmail(email: string): Promise<DbGuest | null>;
  findByPhone(phone: string): Promise<DbGuest | null>;
  /** Small name/phone search for assignment. Does not replace getAll() or listPage(). */
  searchAssignable(query: string, limit?: number): Promise<DbGuest[]>;
  create(
    data: Omit<
      DbGuest,
      "id" | "created_at" | "updated_at" | "total_visits" | "total_spent"
    >
  ): Promise<DbGuest>;
  update(id: string, data: Partial<DbGuest>): Promise<DbGuest>;
  archive(id: string): Promise<DbGuest>;
  incrementVisitStats(id: string, amountSpent: number): Promise<DbGuest>;
}

export type GuestRepository = IGuestRepository & BaseRepository;
