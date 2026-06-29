import { getRoomAccess } from "@/lib/auth/room-access";
import { sessionHasPermission } from "@/lib/auth/permissions";
import { isValidRoomNumber, normalizeRoomNumber } from "@/lib/rooms/floor-layout";
import { mapDbRoomToRoom, formValuesToRoomUpdate } from "@/lib/rooms/mapper";
import {
  formatActivityAction,
  formatActivityMetadata,
} from "@/lib/activity/labels";
import { BLOCKING_RESERVATION_STATUSES } from "@/lib/reservations/constants";
import type { IFloorRepository } from "@/repositories/floor.repository";
import type { IActivityLogRepository } from "@/repositories/activity-log.repository";
import type { IReservationRepository } from "@/repositories/reservation.repository";
import type { IRoomRepository } from "@/repositories/room.repository";
import type { IRoomTypeRepository } from "@/repositories/room-type.repository";
import type { AuthSession } from "@/services/auth.service";
import { ServiceError } from "@/services/types";
import type { ServiceContext } from "@/services/types";
import { ActivityActionCodes } from "@/types/database/enums";
import type { DbRoomStatus } from "@/types/database";
import type { Room, RoomActivity, RoomFormValues, RoomTypeOption } from "@/types/room";

export interface IRoomService {
  list(ctx: ServiceContext, session: AuthSession): Promise<Room[]>;
  listAssignableRoomTypeOptions(
    ctx: ServiceContext,
    session: AuthSession,
    ensureTypeIds?: string[]
  ): Promise<RoomTypeOption[]>;
  getById(
    ctx: ServiceContext,
    session: AuthSession,
    idOrNumber: string
  ): Promise<Room | null>;
  getDetail(
    ctx: ServiceContext,
    session: AuthSession,
    idOrNumber: string
  ): Promise<{ room: Room; activities: RoomActivity[] } | null>;
  create(
    ctx: ServiceContext,
    session: AuthSession,
    values: RoomFormValues
  ): Promise<Room>;
  update(
    ctx: ServiceContext,
    session: AuthSession,
    idOrNumber: string,
    values: RoomFormValues
  ): Promise<Room>;
  changeStatus(
    ctx: ServiceContext,
    session: AuthSession,
    idOrNumber: string,
    status: DbRoomStatus
  ): Promise<Room>;
  archive(
    ctx: ServiceContext,
    session: AuthSession,
    idOrNumber: string
  ): Promise<Room>;
  delete(
    ctx: ServiceContext,
    session: AuthSession,
    idOrNumber: string
  ): Promise<void>;
  getDeleteBlockers(
    ctx: ServiceContext,
    session: AuthSession,
    idOrNumber: string
  ): Promise<string[]>;
  getActivityForRoom(
    ctx: ServiceContext,
    session: AuthSession,
    roomUuid: string
  ): Promise<RoomActivity[]>;
}

export class RoomService implements IRoomService {
  constructor(
    private readonly rooms: IRoomRepository,
    private readonly roomTypes: IRoomTypeRepository,
    private readonly floors: IFloorRepository,
    private readonly activityLogs: IActivityLogRepository,
    private readonly reservations: IReservationRepository
  ) {}

  private async assertManualStatusChangeAllowed(
    roomId: string,
    nextStatus: DbRoomStatus
  ): Promise<void> {
    const reservations = await this.reservations.getByRoomId(roomId);
    const blocking = reservations.filter((r) =>
      BLOCKING_RESERVATION_STATUSES.includes(r.status)
    );

    if (blocking.length === 0) return;

    if (nextStatus === "available") {
      throw new ServiceError(
        "Cannot mark room available while an active reservation exists.",
        "CONFLICT",
        409
      );
    }

    if (
      nextStatus === "reserved" &&
      blocking.some((r) => r.status === "checked_in")
    ) {
      throw new ServiceError(
        "Cannot mark room reserved while a guest is checked in.",
        "CONFLICT",
        409
      );
    }
  }

  private require(
    session: AuthSession,
    action: "view" | "create" | "edit" | "delete" | "manage"
  ): void {
    if (!sessionHasPermission(session, "rooms", action)) {
      throw new ServiceError(
        `Forbidden: missing permission rooms.${action}`,
        "FORBIDDEN",
        403
      );
    }
  }

  private async resolveRow(idOrNumber: string) {
    const row = await this.rooms.getById(idOrNumber);
    if (!row) {
      throw new ServiceError("Room not found.", "NOT_FOUND", 404);
    }
    return row;
  }

