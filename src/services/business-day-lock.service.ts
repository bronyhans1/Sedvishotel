import type { IActivityLogRepository } from "@/repositories/activity-log.repository";
import type {
  IBusinessDayLockAuditRepository,
  ICorrectionSessionRepository,
} from "@/repositories/correction-session.repository";
import type { INightAuditRepository } from "@/repositories/night-audit.repository";
import type { IUserRepository } from "@/repositories/user.repository";
import { loadLockPolicy } from "@/lib/settings/lock-policy";
import type { AuthSession } from "@/services/auth.service";
import { ServiceError } from "@/services/types";
import type { ServiceContext } from "@/services/types";
import { ActivityActionCodes } from "@/types/database/enums";
import type { DbCorrectionSession } from "@/types/database";
import type {
  BusinessDayLockDecision,
  BusinessDayWriteOperation,
  CorrectionSession,
  LockPolicy,
} from "@/types/operational-integrity";

function mapSession(
  row: DbCorrectionSession,
  userNames: Map<string, string> = new Map()
): CorrectionSession {
  const openedAt = row.opened_at;
  const closedAt = row.closed_at;
  let durationMinutes: number | null = null;
  if (closedAt) {
    durationMinutes = Math.max(
      0,
      Math.round(
        (new Date(closedAt).getTime() - new Date(openedAt).getTime()) / 60000
      )
    );
  } else {
    durationMinutes = Math.max(
      0,
      Math.round((Date.now() - new Date(openedAt).getTime()) / 60000)
    );
  }

  return {
    id: row.id,
    sessionNumber: row.session_number,
    businessDate: row.business_date,
    nightAuditId: row.night_audit_id,
    status: row.status,
    reason: row.reason,
    openedById: row.opened_by,
    openedByName: row.opened_by
      ? userNames.get(row.opened_by) ?? null
      : null,
    openedAt,
    closedById: row.closed_by,
    closedByName: row.closed_by
      ? userNames.get(row.closed_by) ?? null
      : null,
    closedAt,
    durationMinutes,
    correctionsCount: row.corrections_count,
    financialImpact: Number(row.financial_impact),
    reviewNotes: row.review_notes,
  };
}

/**
 * Centralized Business Day Lock Manager.
 * No financial/operational module should decide locking independently.
 */
export class BusinessDayLockService {
  constructor(
    private readonly nightAudits: INightAuditRepository,
    private readonly corrections: ICorrectionSessionRepository,
    private readonly lockAudits: IBusinessDayLockAuditRepository,
    private readonly users: IUserRepository,
    private readonly activityLogs?: IActivityLogRepository
  ) {}

  private async resolveNames(ids: (string | null | undefined)[]) {
    const map = new Map<string, string>();
    for (const id of [...new Set(ids.filter(Boolean))] as string[]) {
      const user = await this.users.findById(id);
      if (user) map.set(id, user.full_name);
    }
    return map;
  }

  async isBusinessDayClosed(businessDate: string): Promise<boolean> {
    const audit = await this.nightAudits.getByDate(businessDate);
    return Boolean(audit && audit.status === "closed");
  }

  async getOpenCorrectionSession(
    businessDate: string
  ): Promise<CorrectionSession | null> {
    const row = await this.corrections.getOpenByBusinessDate(businessDate);
    if (!row) return null;
    const names = await this.resolveNames([row.opened_by, row.closed_by]);
    return mapSession(row, names);
  }

