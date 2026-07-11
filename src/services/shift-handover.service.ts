import {
  mapDbShiftHandoverIssueToShiftHandoverIssue,
  mapDbShiftHandoverTaskToShiftHandoverTask,
  mapDbShiftHandoverToShiftHandover,
  parseMultilineItems,
} from "@/lib/shift-handover/mapper";
import { createOperationalNotification } from "@/lib/notifications/operational-notifications";
import { sessionHasPermission } from "@/lib/auth/permissions";
import type { IActivityLogRepository } from "@/repositories/activity-log.repository";
import type { INotificationRepository } from "@/repositories/notification.repository";
import type {
  IShiftHandoverIssueRepository,
  IShiftHandoverRepository,
  IShiftHandoverTaskRepository,
} from "@/repositories/shift-handover.repository";
import type { IUserRepository } from "@/repositories/user.repository";
import type { AuthSession } from "@/services/auth.service";
import { ServiceError } from "@/services/types";
import type { ServiceContext } from "@/services/types";
import { ActivityActionCodes } from "@/types/database/enums";
import type {
  CloseShiftInput,
  HandoverPackage,
  OpenShiftInput,
  ShiftHandover,
  ShiftHandoverIssue,
  ShiftHandoverPageData,
  ShiftHandoverTask,
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
  acknowledgeHandover(
    ctx: ServiceContext,
    session: AuthSession,
    handoverId: string
  ): Promise<ShiftHandover>;
  completeTask(
    ctx: ServiceContext,
    session: AuthSession,
    taskId: string
  ): Promise<ShiftHandoverTask>;
  resolveIssue(
    ctx: ServiceContext,
    session: AuthSession,
    issueId: string
  ): Promise<ShiftHandoverIssue>;
  getCurrentShift(ctx: ServiceContext, session: AuthSession): Promise<ShiftHandover | null>;
  listHandovers(ctx: ServiceContext, session: AuthSession): Promise<ShiftHandover[]>;
  getByNumber(
    ctx: ServiceContext,
    session: AuthSession,
    handoverNumber: string
  ): Promise<ShiftHandover | null>;
  getHandoverPackage(
    ctx: ServiceContext,
    session: AuthSession,
    handoverNumber: string
  ): Promise<HandoverPackage | null>;
  loadPageData(
    ctx: ServiceContext,
    session: AuthSession
  ): Promise<ShiftHandoverPageData>;
  getAttentionCount(ctx: ServiceContext, session: AuthSession): Promise<number>;
}

