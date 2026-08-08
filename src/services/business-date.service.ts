import type { IActivityLogRepository } from "@/repositories/activity-log.repository";
import type { IHotelOperatingDayRepository } from "@/repositories/hotel-operating-day.repository";
import type { IUserRepository } from "@/repositories/user.repository";
import {
  addDaysToDateString,
  getCalendarDateString,
} from "@/lib/dates/today";
import { SYSTEM_HEAL_NOTES } from "@/lib/migrations/system-heal-notes";
import type { AuthSession } from "@/services/auth.service";
import { ServiceError } from "@/services/types";
import type { ServiceContext } from "@/services/types";
import { ActivityActionCodes } from "@/types/database/enums";
import type { DbHotelOperatingDay } from "@/types/database";
import type {
  AdvanceBusinessDateResult,
  HotelOperatingDay,
} from "@/types/business-date";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export interface IBusinessDateService {
  getOperatingDay(): Promise<HotelOperatingDay>;
  getCurrentBusinessDate(): Promise<string>;
  validateBusinessDay(date: string): void;
  advanceAfterNightAudit(
    ctx: ServiceContext,
    session: AuthSession,
    input: {
      closedBusinessDate: string;
      nightAuditId: string;
    }
  ): Promise<AdvanceBusinessDateResult>;
  reopenBusinessDate(
    ctx: ServiceContext,
    session: AuthSession,
    input: {
      auditDate: string;
      nightAuditId: string;
      reason: string;
    }
  ): Promise<AdvanceBusinessDateResult>;
}

export class BusinessDateService implements IBusinessDateService {
  constructor(
    private readonly operatingDay: IHotelOperatingDayRepository,
    private readonly users: IUserRepository,
    private readonly activityLogs?: IActivityLogRepository
  ) {}

  validateBusinessDay(date: string): void {
    if (!DATE_RE.test(date)) {
      throw new ServiceError(
        "A valid business date (YYYY-MM-DD) is required.",
        "VALIDATION",
        400
      );
    }
  }

  private async resolveUserNames(ids: (string | null | undefined)[]) {
    const unique = [...new Set(ids.filter(Boolean))] as string[];
    const map = new Map<string, string>();
    await Promise.all(
      unique.map(async (id) => {
        const user = await this.users.findById(id);
        if (user) map.set(id, user.full_name);
      })
    );
    return map;
  }

  private mapRow(
    row: DbHotelOperatingDay,
    userNames: Map<string, string> = new Map()
  ): HotelOperatingDay {
    return {
      id: row.id,
      currentBusinessDate: row.current_business_date,
      status: row.status,
      openedAt: row.opened_at,
      closedAt: row.closed_at,
      openedById: row.opened_by,
      openedByName: row.opened_by ? userNames.get(row.opened_by) ?? null : null,
      advancedById: row.advanced_by,
      advancedByName: row.advanced_by
        ? userNames.get(row.advanced_by) ?? null
        : null,
      nightAuditId: row.night_audit_id,
      notes: row.notes,
      updatedAt: row.updated_at,
    };
  }

  private async ensureRow(openedBy?: string | null): Promise<DbHotelOperatingDay> {
    const existing = await this.operatingDay.getSingleton();
    if (existing) return existing;

    return this.operatingDay.createSingleton({
      current_business_date: getCalendarDateString(),
      status: "open",
      opened_at: new Date().toISOString(),
      closed_at: null,
      opened_by: openedBy ?? null,
      advanced_by: null,
      night_audit_id: null,
      notes: SYSTEM_HEAL_NOTES.BUSINESS_DATE_ENGINE_INIT,
    });
  }

  async getOperatingDay(): Promise<HotelOperatingDay> {
    const row = await this.ensureRow(null);
    const userNames = await this.resolveUserNames([
      row.opened_by,
      row.advanced_by,
    ]);
    return this.mapRow(row, userNames);
  }

  async getCurrentBusinessDate(): Promise<string> {
    const row = await this.ensureRow(null);
    return row.current_business_date;
  }

