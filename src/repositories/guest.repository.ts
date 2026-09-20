import type { BaseRepository } from "@/repositories/base.repository";
import type { DbGuest } from "@/types/database";

/** Columns needed for reports guest KPIs. */
export type AnalyticsGuestRow = {
  id: string;
  total_visits: number;
  vip_status: boolean;
  notes: DbGuest["notes"];
};

export interface IGuestRepository {
  getAll(includeArchived?: boolean): Promise<DbGuest[]>;
  /** Column-scoped guest rows for analytics (excludes archived in-repo). */
  listForAnalytics(): Promise<AnalyticsGuestRow[]>;
  getById(id: string): Promise<DbGuest | null>;
  findByEmail(email: string): Promise<DbGuest | null>;
  findByPhone(phone: string): Promise<DbGuest | null>;
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