export class ShiftHandoverService implements IShiftHandoverService {
  constructor(
    private readonly handovers: IShiftHandoverRepository,
    private readonly tasks: IShiftHandoverTaskRepository,
    private readonly issues: IShiftHandoverIssueRepository,
    private readonly users: IUserRepository,
    private readonly activityLogs: IActivityLogRepository,
    private readonly notifications: INotificationRepository
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

  private async mapRow(
    row: Awaited<ReturnType<IShiftHandoverRepository["getById"]>>,
    counts?: { tasksCompleted?: number; issuesResolved?: number }
  ) {
    if (!row) return null;
    const userNames = await this.resolveUserNames([
      row.opened_by,
      row.closed_by,
      row.acknowledged_by,
    ]);
    return mapDbShiftHandoverToShiftHandover(row, userNames, counts);
  }

  private async mapRows(rows: Awaited<ReturnType<IShiftHandoverRepository["listAll"]>>) {
    const userNames = await this.resolveUserNames(
      rows.flatMap((r) => [r.opened_by, r.closed_by, r.acknowledged_by])
    );
    return Promise.all(
      rows.map(async (row) => {
        const [tasksCompleted, issuesResolved] = await Promise.all([
          this.tasks.countCompletedDuringShift(row.id),
          this.issues.countResolvedDuringShift(row.id),
        ]);
        return mapDbShiftHandoverToShiftHandover(row, userNames, {
          tasksCompleted,
          issuesResolved,
        });
      })
    );
  }

  private async mapTaskRows(rows: Awaited<ReturnType<IShiftHandoverTaskRepository["listPending"]>>) {
    const userNames = await this.resolveUserNames(
      rows.flatMap((r) => [r.created_by, r.completed_by])
    );
    return rows.map((row) => mapDbShiftHandoverTaskToShiftHandoverTask(row, userNames));
  }

  private async mapIssueRows(rows: Awaited<ReturnType<IShiftHandoverIssueRepository["listOpen"]>>) {
    const userNames = await this.resolveUserNames(
      rows.flatMap((r) => [r.created_by, r.resolved_by])
    );
    return rows.map((row) => mapDbShiftHandoverIssueToShiftHandoverIssue(row, userNames));
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

  private async createStructuredItems(
    shiftId: string,
    ctx: ServiceContext,
    taskItems: string[],
    issueItems: string[]
  ): Promise<void> {
    await Promise.all([
      ...taskItems.map((description) =>
        this.tasks.create({
          description,
          status: "pending",
          shift_handover_id: shiftId,
          origin_shift_handover_id: shiftId,
          created_by: ctx.userId,
          completed_by: null,
          completed_at: null,
          completed_during_shift_id: null,
        })
      ),
      ...issueItems.map((description) =>
        this.issues.create({
          description,
          status: "open",
          origin_shift_handover_id: shiftId,
          created_by: ctx.userId,
          resolved_by: null,
          resolved_at: null,
          resolved_during_shift_id: null,
        })
      ),
    ]);
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

    const taskItems = [
      ...(input.taskItems ?? []),
      ...parseMultilineItems(input.pendingTasks),
    ];
    const issueItems = [
      ...(input.issueItems ?? []),
      ...parseMultilineItems(input.outstandingIssues),
    ];

    const handoverNumber = await this.handovers.getNextHandoverNumber();
    const row = await this.handovers.create({
      handover_number: handoverNumber,
      shift_type: input.shiftType,
      opened_by: ctx.userId,
      closed_by: null,
      acknowledged_by: null,
      opened_at: new Date().toISOString(),
      closed_at: null,
      acknowledged_at: null,
      cash_drawer_amount: input.cashDrawerAmount,
      closing_cash: null,
      notes: input.notes?.trim() || null,
      closing_notes: null,
      pending_tasks: taskItems.length > 0 ? taskItems.join("\n") : null,
      outstanding_issues: issueItems.length > 0 ? issueItems.join("\n") : null,
      status: "open",
    });

    if (taskItems.length > 0 || issueItems.length > 0) {
      await this.createStructuredItems(row.id, ctx, taskItems, issueItems);
    }

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

    const [pendingTaskRows, openIssueRows] = await Promise.all([
      this.tasks.listPending(),
      this.issues.listOpen(),
    ]);

    const pendingSnapshot =
      pendingTaskRows.map((t) => t.description).join("\n") ||
      input.pendingTasks?.trim() ||
      row.pending_tasks;
    const issuesSnapshot =
      openIssueRows.map((i) => i.description).join("\n") ||
      input.outstandingIssues?.trim() ||
      row.outstanding_issues;

    const updated = await this.handovers.update(row.id, {
      status: "closed",
      closed_at: new Date().toISOString(),
      closed_by: ctx.userId,
      closing_cash: input.closingCash,
      closing_notes: input.closingNotes?.trim() || null,
      pending_tasks: pendingSnapshot,
      outstanding_issues: issuesSnapshot,
    });

    await this.log(ctx, session, {
      action: `Closed ${row.shift_type} shift ${row.handover_number}`,
      actionCode: ActivityActionCodes.SHIFT_CLOSED,
      entityId: updated.id,
      metadata: {
        shift_type: row.shift_type,
        cash_drawer: Number(row.cash_drawer_amount),
        closing_cash: input.closingCash,
        cash_variance: Number((input.closingCash - Number(row.cash_drawer_amount)).toFixed(2)),
        opened_by: row.opened_by,
        closed_by: ctx.userId,
        handover_number: row.handover_number,
        pending_tasks_count: pendingTaskRows.length,
        open_issues_count: openIssueRows.length,
      },
    });

    const mapped = await this.mapRow(updated);
    if (!mapped) {
      throw new ServiceError("Failed to load closed shift.", "INTERNAL", 500);
    }

    if (pendingTaskRows.length > 0 || openIssueRows.length > 0) {
      await createOperationalNotification(this.notifications, {
        title: "Shift Handover Requires Review",
        message: `${mapped.shiftType} shift ${mapped.handoverNumber} closed with ${pendingTaskRows.length} pending task(s) and ${openIssueRows.length} open issue(s).`,
        type: "shift_handover_alert",
        module: "shift_handover",
        entityType: "shift_handover",
        entityId: mapped.id,
        priority: "high",
        metadata: {
          handover_number: mapped.handoverNumber,
          pending_tasks: pendingTaskRows.length,
          open_issues: openIssueRows.length,
        },
      });
    } else {
      await createOperationalNotification(this.notifications, {
        title: "Shift Handover Pending Acknowledgement",
        message: `${mapped.shiftType} shift ${mapped.handoverNumber} was closed and awaits acknowledgement.`,
        type: "shift_handover_alert",
        module: "shift_handover",
        entityType: "shift_handover",
        entityId: mapped.id,
        priority: "medium",
        metadata: { handover_number: mapped.handoverNumber },
      });
    }

    return mapped;
  }

  async acknowledgeHandover(
    ctx: ServiceContext,
    session: AuthSession,
    handoverId: string
  ): Promise<ShiftHandover> {
    this.require(session, "view");

    const row = await this.handovers.getById(handoverId);
    if (!row) {
      throw new ServiceError("Shift handover not found.", "NOT_FOUND", 404);
    }
    if (row.status !== "closed") {
      throw new ServiceError("Only closed shifts can be acknowledged.", "VALIDATION", 400);
    }
    if (row.acknowledged_at) {
      throw new ServiceError("This shift has already been acknowledged.", "VALIDATION", 400);
    }

    const updated = await this.handovers.update(handoverId, {
      acknowledged_by: ctx.userId,
      acknowledged_at: new Date().toISOString(),
    });

    await this.log(ctx, session, {
      action: `Acknowledged shift ${row.handover_number}`,
      actionCode: ActivityActionCodes.SHIFT_ACKNOWLEDGED,
      entityId: updated.id,
      metadata: {
        handover_number: row.handover_number,
        acknowledged_by: ctx.userId,
        closed_by: row.closed_by,
      },
    });

    const mapped = await this.mapRow(updated);
    if (!mapped) {
      throw new ServiceError("Failed to load acknowledged shift.", "INTERNAL", 500);
    }
    return mapped;
  }

  async completeTask(
    ctx: ServiceContext,
    session: AuthSession,
    taskId: string
  ): Promise<ShiftHandoverTask> {
    this.require(session, "edit");

    const openShift = await this.handovers.getOpenShift();
    const pending = await this.tasks.listPending();
    const task = pending.find((t) => t.id === taskId);
    if (!task) {
      throw new ServiceError("Pending task not found.", "NOT_FOUND", 404);
    }

    const updated = await this.tasks.complete(
      taskId,
      ctx.userId,
      openShift?.id ?? null
    );

    await this.log(ctx, session, {
      action: `Completed shift task: ${task.description}`,
      actionCode: ActivityActionCodes.SHIFT_TASK_COMPLETED,
      entityId: openShift?.id ?? task.origin_shift_handover_id,
      metadata: {
        task_id: taskId,
        completed_by: ctx.userId,
        description: task.description,
      },
    });

    const userNames = await this.resolveUserNames([updated.created_by, updated.completed_by]);
    return mapDbShiftHandoverTaskToShiftHandoverTask(updated, userNames);
  }

  async resolveIssue(
    ctx: ServiceContext,
    session: AuthSession,
    issueId: string
  ): Promise<ShiftHandoverIssue> {
    this.require(session, "edit");

    const openShift = await this.handovers.getOpenShift();
    const openIssues = await this.issues.listOpen();
    const issue = openIssues.find((i) => i.id === issueId);
    if (!issue) {
      throw new ServiceError("Open issue not found.", "NOT_FOUND", 404);
    }

    const updated = await this.issues.resolve(
      issueId,
      ctx.userId,
      openShift?.id ?? null
    );

    await this.log(ctx, session, {
      action: `Resolved shift issue: ${issue.description}`,
      actionCode: ActivityActionCodes.SHIFT_ISSUE_RESOLVED,
      entityId: openShift?.id ?? issue.origin_shift_handover_id,
      metadata: {
        issue_id: issueId,
        resolved_by: ctx.userId,
        description: issue.description,
      },
    });

    const userNames = await this.resolveUserNames([updated.created_by, updated.resolved_by]);
    return mapDbShiftHandoverIssueToShiftHandoverIssue(updated, userNames);
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
    return this.mapRows(rows);
  }

  async getByNumber(
    _ctx: ServiceContext,
    session: AuthSession,
    handoverNumber: string
  ): Promise<ShiftHandover | null> {
    this.require(session, "view");
    const row = await this.handovers.getByNumber(handoverNumber);
    if (!row) return null;
    const [tasksCompleted, issuesResolved] = await Promise.all([
      this.tasks.countCompletedDuringShift(row.id),
      this.issues.countResolvedDuringShift(row.id),
    ]);
    return this.mapRow(row, { tasksCompleted, issuesResolved });
  }

  async getHandoverPackage(
    _ctx: ServiceContext,
    session: AuthSession,
    handoverNumber: string
  ): Promise<HandoverPackage | null> {
    this.require(session, "view");
    const row = await this.handovers.getByNumber(handoverNumber);
    if (!row) return null;

    const [shift, pendingTasks, openIssues] = await Promise.all([
      this.mapRow(row),
      this.mapTaskRows(await this.tasks.listPending()),
      this.mapIssueRows(await this.issues.listOpen()),
    ]);

    if (!shift) return null;
    return { shift, pendingTasks, openIssues };
  }

  async getAttentionCount(_ctx: ServiceContext, session: AuthSession): Promise<number> {
    this.require(session, "view");
    const [pendingAck, pendingTasks, openIssues] = await Promise.all([
      this.handovers.getPendingAcknowledgement(),
      this.tasks.listPending(),
      this.issues.listOpen(),
    ]);
    let count = pendingTasks.length + openIssues.length;
    if (pendingAck) count += 1;
    return count;
  }

  async loadPageData(
    ctx: ServiceContext,
    session: AuthSession
  ): Promise<ShiftHandoverPageData> {
    this.require(session, "view");

    const [
      currentShift,
      history,
      pendingTasks,
      openIssues,
      recentlyClosedRow,
      pendingAckRow,
    ] = await Promise.all([
      this.getCurrentShift(ctx, session),
      this.listHandovers(ctx, session),
      this.mapTaskRows(await this.tasks.listPending()),
      this.mapIssueRows(await this.issues.listOpen()),
      this.handovers.getLatestClosed(),
      this.handovers.getPendingAcknowledgement(),
    ]);

    const recentlyClosed = recentlyClosedRow
      ? await this.mapRow(recentlyClosedRow, {
          tasksCompleted: await this.tasks.countCompletedDuringShift(recentlyClosedRow.id),
          issuesResolved: await this.issues.countResolvedDuringShift(recentlyClosedRow.id),
        })
      : null;

    const pendingAcknowledgement = pendingAckRow
      ? await this.mapRow(pendingAckRow)
      : null;

    let attentionCount = pendingTasks.length + openIssues.length;
    if (pendingAcknowledgement) attentionCount += 1;

    return {
      currentShift,
      history,
      pendingTasks,
      openIssues,
      recentlyClosed,
      pendingAcknowledgement,
      pendingAckTasks: pendingTasks,
      pendingAckIssues: openIssues,
      attentionCount,
    };
  }
}
