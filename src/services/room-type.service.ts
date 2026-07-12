import { getTodayDateString } from "@/lib/dates/today";
import { sessionHasPermission } from "@/lib/auth/permissions";
import {
  formValuesToInsert,
  formValuesToUpdate,
  mapDbRoomTypeToRoomType,
} from "@/lib/room-types/mapper";
import { slugifyRoomTypeName } from "@/lib/room-types/slug";
import type { IRoomTypePricingRuleRepository } from "@/repositories/room-type-pricing-rule.repository";
import type { IActivityLogRepository } from "@/repositories/activity-log.repository";
import type { IRoomTypeRepository } from "@/repositories/room-type.repository";
import type { AuthSession } from "@/services/auth.service";
import { ServiceError } from "@/services/types";
import type { ServiceContext } from "@/services/types";
import { ActivityActionCodes } from "@/types/database/enums";
import type { DbPricingMode } from "@/types/database";
import type { RoomType, RoomTypeFormValues } from "@/types/room-type";

export interface IRoomTypeService {
  list(ctx: ServiceContext, session: AuthSession): Promise<RoomType[]>;
  getById(
    ctx: ServiceContext,
    session: AuthSession,
    idOrSlug: string
  ): Promise<RoomType | null>;
  create(
    ctx: ServiceContext,
    session: AuthSession,
    values: RoomTypeFormValues
  ): Promise<RoomType>;
  update(
    ctx: ServiceContext,
    session: AuthSession,
    idOrSlug: string,
    values: RoomTypeFormValues
  ): Promise<RoomType>;
  archive(
    ctx: ServiceContext,
    session: AuthSession,
    idOrSlug: string
  ): Promise<RoomType>;
  delete(
    ctx: ServiceContext,
    session: AuthSession,
    idOrSlug: string
  ): Promise<void>;
  getDeleteBlockers(
    ctx: ServiceContext,
    session: AuthSession,
    idOrSlug: string
  ): Promise<string[]>;
}

export class RoomTypeService implements IRoomTypeService {
  constructor(
    private readonly roomTypes: IRoomTypeRepository,
    private readonly activityLogs: IActivityLogRepository,
    private readonly pricingRules?: IRoomTypePricingRuleRepository
  ) {}

  private require(
    session: AuthSession,
    action: "view" | "create" | "edit" | "delete" | "manage"
  ): void {
    if (!sessionHasPermission(session, "room_types", action)) {
      throw new ServiceError(
        `Forbidden: missing permission room_types.${action}`,
        "FORBIDDEN",
        403
      );
    }
  }

  private async resolveRow(idOrSlug: string) {
    const row = await this.roomTypes.getById(idOrSlug);
    if (!row) {
      throw new ServiceError("Room type not found.", "NOT_FOUND", 404);
    }
    return row;
  }

  private async loadRules(roomTypeId: string) {
    if (!this.pricingRules) return [];
    return this.pricingRules.getByRoomTypeId(roomTypeId, {
      includeInactive: true,
    });
  }

  private async toRoomType(row: Awaited<ReturnType<IRoomTypeRepository["getById"]>>) {
    if (!row) return null;
    const numbers = await this.roomTypes.getAssignedRoomNumbers(row.id);
    const rules = await this.loadRules(row.id);
    return mapDbRoomTypeToRoomType(row, numbers, rules);
  }

