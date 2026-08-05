import { sessionHasPermission } from "@/lib/auth/permissions";
import type { IActivityLogRepository } from "@/repositories/activity-log.repository";
import type { ICorrectionSessionRepository } from "@/repositories/correction-session.repository";
import type { INightAuditRepository } from "@/repositories/night-audit.repository";
import type { IUserRepository } from "@/repositories/user.repository";
import type { AuthSession } from "@/services/auth.service";
import { ServiceError } from "@/services/types";
import type { ServiceContext } from "@/services/types";
import { ActivityActionCodes } from "@/types/database/enums";
import type { DbCorrectionSession } from "@/types/database";
import type { CorrectionSession } from "@/types/operational-integrity";

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
 * Correction Session lifecycle — Closed → Open → Corrections → Review → Re-Close → Locked.
 * Distinct from Night Audit reopen (does not roll Business Date).
 */
export class CorrectionSessionService {
  constructor(
    private readonly corrections: ICorrectionSessionRepository,
    private readonly nightAudits: INightAuditRepository,
    private readonly users: IUserRepository,
    private readonly activityLogs: IActivityLogRepository
  ) {}

  private requireManage(session: AuthSession) {
    if (!sessionHasPermission(session, "night_audit", "manage")) {
      throw new ServiceError(
        "Manager permission required (night_audit.manage).",
        "FORBIDDEN",
        403
      );
    }
  }

  private async resolveNames(ids: (string | null | undefined)[]) {
    const map = new Map<string, string>();
    for (const id of [...new Set(ids.filter(Boolean))] as string[]) {
      const user = await this.users.findById(id);
      if (user) map.set(id, user.full_name);
    }
    return map;
  }

  async getOpenSession(businessDate: string): Promise<CorrectionSession | null> {
    const row = await this.corrections.getOpenByBusinessDate(businessDate);
    if (!row) return null;
    return mapSession(row, await this.resolveNames([row.opened_by, row.closed_by]));
  }

  async listForBusinessDate(businessDate: string): Promise<CorrectionSession[]> {
    const rows = await this.corrections.listByBusinessDate(businessDate);
    const names = await this.resolveNames(
      rows.flatMap((r) => [r.opened_by, r.closed_by])
    );
    return rows.map((r) => mapSession(r, names));
  }

  /**
   * Idempotent open: returns existing open session for the date if present.
   */
  async openSession(
    ctx: ServiceContext,
    session: AuthSession,
    input: { businessDate: string; reason: string }
  ): Promise<CorrectionSession> {
    this.requireManage(session);
    const reason = input.reason.trim();
    if (!reason) {
      throw new ServiceError("Correction reason is required.", "VALIDATION", 400);
    }

    const existing = await this.corrections.getOpenByBusinessDate(
      input.businessDate
    );
    if (existing) {
      return mapSession(
        existing,
        await this.resolveNames([existing.opened_by, existing.closed_by])
      );
    }

    const audit = await this.nightAudits.getByDate(input.businessDate);
    if (!audit || audit.status !== "closed") {
      throw new ServiceError(
        "Correction Sessions apply only to CLOSED business days.",
        "VALIDATION",
        400
      );
    }

    const sessionNumber = await this.corrections.getNextSessionNumber(
      input.businessDate
    );

    let created: DbCorrectionSession;
    try {
      created = await this.corrections.create({
        sessionNumber,
        businessDate: input.businessDate,
        nightAuditId: audit.id,
        reason,
        openedBy: ctx.userId,
      });
    } catch (error) {
      // Unique open-per-date race → recover existing
      const raced = await this.corrections.getOpenByBusinessDate(
        input.businessDate
      );
      if (raced) {
        return mapSession(
          raced,
          await this.resolveNames([raced.opened_by, raced.closed_by])
        );
      }
      throw error;
    }

    await this.activityLogs.create({
      userId: ctx.userId,
      userName: session.fullName,
      action: `Opened correction session ${created.session_number}`,
      actionCode: ActivityActionCodes.CORRECTION_SESSION_OPENED,
      module: "night_audit",
      entityType: "correction_session",
      entityId: created.id,
      metadata: {
        business_date: input.businessDate,
        reason,
        session_number: created.session_number,
      },
    });

    return mapSession(
      created,
      await this.resolveNames([created.opened_by, created.closed_by])
    );
  }

  async markReview(
    ctx: ServiceContext,
    session: AuthSession,
    sessionId: string,
    notes?: string
  ): Promise<CorrectionSession> {
    this.requireManage(session);
    const row = await this.corrections.getById(sessionId);
    if (!row || row.status !== "open") {
      throw new ServiceError(
        "Only open correction sessions can enter review.",
        "VALIDATION",
        400
      );
    }

    const updated = await this.corrections.update(sessionId, {
      status: "review",
      reviewNotes: notes?.trim() || row.review_notes,
    });

    await this.activityLogs.create({
      userId: ctx.userId,
      userName: session.fullName,
      action: `Correction session ${row.session_number} moved to review`,
      actionCode: ActivityActionCodes.CORRECTION_SESSION_REVIEW,
      module: "night_audit",
      entityType: "correction_session",
      entityId: sessionId,
      metadata: { business_date: row.business_date },
    });

    return mapSession(
      updated,
      await this.resolveNames([updated.opened_by, updated.closed_by])
    );
  }

  /**
   * Re-close correction session → business day locked again.
   * Idempotent if already closed.
   */
  async closeSession(
    ctx: ServiceContext,
    session: AuthSession,
    sessionId: string,
    notes?: string
  ): Promise<CorrectionSession> {
    this.requireManage(session);
    const row = await this.corrections.getById(sessionId);
    if (!row) {
      throw new ServiceError("Correction session not found.", "NOT_FOUND", 404);
    }
    if (row.status === "closed") {
      return mapSession(
        row,
        await this.resolveNames([row.opened_by, row.closed_by])
      );
    }

    const updated = await this.corrections.update(sessionId, {
      status: "closed",
      closedBy: ctx.userId,
      closedAt: new Date().toISOString(),
      reviewNotes: notes?.trim() || row.review_notes,
    });

    await this.activityLogs.create({
      userId: ctx.userId,
      userName: session.fullName,
      action: `Closed correction session ${row.session_number}`,
      actionCode: ActivityActionCodes.CORRECTION_SESSION_CLOSED,
      module: "night_audit",
      entityType: "correction_session",
      entityId: sessionId,
      metadata: {
        business_date: row.business_date,
        corrections_count: row.corrections_count,
        financial_impact: Number(row.financial_impact),
        duration_minutes: mapSession(updated).durationMinutes,
      },
    });

    return mapSession(
      updated,
      await this.resolveNames([updated.opened_by, updated.closed_by])
    );
  }
}
