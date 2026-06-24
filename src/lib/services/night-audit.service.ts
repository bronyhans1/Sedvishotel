import { computeCashVariance } from "@/lib/night-audit/cash-variance";
import { getTodayDateString } from "@/lib/dates/today";
import {
  mapDbNightAuditToNightAudit,
  snapshotToDbFields,
} from "@/lib/night-audit/mapper";
import { buildNightAuditSnapshot } from "@/lib/night-audit/snapshot";
import { sessionHasPermission } from "@/lib/auth/permissions";
import type { IActivityLogRepository } from "@/repositories/activity-log.repository";
import type { INightAuditRepository } from "@/repositories/night-audit.repository";
import type { IPaymentRepository } from "@/repositories/payment.repository";
import type { IReservationRepository } from "@/repositories/reservation.repository";
import type { IRoomRepository } from "@/repositories/room.repository";
import type { IShiftHandoverRepository } from "@/repositories/shift-handover.repository";
import type { IUserRepository } from "@/repositories/user.repository";
import type { AuthSession } from "@/services/auth.service";
import { ServiceError } from "@/services/types";
import type { ServiceContext } from "@/services/types";
import { ActivityActionCodes } from "@/types/database/enums";
import type {
  CloseNightAuditInput,
  NightAudit,
  NightAuditSnapshot,
} from "@/types/night-audit";

export interface INightAuditService {
  getCurrentAudit(ctx: ServiceContext, session: AuthSession): Promise<NightAudit>;
  generateSnapshot(
    ctx: ServiceContext,
    session: AuthSession,
    auditDate: string
  ): Promise<NightAuditSnapshot>;
  closeDay(
    ctx: ServiceContext,
    session: AuthSession,
    input: CloseNightAuditInput
  ): Promise<NightAudit>;
  reopenDay(
    ctx: ServiceContext,
    session: AuthSession,
    auditNumber: string,
    reason: string
  ): Promise<NightAudit>;
  listAudits(ctx: ServiceContext, session: AuthSession): Promise<NightAudit[]>;
  getAuditByNumber(
    ctx: ServiceContext,
    session: AuthSession,
    auditNumber: string
  ): Promise<NightAudit | null>;
  getAuditByDate(
    ctx: ServiceContext,
    session: AuthSession,
    auditDate: string
  ): Promise<NightAudit | null>;
}

export class NightAuditService implements INightAuditService {
  constructor(
    private readonly nightAudits: INightAuditRepository,
    private readonly shiftHandovers: IShiftHandoverRepository,
    private readonly rooms: IRoomRepository,
    private readonly reservations: IReservationRepository,
    private readonly payments: IPaymentRepository,
    private readonly users: IUserRepository,
    private readonly activityLogs: IActivityLogRepository
  ) {}

