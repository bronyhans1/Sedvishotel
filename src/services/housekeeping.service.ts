import { getHousekeepingAccess } from "@/lib/auth/housekeeping-access";
import { getCurrentBusinessDate } from "@/lib/dates/business-date";
import { getCurrentTimeString } from "@/lib/dates/time";
import { assembleHousekeepingBoard } from "@/lib/housekeeping/assemble-board";
import { mapRoomToHousekeepingTask } from "@/lib/housekeeping/mapper";
import { loadCheckoutPolicy } from "@/lib/settings/checkout-policy";
import type { IActivityLogRepository } from "@/repositories/activity-log.repository";
import type { IHousekeepingRepository } from "@/repositories/housekeeping.repository";
import type { INotificationRepository } from "@/repositories/notification.repository";
import type { IReservationRepository } from "@/repositories/reservation.repository";
import type { IRoomRepository } from "@/repositories/room.repository";
import type { AuthSession } from "@/services/auth.service";
import { ServiceError } from "@/services/types";
import type { ServiceContext } from "@/services/types";
import { ActivityActionCodes } from "@/types/database/enums";
import { notifyHousekeepingAlert } from "@/lib/notifications/operational-notifications";
import type { DbHousekeepingTask, DbRoomStatus, DbRoomWithType } from "@/types/database";
import type { HousekeepingStats, HousekeepingTask } from "@/types/housekeeping";

const BOARD_ROOM_STATUSES: DbRoomStatus[] = [
  "cleaning",
  "available",
  "maintenance",
];

export interface IHousekeepingService {
  listTasks(
    ctx: ServiceContext,
    session: AuthSession
  ): Promise<{
    tasks: HousekeepingTask[];
    stats: HousekeepingStats;
    departureWatch: HousekeepingTask[];
  }>;
  markCleaningStarted(
    ctx: ServiceContext,
    session: AuthSession,
    roomId: string
  ): Promise<HousekeepingTask>;
  markCleaningCompleted(
    ctx: ServiceContext,
    session: AuthSession,
    roomId: string
  ): Promise<HousekeepingTask>;
  markRoomReady(
    ctx: ServiceContext,
    session: AuthSession,
    roomId: string
  ): Promise<HousekeepingTask>;
  markMaintenance(
    ctx: ServiceContext,
    session: AuthSession,
    roomId: string
  ): Promise<HousekeepingTask>;
}

export class HousekeepingService implements IHousekeepingService {
  constructor(
    private readonly rooms: IRoomRepository,
    private readonly reservations: IReservationRepository,
    private readonly housekeeping: IHousekeepingRepository,
    private readonly activityLogs: IActivityLogRepository,
    private readonly notifications?: INotificationRepository
  ) {}

  private requireView(session: AuthSession): void {
    if (!getHousekeepingAccess(session).canView) {
      throw new ServiceError(
        "Forbidden: housekeeping.view required.",
        "FORBIDDEN",
        403
      );
    }
  }

  private requireManage(session: AuthSession): void {
    if (!getHousekeepingAccess(session).canManage) {
      throw new ServiceError(
        "Forbidden: housekeeping.edit or manage required.",
        "FORBIDDEN",
        403
      );
    }
  }

