import { computeCashVariance } from "@/lib/night-audit/cash-variance";
import {
  mapDbNightAuditRevisionToRevision,
  mapDbNightAuditToNightAudit,
  snapshotToDbFields,
} from "@/lib/night-audit/mapper";
import { buildNightAuditSnapshot } from "@/lib/night-audit/snapshot";
import { sessionHasPermission } from "@/lib/auth/permissions";
import type { IActivityLogRepository } from "@/repositories/activity-log.repository";
import type { IGuestFolioRepository } from "@/repositories/guest-folio.repository";
import type { INightAuditRepository } from "@/repositories/night-audit.repository";
import type { IPaymentRepository } from "@/repositories/payment.repository";
import type { IPosRepository } from "@/repositories/pos.repository";
import type { IReservationRepository } from "@/repositories/reservation.repository";
import type { IRoomRepository } from "@/repositories/room.repository";
import type { IShiftHandoverRepository } from "@/repositories/shift-handover.repository";
import type { IUserRepository } from "@/repositories/user.repository";
import type { AuthSession } from "@/services/auth.service";
import type { IBusinessDateService } from "@/services/business-date.service";
import type { OverstayService } from "@/services/overstay.service";
import { ServiceError } from "@/services/types";
import type { ServiceContext } from "@/services/types";
import { ActivityActionCodes } from "@/types/database/enums";
import type { DbNightAudit, DbNightAuditRevision } from "@/types/database";
import type {
  CloseNightAuditInput,
  NightAudit,
  NightAuditRevision,
  NightAuditSnapshot,
} from "@/types/night-audit";
import type { OverstayNightAuditWarning } from "@/types/overstay";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export type ResolveCurrentDayResult = {
  businessDate: string;
  currentAudit: NightAudit | null;
  blockedByOpenAudit: NightAudit | null;
};

