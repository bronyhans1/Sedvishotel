import type {
  DbBusinessDayLockAudit,
  DbCorrectionSession,
  DbCorrectionSessionStatus,
} from "@/types/database";

export type CreateCorrectionSessionInput = {
  sessionNumber: string;
  businessDate: string;
  nightAuditId?: string | null;
  reason: string;
  openedBy?: string | null;
};

export type UpdateCorrectionSessionInput = Partial<{
  status: DbCorrectionSessionStatus;
  closedBy: string | null;
  closedAt: string | null;
  correctionsCount: number;
  financialImpact: number;
  reviewNotes: string | null;
}>;

export interface ICorrectionSessionRepository {
  getById(id: string): Promise<DbCorrectionSession | null>;
  getOpenByBusinessDate(businessDate: string): Promise<DbCorrectionSession | null>;
  listByBusinessDate(businessDate: string): Promise<DbCorrectionSession[]>;
  listOpen(): Promise<DbCorrectionSession[]>;
  create(input: CreateCorrectionSessionInput): Promise<DbCorrectionSession>;
  update(
    id: string,
    input: UpdateCorrectionSessionInput
  ): Promise<DbCorrectionSession>;
  getNextSessionNumber(businessDate: string): Promise<string>;
}

export type CreateLockAuditInput = {
  businessDate: string;
  operation: string;
  module: string;
  reason: string;
  userId?: string | null;
  userName?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
};

export interface IBusinessDayLockAuditRepository {
  create(input: CreateLockAuditInput): Promise<DbBusinessDayLockAudit>;
  listByBusinessDate(businessDate: string): Promise<DbBusinessDayLockAudit[]>;
}