  private require(
    session: AuthSession,
    action: "view" | "create" | "edit" | "delete" | "manage"
  ): void {
    if (!sessionHasPermission(session, "night_audit", action)) {
      throw new ServiceError(
        `Forbidden: missing permission night_audit.${action}`,
        "FORBIDDEN",
        403
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

  private async resolveShift(shiftId: string | null) {
    if (!shiftId) return null;
    return this.shiftHandovers.getById(shiftId);
  }

  private async mapRow(row: Awaited<ReturnType<INightAuditRepository["getById"]>>) {
    if (!row) return null;
    const userNames = await this.resolveUserNames([
      row.opened_by,
      row.closed_by,
      row.reopened_by,
    ]);
    const shift = await this.resolveShift(row.shift_handover_id);
    return mapDbNightAuditToNightAudit(row, userNames, shift);
  }

  private async log(
    ctx: ServiceContext,
    session: AuthSession,
    input: {
      action: string;
      actionCode: string;
      entityId: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<void> {
    await this.activityLogs.create({
      userId: ctx.userId,
      userName: session.fullName,
      action: input.action,
      actionCode: input.actionCode,
      module: "night_audit",
      entityType: "night_audit",
      entityId: input.entityId,
      metadata: input.metadata,
    });
  }

  private snapshotDeps() {
    return {
      rooms: this.rooms,
      reservations: this.reservations,
      payments: this.payments,
    };
  }

  async getCurrentAudit(ctx: ServiceContext, session: AuthSession): Promise<NightAudit> {
    this.require(session, "view");
    const businessDate = getTodayDateString();
    let row = await this.nightAudits.getByDate(businessDate);

    if (!row) {
      const auditNumber = await this.nightAudits.getNextAuditNumber();
      row = await this.nightAudits.create({
        night_audit_number: auditNumber,
        audit_date: businessDate,
        opened_at: new Date().toISOString(),
        closed_at: null,
        opened_by: ctx.userId,
        closed_by: null,
        status: "open",
        rooms_occupied: 0,
        rooms_available: 0,
        rooms_cleaning: 0,
        rooms_maintenance: 0,
        check_ins: 0,
        check_outs: 0,
        active_stays: 0,
        cash_total: 0,
        mobile_money_total: 0,
        card_total: 0,
        bank_transfer_total: 0,
        other_total: 0,
        gross_revenue: 0,
        refund_total: 0,
        net_revenue: 0,
        cash_expected: null,
        cash_counted: null,
        cash_variance: null,
        variance_notes: null,
        notes: null,
        reopened_at: null,
        reopened_by: null,
        reopen_reason: null,
        shift_handover_id: null,
      });

      await this.log(ctx, session, {
        action: `Opened business day ${businessDate}`,
        actionCode: ActivityActionCodes.NIGHT_AUDIT_CREATED,
        entityId: row.id,
        metadata: {
          night_audit_number: auditNumber,
          audit_date: businessDate,
        },
      });
    }

    const mapped = await this.mapRow(row);
    if (!mapped) {
      throw new ServiceError("Failed to load current audit.", "INTERNAL", 500);
    }
    return mapped;
  }

  async generateSnapshot(
    _ctx: ServiceContext,
    session: AuthSession,
    auditDate: string
  ): Promise<NightAuditSnapshot> {
    this.require(session, "view");
    return buildNightAuditSnapshot(auditDate, this.snapshotDeps());
  }

  async closeDay(
    ctx: ServiceContext,
    session: AuthSession,
    input: CloseNightAuditInput
  ): Promise<NightAudit> {
    this.require(session, "create");

    if (!Number.isFinite(input.cashCounted) || input.cashCounted < 0) {
      throw new ServiceError("Physical cash count is required.", "VALIDATION", 400);
    }

    const businessDate = getTodayDateString();
    const row = await this.nightAudits.getByDate(businessDate);
    if (!row) {
      throw new ServiceError("No open business day found.", "NOT_FOUND", 404);
    }
    if (row.status === "closed") {
      throw new ServiceError(
        "Night audit already completed for this business day.",
        "AUDIT_CLOSED",
        409
      );
    }

    const snapshot = await buildNightAuditSnapshot(businessDate, this.snapshotDeps());
    const closedAt = new Date().toISOString();
    const cashExpected = snapshot.cashTotal;
    const cashCounted = input.cashCounted;
    const cashVariance = computeCashVariance(cashExpected, cashCounted);
    const openShift = await this.shiftHandovers.getOpenShift();

    const updated = await this.nightAudits.update(row.id, {
      ...snapshotToDbFields(snapshot),
      status: "closed",
      closed_at: closedAt,
      closed_by: ctx.userId,
      notes: input.notes?.trim() || null,
      cash_expected: cashExpected,
      cash_counted: cashCounted,
      cash_variance: cashVariance,
      variance_notes: input.varianceNotes?.trim() || null,
      shift_handover_id: openShift?.id ?? null,
    });

    await this.log(ctx, session, {
      action: `Closed night audit ${updated.night_audit_number}`,
      actionCode: ActivityActionCodes.NIGHT_AUDIT_CLOSED,
      entityId: updated.id,
      metadata: {
        night_audit_number: updated.night_audit_number,
        audit_date: businessDate,
        gross_revenue: snapshot.grossRevenue,
        refund_total: snapshot.refundTotal,
        net_revenue: snapshot.netRevenue,
        closed_by: ctx.userId,
      },
    });

    await this.log(ctx, session, {
      action: `Cash variance recorded for ${updated.night_audit_number}`,
      actionCode: ActivityActionCodes.NIGHT_AUDIT_CASH_VARIANCE,
      entityId: updated.id,
      metadata: {
        night_audit_number: updated.night_audit_number,
        audit_date: businessDate,
        expected: cashExpected,
        counted: cashCounted,
        variance: cashVariance,
      },
    });

    const mapped = await this.mapRow(updated);
    if (!mapped) {
      throw new ServiceError("Failed to load closed audit.", "INTERNAL", 500);
    }
    return mapped;
  }

  async reopenDay(
    ctx: ServiceContext,
    session: AuthSession,
    auditNumber: string,
    reason: string
  ): Promise<NightAudit> {
    this.require(session, "manage");

    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      throw new ServiceError("Reopen reason is required.", "VALIDATION", 400);
    }

    const row = await this.nightAudits.getByNumber(auditNumber);
    if (!row) {
      throw new ServiceError("Night audit not found.", "NOT_FOUND", 404);
    }
    if (row.status !== "closed") {
      throw new ServiceError("Only closed audits can be reopened.", "VALIDATION", 400);
    }

    const updated = await this.nightAudits.update(row.id, {
      status: "open",
      closed_at: null,
      closed_by: null,
      reopened_at: new Date().toISOString(),
      reopened_by: ctx.userId,
      reopen_reason: trimmedReason,
    });

    await this.log(ctx, session, {
      action: `Reopened night audit ${row.night_audit_number}`,
      actionCode: ActivityActionCodes.NIGHT_AUDIT_REOPENED,
      entityId: updated.id,
      metadata: {
        night_audit_number: row.night_audit_number,
        audit_date: row.audit_date,
        reason: trimmedReason,
        reopened_by: ctx.userId,
      },
    });

    const mapped = await this.mapRow(updated);
    if (!mapped) {
      throw new ServiceError("Failed to load reopened audit.", "INTERNAL", 500);
    }
    return mapped;
  }

  async listAudits(ctx: ServiceContext, session: AuthSession): Promise<NightAudit[]> {
    this.require(session, "view");
    const rows = await this.nightAudits.listAll();
    const userNames = await this.resolveUserNames(
      rows.flatMap((r) => [r.opened_by, r.closed_by, r.reopened_by])
    );
    const shiftIds = [...new Set(rows.map((r) => r.shift_handover_id).filter(Boolean))] as string[];
    const shifts = new Map<string, Awaited<ReturnType<IShiftHandoverRepository["getById"]>>>();
    await Promise.all(
      shiftIds.map(async (id) => {
        const shift = await this.shiftHandovers.getById(id);
        if (shift) shifts.set(id, shift);
      })
    );
    return rows.map((row) =>
      mapDbNightAuditToNightAudit(
        row,
        userNames,
        row.shift_handover_id ? shifts.get(row.shift_handover_id) ?? null : null
      )
    );
  }

  async getAuditByNumber(
    _ctx: ServiceContext,
    session: AuthSession,
    auditNumber: string
  ): Promise<NightAudit | null> {
    this.require(session, "view");
    const row = await this.nightAudits.getByNumber(auditNumber);
    return this.mapRow(row);
  }

  async getAuditByDate(
    _ctx: ServiceContext,
    session: AuthSession,
    auditDate: string
  ): Promise<NightAudit | null> {
    this.require(session, "view");
    const row = await this.nightAudits.getByDate(auditDate);
    return this.mapRow(row);
  }
}
