import { mapDbShiftHandoverToShiftHandover } from "@/lib/shift-handover/mapper";
import { sessionHasPermission } from "@/lib/auth/permissions";
import type { IActivityLogRepository } from "@/repositories/activity-log.repository";
import type { IShiftHandoverRepository } from "@/repositories/shift-handover.repository";
import type { IUserRepository } from "@/repositories/user.repository";
import type { AuthSession } from "@/services/auth.service";
import { ServiceError } from "@/services/types";
import type { ServiceContext } from "@/services/types";
import { ActivityActionCodes } from "@/types/database/enums";
import type {
  CloseShiftInput,
  OpenShiftInput,
  ShiftHandover,
} from "@/types/shift-handover";

export interface IShiftHandoverService {
  openShift(
    ctx: ServiceContext,
    session: AuthSession,
    input: OpenShiftInput
  ): Promise<ShiftHandover>;
  closeShift(
    ctx: ServiceContext,
    session: AuthSession,
    input: CloseShiftInput
  ): Promise<ShiftHandover>;
  getCurrentShift(ctx: ServiceContext, session: AuthSession): Promise<ShiftHandover | null>;
  listHandovers(ctx: ServiceContext, session: AuthSession): Promise<ShiftHandover[]>;
  getByNumber(
    ctx: ServiceContext,
    session: AuthSession,
    handoverNumber: string
  ): Promise<ShiftHandover | null>;
}

export class ShiftHandoverService implements IShiftHandoverService {
  constructor(
    private readonly handovers: IShiftHandoverRepository,
    private readonly users: IUserRepository,
    private readonly activityLogs: IActivityLogRepository
  ) {}

  private require(
    session: AuthSession,
    action: "view" | "create" | "edit" | "delete" | "manage"
  ): void {
    if (!sessionHasPermission(session, "shift_handover", action)) {
      throw new ServiceError(
        `Forbidden: missing permission shift_handover.${action}`,
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

  private async mapRow(row: Awaited<ReturnType<IShiftHandoverRepository["getById"]>>) {
    if (!row) return null;
    const userNames = await this.resolveUserNames([row.opened_by, row.closed_by]);
    return mapDbShiftHandoverToShiftHandover(row, userNames);
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
      module: "shift_handover",
      entityType: "shift_handover",
      entityId: input.entityId,
      metadata: input.metadata,
    });
  }

  async openShift(
    ctx: ServiceContext,
    session: AuthSession,
    input: OpenShiftInput
  ): Promise<ShiftHandover> {
    this.require(session, "create");

    const existing = await this.handovers.getOpenShift();
    if (existing) {
      throw new ServiceError(
        "A shift is already open. Close it before opening a new one.",
        "SHIFT_OPEN",
        409
      );
    }

    const handoverNumber = await this.handovers.getNextHandoverNumber();
    const row = await this.handovers.create({
      handover_number: handoverNumber,
      shift_type: input.shiftType,
      opened_by: ctx.userId,
      closed_by: null,
      opened_at: new Date().toISOString(),
      closed_at: null,
      cash_drawer_amount: input.cashDrawerAmount,
      closing_cash: null,
      notes: input.notes?.trim() || null,
      pending_tasks: input.pendingTasks?.trim() || null,
      outstanding_issues: input.outstandingIssues?.trim() || null,
      status: "open",
    });

    await this.log(ctx, session, {
      action: `Opened ${input.shiftType} shift ${handoverNumber}`,
      actionCode: ActivityActionCodes.SHIFT_OPENED,
      entityId: row.id,
      metadata: {
        shift_type: input.shiftType,
        cash_drawer: input.cashDrawerAmount,
        opened_by: ctx.userId,
        handover_number: handoverNumber,
      },
    });

    const mapped = await this.mapRow(row);
    if (!mapped) {
      throw new ServiceError("Failed to load opened shift.", "INTERNAL", 500);
    }
    return mapped;
  }

  async closeShift(
    ctx: ServiceContext,
    session: AuthSession,
    input: CloseShiftInput
  ): Promise<ShiftHandover> {
    this.require(session, "edit");

    if (!Number.isFinite(input.closingCash) || input.closingCash < 0) {
      throw new ServiceError("Closing cash amount is required.", "VALIDATION", 400);
    }

    const row = await this.handovers.getOpenShift();
    if (!row) {
      throw new ServiceError("No open shift to close.", "NOT_FOUND", 404);
    }

    const updated = await this.handovers.update(row.id, {
      status: "closed",
      closed_at: new Date().toISOString(),
      closed_by: ctx.userId,
      closing_cash: input.closingCash,
      notes: input.notes?.trim() ?? row.notes,
      outstanding_issues: input.outstandingIssues?.trim() ?? row.outstanding_issues,
    });

    await this.log(ctx, session, {
      action: `Closed ${row.shift_type} shift ${row.handover_number}`,
      actionCode: ActivityActionCodes.SHIFT_CLOSED,
      entityId: updated.id,
      metadata: {
        shift_type: row.shift_type,
        cash_drawer: Number(row.cash_drawer_amount),
        closing_cash: input.closingCash,
        opened_by: row.opened_by,
        closed_by: ctx.userId,
        handover_number: row.handover_number,
      },
    });

    const mapped = await this.mapRow(updated);
    if (!mapped) {
      throw new ServiceError("Failed to load closed shift.", "INTERNAL", 500);
    }
    return mapped;
  }

  async getCurrentShift(
    _ctx: ServiceContext,
    session: AuthSession
  ): Promise<ShiftHandover | null> {
    this.require(session, "view");
    const row = await this.handovers.getOpenShift();
    return this.mapRow(row);
  }

  async listHandovers(ctx: ServiceContext, session: AuthSession): Promise<ShiftHandover[]> {
    this.require(session, "view");
    const rows = await this.handovers.listAll();
    const userNames = await this.resolveUserNames(
      rows.flatMap((r) => [r.opened_by, r.closed_by])
    );
    return rows.map((row) => mapDbShiftHandoverToShiftHandover(row, userNames));
  }

  async getByNumber(
    _ctx: ServiceContext,
    session: AuthSession,
    handoverNumber: string
  ): Promise<ShiftHandover | null> {
    this.require(session, "view");
    const row = await this.handovers.getByNumber(handoverNumber);
    return this.mapRow(row);
  }
}