  async advanceAfterNightAudit(
    ctx: ServiceContext,
    session: AuthSession,
    input: {
      closedBusinessDate: string;
      nightAuditId: string;
    }
  ): Promise<AdvanceBusinessDateResult> {
    this.validateBusinessDay(input.closedBusinessDate);
    const row = await this.ensureRow(ctx.userId);

    if (row.current_business_date !== input.closedBusinessDate) {
      // Historical re-close / correction — do not move the operational clock.
      return {
        advanced: false,
        previousBusinessDate: row.current_business_date,
        currentBusinessDate: row.current_business_date,
      };
    }

    const nextDate = addDaysToDateString(input.closedBusinessDate, 1);
    const now = new Date().toISOString();

    const updated = await this.operatingDay.updateSingleton({
      current_business_date: nextDate,
      status: "open",
      opened_at: now,
      closed_at: null,
      opened_by: ctx.userId,
      advanced_by: ctx.userId,
      night_audit_id: input.nightAuditId,
      notes: `Advanced from ${input.closedBusinessDate} after night audit close.`,
    });

    await this.safeLogBusinessDate(ctx, session, {
      action: `Advanced business date to ${nextDate}`,
      actionCode: ActivityActionCodes.BUSINESS_DATE_ADVANCED,
      metadata: {
        previous_business_date: input.closedBusinessDate,
        current_business_date: nextDate,
        operating_day_id: updated.id,
        night_audit_id: input.nightAuditId,
      },
    });

    return {
      advanced: true,
      previousBusinessDate: input.closedBusinessDate,
      currentBusinessDate: nextDate,
    };
  }

  async reopenBusinessDate(
    ctx: ServiceContext,
    session: AuthSession,
    input: {
      auditDate: string;
      nightAuditId: string;
      reason: string;
    }
  ): Promise<AdvanceBusinessDateResult> {
    this.validateBusinessDay(input.auditDate);
    const row = await this.ensureRow(ctx.userId);
    const expectedCurrent = addDaysToDateString(input.auditDate, 1);

    // Only roll back when this reopen undoes the most recent advance.
    if (row.current_business_date !== expectedCurrent) {
      return {
        advanced: false,
        previousBusinessDate: row.current_business_date,
        currentBusinessDate: row.current_business_date,
      };
    }

    const now = new Date().toISOString();
    const updated = await this.operatingDay.updateSingleton({
      current_business_date: input.auditDate,
      status: "open",
      opened_at: now,
      closed_at: null,
      opened_by: ctx.userId,
      advanced_by: null,
      night_audit_id: input.nightAuditId,
      notes: `Business date reopened to ${input.auditDate}. ${input.reason}`.trim(),
    });

    await this.safeLogBusinessDate(ctx, session, {
      action: `Reopened business date ${input.auditDate}`,
      actionCode: ActivityActionCodes.BUSINESS_DATE_REOPENED,
      metadata: {
        previous_business_date: expectedCurrent,
        current_business_date: input.auditDate,
        operating_day_id: updated.id,
        night_audit_id: input.nightAuditId,
        reason: input.reason,
      },
    });

    return {
      advanced: true,
      previousBusinessDate: expectedCurrent,
      currentBusinessDate: input.auditDate,
    };
  }

  /**
   * Business Date events use entity_id = null because hotel_operating_day.id
   * is a SMALLINT singleton (always 1), not a UUID. Context lives in metadata.
   * Logging failures must never undo an authoritative Business Date change.
   */
  private async safeLogBusinessDate(
    ctx: ServiceContext,
    session: AuthSession,
    input: {
      action: string;
      actionCode: string;
      metadata: Record<string, unknown>;
    }
  ): Promise<void> {
    if (!this.activityLogs) return;
    try {
      await this.activityLogs.create({
        userId: ctx.userId,
        userName: session.fullName,
        action: input.action,
        actionCode: input.actionCode,
        module: "night_audit",
        entityType: "hotel_operating_day",
        entityId: null,
        metadata: input.metadata,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(
        "[BusinessDate] Activity log write failed (operational change preserved):",
        message,
        input.metadata
      );
    }
  }
}