  private async resolveRoomType(idOrSlug: string) {
    const trimmed = idOrSlug.trim();
    if (!trimmed) {
      throw new ServiceError("Room type is required.", "VALIDATION", 400);
    }

    const roomType = await this.roomTypes.getById(trimmed);
    if (!roomType) {
      throw new ServiceError("Room type not found.", "NOT_FOUND", 404);
    }

    return roomType;
  }

  private async resolveFloor(floorId: string) {
    const trimmed = floorId.trim();
    if (!trimmed) {
      throw new ServiceError("Floor is required.", "VALIDATION", 400);
    }

    const floor = await this.floors.getById(trimmed);
    if (!floor) {
      throw new ServiceError("Floor not found.", "NOT_FOUND", 404);
    }
    if (!floor.active) {
      throw new ServiceError("Floor is not active.", "VALIDATION", 400);
    }

    return floor;
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
      module: "rooms",
      entityType: "room",
      entityId: input.entityId,
      metadata: input.metadata,
    });
  }

  async list(ctx: ServiceContext, session: AuthSession): Promise<Room[]> {
    this.require(session, "view");
    const rows = await this.rooms.getAll(false);
    return rows.map(mapDbRoomToRoom);
  }

  async listAssignableRoomTypeOptions(
    _ctx: ServiceContext,
    session: AuthSession,
    ensureTypeIds: string[] = []
  ): Promise<RoomTypeOption[]> {
    this.require(session, "view");
    const canAssign =
      sessionHasPermission(session, "rooms", "create") ||
      sessionHasPermission(session, "rooms", "edit") ||
      sessionHasPermission(session, "rooms", "manage");
    if (!canAssign) {
      throw new ServiceError(
        "Forbidden: rooms create, edit, or manage required to assign room types.",
        "FORBIDDEN",
        403
      );
    }

    const ensure = new Set(ensureTypeIds.filter(Boolean));
    const rows = await this.roomTypes.getAll(true);
    return rows
      .filter((row) => row.status === "active" || ensure.has(row.slug))
      .map((row) => ({
        id: row.slug,
        name: row.name,
        capacity: row.capacity,
        defaultPrice: Number(row.default_price),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async getById(
    _ctx: ServiceContext,
    session: AuthSession,
    idOrNumber: string
  ): Promise<Room | null> {
    this.require(session, "view");
    const row = await this.rooms.getById(idOrNumber);
    return row ? mapDbRoomToRoom(row) : null;
  }

  async getDetail(
    ctx: ServiceContext,
    session: AuthSession,
    idOrNumber: string
  ): Promise<{ room: Room; activities: RoomActivity[] } | null> {
    this.require(session, "view");
    const row = await this.rooms.getById(idOrNumber);
    if (!row) return null;
    const activities = await this.getActivityForRoom(ctx, session, row.id);
    return { room: mapDbRoomToRoom(row), activities };
  }

  async create(
    ctx: ServiceContext,
    session: AuthSession,
    values: RoomFormValues
  ): Promise<Room> {
    this.require(session, "create");

    const roomNumber = normalizeRoomNumber(values.roomNumber);
    if (!roomNumber || !isValidRoomNumber(values.roomNumber)) {
      throw new ServiceError("Room number is required.", "VALIDATION", 400);
    }

    const existing = await this.rooms.getByNumber(roomNumber);
    if (existing) {
      throw new ServiceError("Room number already exists.", "CONFLICT", 409);
    }

    const roomType = await this.resolveRoomType(values.roomTypeId);
    if (roomType.status !== "active") {
      throw new ServiceError("Room type is not active.", "VALIDATION", 400);
    }

    const floor = await this.resolveFloor(values.floorId);

    const row = await this.rooms.create({
      room_number: roomNumber,
      floor: null,
      floor_id: floor.id,
      room_type_id: roomType.id,
      status: values.status,
      notes: values.notes.trim() || null,
      image_urls: [],
    });

    await this.log(ctx, session, {
      action: `Created room ${roomNumber}`,
      actionCode: ActivityActionCodes.ROOM_CREATED,
      entityId: row.id,
      metadata: { room_number: roomNumber, status: values.status },
    });

    return mapDbRoomToRoom(row);
  }

  async update(
    ctx: ServiceContext,
    session: AuthSession,
    idOrNumber: string,
    values: RoomFormValues
  ): Promise<Room> {
    const access = getRoomAccess(session);
    if (!access.canEdit) {
      throw new ServiceError(
        "Forbidden: full room edit not allowed for your role.",
        "FORBIDDEN",
        403
      );
    }

    const row = await this.resolveRow(idOrNumber);
    const roomNumber = normalizeRoomNumber(values.roomNumber);
    if (!roomNumber || !isValidRoomNumber(values.roomNumber)) {
      throw new ServiceError("Room number is required.", "VALIDATION", 400);
    }

    const duplicate = await this.rooms.getByNumber(roomNumber);
    if (duplicate && duplicate.id !== row.id) {
      throw new ServiceError("Room number already exists.", "CONFLICT", 409);
    }

    const roomType = await this.resolveRoomType(values.roomTypeId);
    await this.resolveFloor(values.floorId);
    const updated = await this.rooms.update(row.id, {
      ...formValuesToRoomUpdate(values),
      room_type_id: roomType.id,
    });

    await this.log(ctx, session, {
      action: `Updated room ${updated.room_number}`,
      actionCode: ActivityActionCodes.ROOM_UPDATED,
      entityId: updated.id,
      metadata: { room_number: updated.room_number },
    });

    return mapDbRoomToRoom(updated);
  }

  async changeStatus(
    ctx: ServiceContext,
    session: AuthSession,
    idOrNumber: string,
    status: DbRoomStatus
  ): Promise<Room> {
    if (!getRoomAccess(session).canChangeStatus) {
      throw new ServiceError(
        "Forbidden: rooms.edit required to change status.",
        "FORBIDDEN",
        403
      );
    }

    const row = await this.resolveRow(idOrNumber);
    await this.assertManualStatusChangeAllowed(row.id, status);

    const previous = row.status;
    const updated = await this.rooms.changeStatus(row.id, status);

    await this.log(ctx, session, {
      action: `Room ${updated.room_number} status ${previous} → ${status}`,
      actionCode: ActivityActionCodes.ROOM_STATUS_CHANGED,
      entityId: updated.id,
      metadata: { previous_status: previous, new_status: status },
    });

    return mapDbRoomToRoom(updated);
  }

  async archive(
    ctx: ServiceContext,
    session: AuthSession,
    idOrNumber: string
  ): Promise<Room> {
    if (!getRoomAccess(session).canArchive) {
      throw new ServiceError(
        "Forbidden: cannot archive rooms.",
        "FORBIDDEN",
        403
      );
    }

    const row = await this.resolveRow(idOrNumber);
    const archived = await this.rooms.archive(row.id);

    await this.log(ctx, session, {
      action: `Archived room ${archived.room_number}`,
      actionCode: ActivityActionCodes.ROOM_ARCHIVED,
      entityId: archived.id,
      metadata: { room_number: archived.room_number },
    });

    return mapDbRoomToRoom(archived);
  }

  async getDeleteBlockers(
    _ctx: ServiceContext,
    session: AuthSession,
    idOrNumber: string
  ): Promise<string[]> {
    this.require(session, "delete");
    const row = await this.resolveRow(idOrNumber);
    return this.rooms.getDeleteBlockers(row.id);
  }

  async delete(
    ctx: ServiceContext,
    session: AuthSession,
    idOrNumber: string
  ): Promise<void> {
    if (!sessionHasPermission(session, "rooms", "delete")) {
      throw new ServiceError(
        "Forbidden: rooms.delete required.",
        "FORBIDDEN",
        403
      );
    }

    const row = await this.resolveRow(idOrNumber);
    const blockers = await this.rooms.getDeleteBlockers(row.id);
    if (blockers.length > 0) {
      throw new ServiceError(
        `Cannot delete room. ${blockers.join("; ")}. Archive instead.`,
        "DELETE_BLOCKED",
        409
      );
    }

    await this.rooms.delete(row.id);

    await this.log(ctx, session, {
      action: `Deleted room ${row.room_number}`,
      actionCode: ActivityActionCodes.ROOM_ARCHIVED,
      entityId: row.id,
      metadata: { deleted: true, room_number: row.room_number },
    });
  }

  async getActivityForRoom(
    _ctx: ServiceContext,
    session: AuthSession,
    roomUuid: string
  ): Promise<RoomActivity[]> {
    this.require(session, "view");
    const logs = await this.activityLogs.findByEntityId(roomUuid, "rooms");
    return logs.map((log) => {
      const title = formatActivityAction(log.action_code, log.action);
      const metadata = formatActivityMetadata(log.metadata);
      return {
        id: log.id,
        title,
        description: metadata ?? "",
        timestamp: new Date(log.created_at).toLocaleString("en-GB", {
          dateStyle: "medium",
          timeStyle: "short",
        }),
        type:
          log.action_code === ActivityActionCodes.ROOM_STATUS_CHANGED
            ? "note"
            : log.action_code.includes("cleaning")
              ? "cleaning"
              : log.action_code.includes("maintenance")
                ? "maintenance"
                : "note",
      };
    });
  }
}