  private async savePricingPresets(
    roomTypeId: string,
    values: RoomTypeFormValues
  ): Promise<void> {
    if (!this.pricingRules) return;

    for (const preset of values.pricingPresets) {
      if (!preset.configured || preset.rate == null) {
        const active = await this.pricingRules.getActiveRule(
          roomTypeId,
          preset.pricingMode as DbPricingMode
        );
        if (active) {
          await this.pricingRules.setRuleStatus(active.id, "inactive", false);
        }
        continue;
      }

      await this.pricingRules.createVersion({
        room_type_id: roomTypeId,
        pricing_mode: preset.pricingMode as DbPricingMode,
        rate: preset.rate,
        effective_from: preset.effectiveFrom ?? getTodayDateString(),
        effective_to: preset.effectiveTo ?? null,
      });
    }
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
      module: "room_types",
      entityType: "room_type",
      entityId: input.entityId,
      metadata: input.metadata,
    });
  }

  async list(ctx: ServiceContext, session: AuthSession): Promise<RoomType[]> {
    this.require(session, "view");
    const rows = await this.roomTypes.getAll(true);
    return Promise.all(
      rows.map(async (row) => {
        const numbers = await this.roomTypes.getAssignedRoomNumbers(row.id);
        const rules = await this.loadRules(row.id);
        return mapDbRoomTypeToRoomType(row, numbers, rules);
      })
    );
  }

  async getById(
    _ctx: ServiceContext,
    session: AuthSession,
    idOrSlug: string
  ): Promise<RoomType | null> {
    this.require(session, "view");
    const row = await this.roomTypes.getById(idOrSlug);
    return this.toRoomType(row);
  }

  async create(
    ctx: ServiceContext,
    session: AuthSession,
    values: RoomTypeFormValues
  ): Promise<RoomType> {
    this.require(session, "create");

    let slug = slugifyRoomTypeName(values.name);
    if (!slug) {
      throw new ServiceError("Invalid room type name.", "VALIDATION", 400);
    }

    const existing = await this.roomTypes.findBySlug(slug);
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const sortOrder = await this.roomTypes.getNextSortOrder();
    const row = await this.roomTypes.create(
      formValuesToInsert(values, slug, sortOrder)
    );

    await this.savePricingPresets(row.id, values);

    await this.log(ctx, session, {
      action: `Created room type ${row.name}`,
      actionCode: ActivityActionCodes.ROOM_TYPE_CREATED,
      entityId: row.id,
      metadata: { slug: row.slug, name: row.name },
    });

    const rules = await this.loadRules(row.id);
    return mapDbRoomTypeToRoomType(row, [], rules);
  }

  async update(
    ctx: ServiceContext,
    session: AuthSession,
    idOrSlug: string,
    values: RoomTypeFormValues
  ): Promise<RoomType> {
    this.require(session, "edit");
    const row = await this.resolveRow(idOrSlug);
    const updated = await this.roomTypes.update(row.id, formValuesToUpdate(values));
    await this.savePricingPresets(updated.id, values);

    await this.log(ctx, session, {
      action: `Updated room type ${updated.name}`,
      actionCode: ActivityActionCodes.ROOM_TYPE_UPDATED,
      entityId: updated.id,
      metadata: { slug: updated.slug },
    });

    const numbers = await this.roomTypes.getAssignedRoomNumbers(updated.id);
    const rules = await this.loadRules(updated.id);
    return mapDbRoomTypeToRoomType(updated, numbers, rules);
  }

  async archive(
    ctx: ServiceContext,
    session: AuthSession,
    idOrSlug: string
  ): Promise<RoomType> {
    this.require(session, "edit");

    const row = await this.resolveRow(idOrSlug);
    const archived = await this.roomTypes.archive(row.id);

    await this.log(ctx, session, {
      action: `Archived room type ${archived.name}`,
      actionCode: ActivityActionCodes.ROOM_TYPE_ARCHIVED,
      entityId: archived.id,
      metadata: { slug: archived.slug },
    });

    const numbers = await this.roomTypes.getAssignedRoomNumbers(archived.id);
    const rules = await this.loadRules(archived.id);
    return mapDbRoomTypeToRoomType(archived, numbers, rules);
  }

  async getDeleteBlockers(
    _ctx: ServiceContext,
    session: AuthSession,
    idOrSlug: string
  ): Promise<string[]> {
    this.require(session, "delete");
    const row = await this.resolveRow(idOrSlug);
    return this.roomTypes.getDeleteBlockers(row.id);
  }

  async delete(
    ctx: ServiceContext,
    session: AuthSession,
    idOrSlug: string
  ): Promise<void> {
    this.require(session, "delete");
    const row = await this.resolveRow(idOrSlug);
    const assignedNumbers = await this.roomTypes.getAssignedRoomNumbers(row.id);
    if (assignedNumbers.length > 0) {
      const roomWord = assignedNumbers.length === 1 ? "room is" : "rooms are";
      throw new ServiceError(
        `Cannot delete ${row.name}. ${assignedNumbers.length} ${roomWord} assigned to this room type.`,
        "DELETE_BLOCKED",
        409
      );
    }

    const blockers = await this.roomTypes.getDeleteBlockers(row.id);
    if (blockers.length > 0) {
      throw new ServiceError(
        `Cannot delete room type. ${blockers.join("; ")}. Archive instead.`,
        "DELETE_BLOCKED",
        409
      );
    }

    await this.roomTypes.delete(row.id);

    await this.log(ctx, session, {
      action: `Deleted room type ${row.name}`,
      actionCode: ActivityActionCodes.ROOM_TYPE_ARCHIVED,
      entityId: row.id,
      metadata: { deleted: true, slug: row.slug },
    });
  }
}