  async canPostToBusinessDate(
    businessDate: string,
    operation: BusinessDayWriteOperation,
    policy?: LockPolicy
  ): Promise<BusinessDayLockDecision> {
    const lockPolicy = policy ?? (await loadLockPolicy());
    const dayClosed = await this.isBusinessDayClosed(businessDate);
    const openSession = dayClosed
      ? await this.corrections.getOpenByBusinessDate(businessDate)
      : null;

    if (!dayClosed) {
      return {
        allowed: true,
        businessDate,
        dayClosed: false,
        hasOpenCorrectionSession: false,
        correctionSessionId: null,
        reason: "Business day is open.",
        requiresCorrectionSession: false,
      };
    }

    const policyBlocks =
      (operation === "inventory_adjustment" &&
        lockPolicy.blockInventoryAdjustments) ||
      (operation === "manual_payment" && lockPolicy.blockManualPayments) ||
      operation === "manual_accommodation" ||
      operation === "manual_room_charge" ||
      operation === "manual_folio_entry" ||
      operation === "manual_folio_credit" ||
      operation === "revenue_correction" ||
      operation === "operational_posting";

    if (!policyBlocks) {
      return {
        allowed: true,
        businessDate,
        dayClosed: true,
        hasOpenCorrectionSession: Boolean(openSession),
        correctionSessionId: openSession?.id ?? null,
        reason: "Operation allowed by hotel lock policy.",
        requiresCorrectionSession: false,
      };
    }

    if (openSession) {
      return {
        allowed: true,
        businessDate,
        dayClosed: true,
        hasOpenCorrectionSession: true,
        correctionSessionId: openSession.id,
        reason: `Allowed under Correction Session ${openSession.session_number}.`,
        requiresCorrectionSession: false,
      };
    }

    return {
      allowed: false,
      businessDate,
      dayClosed: true,
      hasOpenCorrectionSession: false,
      correctionSessionId: null,
      reason: `Business day ${businessDate} is closed. Open a Correction Session to post ${operation.replace(/_/g, " ")}.`,
      requiresCorrectionSession: true,
    };
  }

  async canModifyBusinessDate(businessDate: string): Promise<boolean> {
    const decision = await this.canPostToBusinessDate(
      businessDate,
      "operational_posting"
    );
    return decision.allowed;
  }

  async requireOpenBusinessDate(
    businessDate: string,
    operation: BusinessDayWriteOperation = "operational_posting"
  ): Promise<void> {
    const decision = await this.canPostToBusinessDate(businessDate, operation);
    if (!decision.allowed) {
      throw new ServiceError(decision.reason, "BUSINESS_DAY_LOCKED", 423);
    }
  }

  async requireCorrectionSession(businessDate: string): Promise<CorrectionSession> {
    const session = await this.getOpenCorrectionSession(businessDate);
    if (!session) {
      throw new ServiceError(
        `No open Correction Session for ${businessDate}.`,
        "CORRECTION_SESSION_REQUIRED",
        423
      );
    }
    return session;
  }

  /**
   * Enforce lock and record denial audit when blocked.
   */
  async assertWritable(
    ctx: ServiceContext,
    session: AuthSession,
    input: {
      businessDate: string;
      operation: BusinessDayWriteOperation;
      module: string;
      entityType?: string;
      entityId?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<BusinessDayLockDecision> {
    const decision = await this.canPostToBusinessDate(
      input.businessDate,
      input.operation
    );

    if (decision.allowed) {
      if (decision.hasOpenCorrectionSession && decision.correctionSessionId) {
        const row = await this.corrections.getById(decision.correctionSessionId);
        if (row) {
          await this.corrections.update(row.id, {
            correctionsCount: (row.corrections_count ?? 0) + 1,
          });
        }
      }
      return decision;
    }

    await this.lockAudits.create({
      businessDate: input.businessDate,
      operation: input.operation,
      module: input.module,
      reason: decision.reason,
      userId: ctx.userId,
      userName: session.fullName,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: input.metadata,
    });

    if (this.activityLogs) {
      await this.activityLogs.create({
        userId: ctx.userId,
        userName: session.fullName,
        action: `Blocked ${input.operation} on closed business day ${input.businessDate}`,
        actionCode: ActivityActionCodes.BUSINESS_DAY_LOCK_DENIED,
        module: input.module,
        entityType: input.entityType,
        entityId: input.entityId,
        status: "warning",
        metadata: {
          business_date: input.businessDate,
          operation: input.operation,
          reason: decision.reason,
          ...(input.metadata ?? {}),
        },
      });
    }

    throw new ServiceError(decision.reason, "BUSINESS_DAY_LOCKED", 423);
  }
}
