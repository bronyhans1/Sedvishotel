import { getHousekeepingAccess } from "@/lib/auth/housekeeping-access";
import {
  computeHousekeepingStats,
  mapRoomToHousekeepingTask,
} from "@/lib/housekeeping/mapper";
import type { IActivityLogRepository } from "@/repositories/activity-log.repository";
import type { IHousekeepingRepository } from "@/repositories/housekeeping.repository";
import type { IReservationRepository } from "@/repositories/reservation.repository";
import type { IRoomRepository } from "@/repositories/room.repository";
import type { AuthSession } from "@/services/auth.service";
import { ServiceError } from "@/services/types";
import type { ServiceContext } from "@/services/types";
import { ActivityActionCodes } from "@/types/database/enums";
import type { DbRoomStatus } from "@/types/database";
import type { HousekeepingStats, HousekeepingTask } from "@/types/housekeeping";

export interface IHousekeepingService {
  listTasks(
    ctx: ServiceContext,
    session: AuthSession
  ): Promise<{ tasks: HousekeepingTask[]; stats: HousekeepingStats }>;
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
    private readonly activityLogs: IActivityLogRepository
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
    const reservations = await this.reservations.getByRoomId(roomId);
    const checkedOut = reservations
      .filter((r) => r.status === "checked_out" || r.checked_out_at)
      .sort((a, b) => {
        const aTime = a.checked_out_at ?? a.updated_at;
        const bTime = b.checked_out_at ?? b.updated_at;
        return bTime.localeCompare(aTime);
      })[0];

    if (!checkedOut) return { guestName: null, checkoutAt: null };
    return {
      guestName: checkedOut.guest.full_name,
      checkoutAt: checkedOut.checked_out_at,
    };
  }

  private async buildTaskForRoom(roomId: string): Promise<HousekeepingTask> {
    const room = await this.resolveRoom(roomId);
    const task = await this.housekeeping.findByRoomId(roomId);
    const checkout = await this.getLastCheckout(roomId);
    const mapped = mapRoomToHousekeepingTask(
      room,
      task,
      checkout.guestName,
      checkout.checkoutAt
    );
    if (!mapped) {
      throw new ServiceError("Room is not on the housekeeping board.", "VALIDATION", 400);
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
    roomId: string,
    next: DbRoomStatus,
    actionCode: string,
    action: string
  ): Promise<void> {
    const room = await this.resolveRoom(roomId);
    const previous = room.status;
    if (previous === next) return;

    await this.rooms.changeStatus(roomId, next);
    await this.log(ctx, session, {
      action: `${action} — Room ${room.room_number}`,
      actionCode,
      roomId,
      metadata: { previous_status: previous, new_status: next },
    });
  }

  async listTasks(
    _ctx: ServiceContext,
    session: AuthSession
  ): Promise<{ tasks: HousekeepingTask[]; stats: HousekeepingStats }> {
    this.requireView(session);

    const rooms = await this.rooms.getAll(false);
    const boardRooms = rooms.filter((room) =>
      ["cleaning", "available", "maintenance"].includes(room.status)
    );

    const tasks: HousekeepingTask[] = [];
    for (const room of boardRooms) {
      const hkTask = await this.housekeeping.findByRoomId(room.id);
      const checkout = await this.getLastCheckout(room.id);
      const mapped = mapRoomToHousekeepingTask(
        room,
        hkTask,
        checkout.guestName,
        checkout.checkoutAt
      );
      if (mapped) tasks.push(mapped);
    }

    return { tasks, stats: computeHousekeepingStats(tasks) };
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

    await this.housekeeping.updateStatus(task.id, "cleaning", {
      started_at: new Date().toISOString(),
      assigned_staff_id: ctx.userId,
    });

    await this.log(ctx, session, {
      action: `Cleaning started for room ${room.room_number}`,
      actionCode: ActivityActionCodes.ROOM_CLEANING_STARTED,
      roomId,
    });

    return this.buildTaskForRoom(roomId);
  }

  async markCleaningCompleted(
    ctx: ServiceContext,
    session: AuthSession,
    roomId: string
  ): Promise<HousekeepingTask> {
    this.requireManage(session);
    const room = await this.resolveRoom(roomId);
    if (room.status !== "cleaning") {
      throw new ServiceError("Room is not being cleaned.", "VALIDATION", 400);
    }

    const task = await this.housekeeping.findByRoomId(roomId);
    if (task) {
      await this.housekeeping.updateStatus(task.id, "ready", {
        completed_at: new Date().toISOString(),
      });
    }

    await this.changeRoomStatus(
      ctx,
      session,
      roomId,
      "available",
      ActivityActionCodes.ROOM_CLEANING_COMPLETED,
      "Cleaning completed"
    );

    return this.buildTaskForRoom(roomId);
  }

  async markRoomReady(
    ctx: ServiceContext,
    session: AuthSession,
    roomId: string
  ): Promise<HousekeepingTask> {
    this.requireManage(session);
    const room = await this.resolveRoom(roomId);

    if (room.status === "cleaning") {
      return this.markCleaningCompleted(ctx, session, roomId);
    }

    if (room.status === "maintenance") {
      const task = await this.housekeeping.findByRoomId(roomId);
      if (task) {
        await this.housekeeping.updateStatus(task.id, "ready", {
          completed_at: new Date().toISOString(),
        });
      }

      await this.changeRoomStatus(
        ctx,
        session,
        roomId,
        "available",
        ActivityActionCodes.ROOM_READY,
        "Room ready"
      );
      return this.buildTaskForRoom(roomId);
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
    await this.changeRoomStatus(
      ctx,
      session,
      roomId,
      "maintenance",
      ActivityActionCodes.ROOM_MAINTENANCE,
      "Marked maintenance"
    );

    const task = await this.housekeeping.findByRoomId(roomId);
    if (task) {
      await this.housekeeping.updateStatus(task.id, "maintenance", {
        notes: "Awaiting maintenance review",
      });
    }

    return this.buildTaskForRoom(roomId);
  }
}