export interface INightAuditService {
  resolveCurrentDay(
    ctx: ServiceContext,
    session: AuthSession
  ): Promise<ResolveCurrentDayResult>;
  getCurrentAudit(ctx: ServiceContext, session: AuthSession): Promise<NightAudit>;
  getOpenAudit(
    ctx: ServiceContext,
    session: AuthSession
  ): Promise<NightAudit | null>;
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
  listRevisions(
    ctx: ServiceContext,
    session: AuthSession,
    auditNumber: string
  ): Promise<NightAuditRevision[]>;
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
    private readonly pos: IPosRepository,
    private readonly users: IUserRepository,
    private readonly activityLogs: IActivityLogRepository,
    private readonly businessDates: IBusinessDateService,
    private readonly folios?: IGuestFolioRepository,
    private readonly overstays?: OverstayService
  ) {}

  async getOverstayWarning(
    businessDate: string
  ): Promise<OverstayNightAuditWarning | null> {
    if (!this.overstays) return null;
    return this.overstays.buildNightAuditWarning(businessDate);
  }

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
      pos: this.pos,
      folios: this.folios,
    };
  }

  private assertAuditDate(auditDate: string): void {
    if (!DATE_RE.test(auditDate)) {
      throw new ServiceError(
        "A valid audit date (YYYY-MM-DD) is required.",
        "VALIDATION",
        400
      );
    }
  }

  private async createTodayOpenRow(
    ctx: ServiceContext,
    session: AuthSession,
    businessDate: string
  ): Promise<DbNightAudit> {
    const openOther = await this.nightAudits.findOpen();
    if (openOther) {
      throw new ServiceError(
        `Cannot open ${businessDate}: night audit for ${openOther.audit_date} (${openOther.night_audit_number}) is still OPEN. Close that audit first.`,
        "AUDIT_OPEN_EXISTS",
        409
      );
    }

    const auditNumber = await this.nightAudits.getNextAuditNumber();
    const row = await this.nightAudits.create({
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
      vat_collected: 0,
      vat_exempt_revenue: 0,
      vat_override_count: 0,
      cash_expected: null,
      cash_counted: null,
      cash_variance: null,
      variance_notes: null,
      notes: null,
      reopened_at: null,
      reopened_by: null,
      reopen_reason: null,
      revision_number: 0,
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

    return row;
  }

  async resolveCurrentDay(
    ctx: ServiceContext,
    session: AuthSession
  ): Promise<ResolveCurrentDayResult> {
    this.require(session, "view");
    const businessDate = await this.businessDates.getCurrentBusinessDate();
    const todayRow = await this.nightAudits.getByDate(businessDate);

    if (todayRow) {
      const currentAudit = await this.mapRow(todayRow);
      if (!currentAudit) {
        throw new ServiceError("Failed to load current audit.", "INTERNAL", 500);
      }
      return { businessDate, currentAudit, blockedByOpenAudit: null };
    }

    const openRow = await this.nightAudits.findOpen();
    if (openRow) {
      const blockedByOpenAudit = await this.mapRow(openRow);
      if (!blockedByOpenAudit) {
        throw new ServiceError("Failed to load open audit.", "INTERNAL", 500);
      }
      return { businessDate, currentAudit: null, blockedByOpenAudit };
    }

    const created = await this.createTodayOpenRow(ctx, session, businessDate);
    const currentAudit = await this.mapRow(created);
    if (!currentAudit) {
      throw new ServiceError("Failed to load current audit.", "INTERNAL", 500);
    }
    return { businessDate, currentAudit, blockedByOpenAudit: null };
  }

  async getCurrentAudit(ctx: ServiceContext, session: AuthSession): Promise<NightAudit> {
    const resolved = await this.resolveCurrentDay(ctx, session);
    if (resolved.blockedByOpenAudit) {
      throw new ServiceError(
        `Cannot open ${resolved.businessDate}: night audit for ${resolved.blockedByOpenAudit.auditDate} (${resolved.blockedByOpenAudit.auditNumber}) is still OPEN. Close that audit first.`,
        "AUDIT_OPEN_EXISTS",
        409
      );
    }
    if (!resolved.currentAudit) {
      throw new ServiceError("Failed to load current audit.", "INTERNAL", 500);
    }
    return resolved.currentAudit;
  }

  async getOpenAudit(
    _ctx: ServiceContext,
    session: AuthSession
  ): Promise<NightAudit | null> {
    this.require(session, "view");
    const row = await this.nightAudits.findOpen();
    return this.mapRow(row);
  }

  async generateSnapshot(
    _ctx: ServiceContext,
    session: AuthSession,
    auditDate: string
  ): Promise<NightAuditSnapshot> {
    this.require(session, "view");
    this.assertAuditDate(auditDate);
    return buildNightAuditSnapshot(auditDate, this.snapshotDeps());
  }

  async closeDay(
    ctx: ServiceContext,
    session: AuthSession,
    input: CloseNightAuditInput
  ): Promise<NightAudit> {
    this.assertAuditDate(input.auditDate);

    if (!Number.isFinite(input.cashCounted) || input.cashCounted < 0) {
      throw new ServiceError("Physical cash count is required.", "VALIDATION", 400);
    }

    const currentBusinessDate = await this.businessDates.getCurrentBusinessDate();
    const isCurrentBusinessDay = input.auditDate === currentBusinessDate;
    if (isCurrentBusinessDay) {
      this.require(session, "create");
    } else {
      this.require(session, "manage");
    }

    if (this.overstays && isCurrentBusinessDay) {
      const warning = await this.overstays.buildNightAuditWarning(input.auditDate);
      const total =
        warning.activeOverstayCount + warning.projectedOverstayCount;
      if (total > 0) {
        if (warning.requiresManager) {
          if (!sessionHasPermission(session, "night_audit", "manage")) {
            throw new ServiceError(
              `${warning.message} Manager approval (night_audit.manage) is required to close.`,
              "FORBIDDEN",
              403
            );
          }
          if (!input.overstayAcknowledged) {
            throw new ServiceError(
              `${warning.message} Acknowledge overstays to continue.`,
              "VALIDATION",
              400
            );
          }
        } else if (warning.requiresAcknowledgement && !input.overstayAcknowledged) {
          throw new ServiceError(
            `${warning.message} Acknowledge overstays to continue.`,
            "VALIDATION",
            400
          );
        }
      }
    }

    const row = await this.nightAudits.getByDate(input.auditDate);
    if (!row) {
      throw new ServiceError(
        `No night audit found for ${input.auditDate}.`,
        "NOT_FOUND",
        404
      );
    }
    if (row.status === "closed") {
      throw new ServiceError(
        "Night audit already completed for this business day.",
        "AUDIT_CLOSED",
        409
      );
    }

    const openOther = await this.nightAudits.findOpen();
    if (openOther && openOther.id !== row.id) {
      throw new ServiceError(
        `Another night audit is OPEN (${openOther.audit_date} / ${openOther.night_audit_number}). Only one OPEN audit is allowed.`,
        "AUDIT_OPEN_EXISTS",
        409
      );
    }

    const previousRevision = row.revision_number ?? 0;
    const isReclose = previousRevision > 0;
    const nextRevision = previousRevision + 1;

    const snapshot = await buildNightAuditSnapshot(input.auditDate, this.snapshotDeps());
    const closedAt = new Date().toISOString();
    const cashExpected = snapshot.cashTotal;
    const cashCounted = input.cashCounted;
    const cashVariance = computeCashVariance(cashExpected, cashCounted);
    const openShift = await this.shiftHandovers.getOpenShift();
    const snapshotFields = snapshotToDbFields(snapshot);
    const notes = input.notes?.trim() || null;
    const varianceNotes = input.varianceNotes?.trim() || null;

    const updated = await this.nightAudits.update(row.id, {
      ...snapshotFields,
      status: "closed",
      closed_at: closedAt,
      closed_by: ctx.userId,
      notes,
      cash_expected: cashExpected,
      cash_counted: cashCounted,
      cash_variance: cashVariance,
      variance_notes: varianceNotes,
      revision_number: nextRevision,
      shift_handover_id: openShift?.id ?? null,
    });

    await this.nightAudits.createRevision({
      night_audit_id: updated.id,
      revision_number: nextRevision,
      event_type: isReclose ? "reclosed" : "closed",
      closed_by: ctx.userId,
      closed_at: closedAt,
      reopened_by: null,
      reopened_at: null,
      reopen_reason: null,
      rooms_occupied: snapshotFields.rooms_occupied,
      rooms_available: snapshotFields.rooms_available,
      rooms_cleaning: snapshotFields.rooms_cleaning,
      rooms_maintenance: snapshotFields.rooms_maintenance,
      check_ins: snapshotFields.check_ins,
      check_outs: snapshotFields.check_outs,
      active_stays: snapshotFields.active_stays,
      cash_total: snapshotFields.cash_total,
      mobile_money_total: snapshotFields.mobile_money_total,
      card_total: snapshotFields.card_total,
      bank_transfer_total: snapshotFields.bank_transfer_total,
      other_total: snapshotFields.other_total,
      gross_revenue: snapshotFields.gross_revenue,
      refund_total: snapshotFields.refund_total,
      net_revenue: snapshotFields.net_revenue,
      vat_collected: snapshotFields.vat_collected,
      vat_exempt_revenue: snapshotFields.vat_exempt_revenue,
      vat_override_count: snapshotFields.vat_override_count,
      cash_expected: cashExpected,
      cash_counted: cashCounted,
      cash_variance: cashVariance,
      variance_notes: varianceNotes,
      notes,
    });

    await this.log(ctx, session, {
      action: isReclose
        ? `Re-closed night audit ${updated.night_audit_number} (revision ${nextRevision})`
        : `Closed night audit ${updated.night_audit_number}`,
      actionCode: isReclose
        ? ActivityActionCodes.NIGHT_AUDIT_RECLOSED
        : ActivityActionCodes.NIGHT_AUDIT_CLOSED,
      entityId: updated.id,
      metadata: {
        night_audit_number: updated.night_audit_number,
        audit_date: input.auditDate,
        revision_number: nextRevision,
        is_reclose: isReclose,
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
        audit_date: input.auditDate,
        revision_number: nextRevision,
        expected: cashExpected,
        counted: cashCounted,
        variance: cashVariance,
      },
    });

    if (isCurrentBusinessDay) {
      await this.businessDates.advanceAfterNightAudit(ctx, session, {
        closedBusinessDate: input.auditDate,
        nightAuditId: updated.id,
      });

      if (this.overstays) {
        const nextBusinessDate =
          await this.businessDates.getCurrentBusinessDate();
        await this.overstays.processBusinessDateCharges(
          ctx,
          session,
          nextBusinessDate
        );
      }
    }

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

    const openOther = await this.nightAudits.findOpen();
    if (openOther) {
      throw new ServiceError(
        `Cannot reopen ${row.audit_date}: night audit for ${openOther.audit_date} (${openOther.night_audit_number}) is already OPEN. Close that audit first.`,
        "AUDIT_OPEN_EXISTS",
        409
      );
    }

    const reopenedAt = new Date().toISOString();
    const revisionNumber = row.revision_number ?? 0;

    const updated = await this.nightAudits.update(row.id, {
      status: "open",
      closed_at: null,
      closed_by: null,
      reopened_at: reopenedAt,
      reopened_by: ctx.userId,
      reopen_reason: trimmedReason,
    });

    await this.nightAudits.createRevision({
      night_audit_id: updated.id,
      revision_number: revisionNumber,
      event_type: "reopened",
      closed_by: null,
      closed_at: null,
      reopened_by: ctx.userId,
      reopened_at: reopenedAt,
      reopen_reason: trimmedReason,
      rooms_occupied: null,
      rooms_available: null,
      rooms_cleaning: null,
      rooms_maintenance: null,
      check_ins: null,
      check_outs: null,
      active_stays: null,
      cash_total: null,
      mobile_money_total: null,
      card_total: null,
      bank_transfer_total: null,
      other_total: null,
      gross_revenue: null,
      refund_total: null,
      net_revenue: null,
      vat_collected: null,
      vat_exempt_revenue: null,
      vat_override_count: null,
      cash_expected: null,
      cash_counted: null,
      cash_variance: null,
      variance_notes: null,
      notes: null,
    } satisfies Omit<DbNightAuditRevision, "id" | "created_at">);

    await this.log(ctx, session, {
      action: `Reopened night audit ${row.night_audit_number}`,
      actionCode: ActivityActionCodes.NIGHT_AUDIT_REOPENED,
      entityId: updated.id,
      metadata: {
        night_audit_number: row.night_audit_number,
        audit_date: row.audit_date,
        revision_number: revisionNumber,
        reason: trimmedReason,
        reopened_by: ctx.userId,
      },
    });

    await this.businessDates.reopenBusinessDate(ctx, session, {
      auditDate: row.audit_date,
      nightAuditId: updated.id,
      reason: trimmedReason,
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

  async listRevisions(
    _ctx: ServiceContext,
    session: AuthSession,
    auditNumber: string
  ): Promise<NightAuditRevision[]> {
    this.require(session, "view");
    if (session.roleId !== "admin" && !sessionHasPermission(session, "night_audit", "manage")) {
      throw new ServiceError(
        "Forbidden: only administrators can view night audit revisions.",
        "FORBIDDEN",
        403
      );
    }

    const audit = await this.nightAudits.getByNumber(auditNumber);
    if (!audit) {
      throw new ServiceError("Night audit not found.", "NOT_FOUND", 404);
    }

    const rows = await this.nightAudits.listRevisions(audit.id);
    const userNames = await this.resolveUserNames(
      rows.flatMap((r) => [r.closed_by, r.reopened_by])
    );
    return rows.map((row) => mapDbNightAuditRevisionToRevision(row, userNames));
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
    this.assertAuditDate(auditDate);
    const row = await this.nightAudits.getByDate(auditDate);
    return this.mapRow(row);
  }
}
