import type { BaseRepository } from "@/repositories/base.repository";
import type { DbNightAudit } from "@/types/database";

export interface INightAuditRepository {
  getByDate(auditDate: string): Promise<DbNightAudit | null>;
  getByNumber(auditNumber: string): Promise<DbNightAudit | null>;
  getById(id: string): Promise<DbNightAudit | null>;
  listAll(): Promise<DbNightAudit[]>;
  getNextAuditNumber(): Promise<string>;
  create(
    data: Omit<DbNightAudit, "id" | "created_at" | "updated_at">
  ): Promise<DbNightAudit>;
  update(id: string, data: Partial<DbNightAudit>): Promise<DbNightAudit>;
}

export type NightAuditRepository = INightAuditRepository & BaseRepository;