  private async log(
    ctx: ServiceContext,
    session: AuthSession,
    input: {
      action: string;
      actionCode: string;
      roomId: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<void> {
    await this.activityLogs.create({
      userId: ctx.userId,
      userName: session.fullName,
      action: input.action,
      actionCode: input.actionCode,
      module: "housekeeping",
      entityType: "room",
      entityId: input.roomId,
      metadata: input.metadata,
    });
  }

  private async resolveRoom(roomId: string) {
    const room = await this.rooms.getById(roomId);
    if (!room) {
      throw new ServiceError("Room not found.", "NOT_FOUND", 404);
    }
    return room;
  }

  private async getLastCheckout(roomId: string) {
    const [checkout] = await this.reservations.listLatestCheckoutsForHousekeeping([
      roomId,
    ]);
    if (!checkout) return { guestName: null, checkoutAt: null };
    return {
      guestName: checkout.guestName,
      checkoutAt: checkout.checkoutAt,
    };
  }

  private mapTaskFromKnownState(
    room: DbRoomWithType,
    roomStatus: DbRoomStatus,
    task: DbHousekeepingTask | null,
    lastGuestName?: string | null,
    lastCheckoutAt?: string | null
  ): HousekeepingTask {
    const mapped = mapRoomToHousekeepingTask(
      { ...room, status: roomStatus },
      task,
      lastGuestName,
      lastCheckoutAt
    );
    if (!mapped) {
      throw new ServiceError(
        "Room is not on the housekeeping board.",
        "VALIDATION",
        400
      );
    }
    return mapped;
  }

  private async ensureTask(
    roomId: string,
    status: DbRoomStatus,
    defaults: {
      lastGuestName?: string | null;
      lastCheckoutAt?: string | null;
    } = {}
  ) {
    const existing = await this.housekeeping.findByRoomId(roomId);
    if (existing) return existing;

    return this.housekeeping.create({
      room_id: roomId,
      status:
        status === "cleaning"
          ? "pending_cleaning"
          : status === "maintenance"
            ? "maintenance"
            : "ready",
      assigned_staff_id: null,
      notes: null,
      last_guest_name: defaults.lastGuestName ?? null,
      last_checkout_at: defaults.lastCheckoutAt ?? null,
      expected_completion: null,
      started_at: null,
      completed_at: null,
      created_by: null,
    });
  }

  private async changeRoomStatus(
    ctx: ServiceContext,
    session: AuthSession,
    room: DbRoomWithType,
    next: DbRoomStatus,
    actionCode: string,
    action: string
  ): Promise<DbRoomWithType> {
    const previous = room.status;
    if (previous === next) return room;

    await this.rooms.changeStatus(room.id, next);
    await this.log(ctx, session, {
      action: `${action} — Room ${room.room_number}`,
      actionCode,
      roomId: room.id,
      metadata: { previous_status: previous, new_status: next },
    });
    return { ...room, status: next };
  }

  async listTasks(
    _ctx: ServiceContext,
    session: AuthSession
  ): Promise<{
    tasks: HousekeepingTask[];
    stats: HousekeepingStats;
    departureWatch: HousekeepingTask[];
  }> {
    this.requireView(session);

    const [rooms, businessDate, policy, checkedInRows] = await Promise.all([
      this.rooms.getAll(false),
      getCurrentBusinessDate(),
      loadCheckoutPolicy(),
      this.reservations.listCheckedInForHousekeeping(),
    ]);
    const currentTime = getCurrentTimeString();

    const boardRooms = rooms
      .filter((room) => BOARD_ROOM_STATUSES.includes(room.status))
      .slice()
      .sort((a, b) => a.room_number.localeCompare(b.room_number));

    const boardRoomIds = boardRooms.map((room) => room.id);

    const [hkTasks, checkouts] = await Promise.all([
      this.housekeeping.findLatestByRoomIds(boardRoomIds),
      this.reservations.listLatestCheckoutsForHousekeeping(boardRoomIds),
    ]);

    return assembleHousekeepingBoard({
      rooms,
      boardRooms,
      housekeepingTasks: hkTasks,
      checkouts,
      checkedIn: checkedInRows,
      businessDate,
      currentTime,
      policy,
    });
  }

  async markCleaningStarted(
    ctx: ServiceContext,
    session: AuthSession,
    roomId: string
  ): Promise<HousekeepingTask> {
    this.requireManage(session);
    const room = await this.resolveRoom(roomId);
    if (room.status !== "cleaning") {
      throw new ServiceError("Room is not in cleaning queue.", "VALIDATION", 400);
    }

    const checkout = await this.getLastCheckout(roomId);
    const task = await this.ensureTask(roomId, "cleaning", {
      lastGuestName: checkout.guestName,
      lastCheckoutAt: checkout.checkoutAt,
    });

    const updatedTask = await this.housekeeping.updateStatus(task.id, "cleaning", {
      started_at: new Date().toISOString(),
      assigned_staff_id: ctx.userId,
    });

    await this.log(ctx, session, {
      action: `Cleaning started for room ${room.room_number}`,
      actionCode: ActivityActionCodes.ROOM_CLEANING_STARTED,
      roomId,
    });

    if (this.notifications) {
      await notifyHousekeepingAlert(this.notifications, {
        roomId,
        roomNumber: room.room_number,
        title: "Room Needs Cleaning",
        message: `Room ${room.room_number} is being cleaned.`,
        alertKind: "cleaning_started",
      });
    }

    return this.mapTaskFromKnownState(
      room,
      room.status,
      updatedTask,
      checkout.guestName,
      checkout.checkoutAt
    );
  }

  async markCleaningCompleted(
    ctx: ServiceContext,
    session: AuthSession,
    roomId: string,
    knownRoom?: DbRoomWithType
  ): Promise<HousekeepingTask> {
    this.requireManage(session);
    const room = knownRoom ?? (await this.resolveRoom(roomId));
    if (room.status !== "cleaning") {
      throw new ServiceError("Room is not being cleaned.", "VALIDATION", 400);
    }

    const task = await this.housekeeping.findByRoomId(roomId);
    let updatedTask = task;
    if (task) {
      updatedTask = await this.housekeeping.updateStatus(task.id, "ready", {
        completed_at: new Date().toISOString(),
      });
    }

    const nextRoom = await this.changeRoomStatus(
      ctx,
      session,
      room,
      "available",
      ActivityActionCodes.ROOM_CLEANING_COMPLETED,
      "Cleaning completed"
    );

    if (this.notifications) {
      await notifyHousekeepingAlert(this.notifications, {
        roomId,
        roomNumber: room.room_number,
        title: "Inspection Completed",
        message: `Room ${room.room_number} cleaning completed and inspected.`,
        alertKind: "inspection_completed",
      });
    }

    return this.mapTaskFromKnownState(
      nextRoom,
      nextRoom.status,
      updatedTask ?? null,
      updatedTask?.last_guest_name ?? task?.last_guest_name ?? null,
      updatedTask?.last_checkout_at ?? task?.last_checkout_at ?? null
    );
  }

  async markRoomReady(
    ctx: ServiceContext,
    session: AuthSession,
    roomId: string
  ): Promise<HousekeepingTask> {
    this.requireManage(session);
    const room = await this.resolveRoom(roomId);

    if (room.status === "cleaning") {
      return this.markCleaningCompleted(ctx, session, roomId, room);
    }

    if (room.status === "maintenance") {
      const task = await this.housekeeping.findByRoomId(roomId);
      let updatedTask = task;
      if (task) {
        updatedTask = await this.housekeeping.updateStatus(task.id, "ready", {
          completed_at: new Date().toISOString(),
        });
      }

      const nextRoom = await this.changeRoomStatus(
        ctx,
        session,
        room,
        "available",
        ActivityActionCodes.ROOM_READY,
        "Room ready"
      );

      if (this.notifications) {
        await notifyHousekeepingAlert(this.notifications, {
          roomId,
          roomNumber: room.room_number,
          title: "Room Ready",
          message: `Room ${room.room_number} is ready for guests.`,
          alertKind: "room_ready",
        });
      }

      return this.mapTaskFromKnownState(
        nextRoom,
        nextRoom.status,
        updatedTask ?? null,
        updatedTask?.last_guest_name ?? task?.last_guest_name ?? null,
        updatedTask?.last_checkout_at ?? task?.last_checkout_at ?? null
      );
    }

    throw new ServiceError(
      "Room cannot be marked ready from its current status.",
      "VALIDATION",
      400
    );
  }

  async markMaintenance(
    ctx: ServiceContext,
    session: AuthSession,
    roomId: string
  ): Promise<HousekeepingTask> {
    this.requireManage(session);
    const room = await this.resolveRoom(roomId);
    if (room.status !== "available") {
      throw new ServiceError(
        "Only available rooms can be marked for maintenance.",
        "VALIDATION",
        400
      );
    }

    await this.ensureTask(roomId, "maintenance");
    const nextRoom = await this.changeRoomStatus(
      ctx,
      session,
      room,
      "maintenance",
      ActivityActionCodes.ROOM_MAINTENANCE,
      "Marked maintenance"
    );

    const task = await this.housekeeping.findByRoomId(roomId);
    let updatedTask = task;
    if (task) {
      updatedTask = await this.housekeeping.updateStatus(task.id, "maintenance", {
        notes: "Awaiting maintenance review",
      });
    }

    if (this.notifications) {
      await notifyHousekeepingAlert(this.notifications, {
        roomId,
        roomNumber: room.room_number,
        title: "Room Out of Service",
        message: `Room ${room.room_number} has been marked out of service.`,
        alertKind: "out_of_service",
      });
    }

    return this.mapTaskFromKnownState(
      nextRoom,
      nextRoom.status,
      updatedTask ?? null,
      updatedTask?.last_guest_name ?? task?.last_guest_name ?? null,
      updatedTask?.last_checkout_at ?? task?.last_checkout_at ?? null
    );
  }
}
