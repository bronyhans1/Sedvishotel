import {
  formValuesToInsert,
  formValuesToUpdate,
  mapDbFloorToFloor,
} from "@/lib/floors/mapper";
import { sessionHasPermission } from "@/lib/auth/permissions";
import type { IActivityLogRepository } from "@/repositories/activity-log.repository";
import type { IFloorRepository } from "@/repositories/floor.repository";
import type { AuthSession } from "@/services/auth.service";
import { ServiceError } from "@/services/types";
import type { ServiceContext } from "@/services/types";
import { ActivityActionCodes } from "@/types/database/enums";
import type { Floor, FloorFormValues, FloorOption } from "@/types/floor";

export interface IFloorService {
  listFloors(ctx: ServiceContext, session: AuthSession): Promise<Floor[]>;
  getFloorById(
    ctx: ServiceContext,
    session: AuthSession,
    id: string
  ): Promise<Floor | null>;
  createFloor(
    ctx: ServiceContext,
    session: AuthSession,
    values: FloorFormValues
  ): Promise<Floor>;
  updateFloor(
    ctx: ServiceContext,
    session: AuthSession,
    id: string,
    values: FloorFormValues
  ): Promise<Floor>;
  archiveFloor(
    ctx: ServiceContext,
    session: AuthSession,
    id: string
  ): Promise<Floor>;
  reorderFloors(
    ctx: ServiceContext,
    session: AuthSession,
    items: { id: string; displayOrder: number }[]
  ): Promise<void>;
  getFloorRoomCount(
    ctx: ServiceContext,
    session: AuthSession,
    id: string
  ): Promise<number>;
  listActiveFloorOptions(session: AuthSession): Promise<
    import("@/types/floor").FloorOption[]
  >;
}

export class FloorService implements IFloorService {
  constructor(
    private readonly floors: IFloorRepository,
    private readonly activityLogs: IActivityLogRepository
  ) {}

  private require(
    session: AuthSession,
    action: "view" | "create" | "edit" | "delete" | "manage"
  ): void {
    if (!sessionHasPermission(session, "floors", action)) {
      throw new ServiceError(
        `Forbidden: missing permission floors.${action}`,
        "FORBIDDEN",
        403
      );
    }
  }

  private async resolveRow(id: string) {
    const row = await this.floors.getById(id);
    if (!row) {
      throw new ServiceError("Floor not found.", "NOT_FOUND", 404);
    }
    return row;
  }

  private async toFloor(row: Awaited<ReturnType<IFloorRepository["getById"]>>) {
    if (!row) return null;
    const roomCount = await this.floors.getRoomCount(row.id);
    return mapDbFloorToFloor(row, roomCount);
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
      module: "floors",
      entityType: "floor",
      entityId: input.entityId,
      metadata: input.metadata,
    });
  }

  async listFloors(ctx: ServiceContext, session: AuthSession): Promise<Floor[]> {
    this.require(session, "view");
    const rows = await this.floors.getAll(true);
    return Promise.all(
      rows.map(async (row) => {
        const roomCount = await this.floors.getRoomCount(row.id);
        return mapDbFloorToFloor(row, roomCount);
      })
    );
  }

  async getFloorById(
    _ctx: ServiceContext,
    session: AuthSession,
    id: string
  ): Promise<Floor | null> {
    this.require(session, "view");
    const row = await this.floors.getById(id);
    return this.toFloor(row);
  }

  async createFloor(
    ctx: ServiceContext,
    session: AuthSession,
    values: FloorFormValues
  ): Promise<Floor> {
    this.require(session, "create");

    const name = values.name.trim();
    if (!name) {
      throw new ServiceError("Floor name is required.", "VALIDATION", 400);
    }

    const displayOrder =
      values.displayOrder > 0
        ? values.displayOrder
        : await this.floors.getNextDisplayOrder();

    const row = await this.floors.create(formValuesToInsert(values, displayOrder));

    await this.log(ctx, session, {
      action: `Created floor ${row.name}`,
      actionCode: ActivityActionCodes.FLOOR_CREATED,
      entityId: row.id,
      metadata: { name: row.name, display_order: row.display_order },
    });

    return mapDbFloorToFloor(row, 0);
  }

  async updateFloor(
    ctx: ServiceContext,
    session: AuthSession,
    id: string,
    values: FloorFormValues
  ): Promise<Floor> {
    this.require(session, "edit");
    const row = await this.resolveRow(id);
    const updated = await this.floors.update(row.id, formValuesToUpdate(values));

    await this.log(ctx, session, {
      action: `Updated floor ${updated.name}`,
      actionCode: ActivityActionCodes.FLOOR_UPDATED,
      entityId: updated.id,
      metadata: { name: updated.name },
    });

    const roomCount = await this.floors.getRoomCount(updated.id);
    return mapDbFloorToFloor(updated, roomCount);
  }

  async archiveFloor(
    ctx: ServiceContext,
    session: AuthSession,
    id: string
  ): Promise<Floor> {
    this.require(session, "edit");

    const row = await this.resolveRow(id);
    const roomCount = await this.floors.getRoomCount(row.id);
    if (roomCount > 0) {
      const roomWord = roomCount === 1 ? "room is" : "rooms are";
      throw new ServiceError(
        `Cannot archive ${row.name}. ${roomCount} ${roomWord} assigned to this floor.`,
        "ARCHIVE_BLOCKED",
        409
      );
    }

    const archived = await this.floors.archive(row.id);

    await this.log(ctx, session, {
      action: `Archived floor ${archived.name}`,
      actionCode: ActivityActionCodes.FLOOR_ARCHIVED,
      entityId: archived.id,
      metadata: { name: archived.name },
    });

    return mapDbFloorToFloor(archived, 0);
  }

  async reorderFloors(
    ctx: ServiceContext,
    session: AuthSession,
    items: { id: string; displayOrder: number }[]
  ): Promise<void> {
    this.require(session, "manage");
    await this.floors.reorder(items);

    await this.log(ctx, session, {
      action: "Reordered floors",
      actionCode: ActivityActionCodes.FLOOR_UPDATED,
      entityId: items[0]?.id ?? "floors",
      metadata: { count: items.length },
    });
  }

  async getFloorRoomCount(
    _ctx: ServiceContext,
    session: AuthSession,
    id: string
  ): Promise<number> {
    this.require(session, "view");
    await this.resolveRow(id);
    return this.floors.getRoomCount(id);
  }

  async listActiveFloorOptions(session: AuthSession): Promise<FloorOption[]> {
    if (
      !sessionHasPermission(session, "rooms", "view") &&
      !sessionHasPermission(session, "floors", "view")
    ) {
      throw new ServiceError(
        "Forbidden: missing permission to load floors.",
        "FORBIDDEN",
        403
      );
    }

    const rows = await this.floors.getAll(false);
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      displayOrder: row.display_order,
    }));
  }
}
