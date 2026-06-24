import { getGuestAccess } from "@/lib/auth/guest-access";
import { sessionHasPermission } from "@/lib/auth/permissions";
import {
  formValuesToGuestInsert,
  formValuesToGuestUpdate,
  isGuestArchived,
  mapDbGuestToGuest,
} from "@/lib/guests/mapper";
import type { IActivityLogRepository } from "@/repositories/activity-log.repository";
import type { IGuestRepository } from "@/repositories/guest.repository";
import type { AuthSession } from "@/services/auth.service";
import { ServiceError } from "@/services/types";
import type { ServiceContext } from "@/services/types";
import { ActivityActionCodes } from "@/types/database/enums";
import type { Guest, GuestFormValues } from "@/types/guest";

export interface IGuestService {
  listGuests(ctx: ServiceContext, session: AuthSession): Promise<Guest[]>;
  getGuestById(
    ctx: ServiceContext,
    session: AuthSession,
    guestId: string
  ): Promise<Guest | null>;
  createGuest(
    ctx: ServiceContext,
    session: AuthSession,
    values: GuestFormValues
  ): Promise<Guest>;
  updateGuest(
    ctx: ServiceContext,
    session: AuthSession,
    guestId: string,
    values: GuestFormValues
  ): Promise<Guest>;
  archiveGuest(
    ctx: ServiceContext,
    session: AuthSession,
    guestId: string
  ): Promise<Guest>;
}

export class GuestService implements IGuestService {
  constructor(
    private readonly guests: IGuestRepository,
    private readonly activityLogs: IActivityLogRepository
  ) {}

  private require(
    session: AuthSession,
    action: "view" | "create" | "edit" | "delete" | "manage"
  ): void {
    if (!sessionHasPermission(session, "guests", action)) {
      throw new ServiceError(
        `Forbidden: missing permission guests.${action}`,
        "FORBIDDEN",
        403
      );
    }
  }

  private validateFormValues(values: GuestFormValues): void {
    if (!values.fullName.trim()) {
      throw new ServiceError("Guest name is required.", "VALIDATION", 400);
    }
  }

  private async resolveRow(guestId: string) {
    const row = await this.guests.getById(guestId);
    if (!row || isGuestArchived(row)) {
      throw new ServiceError("Guest not found.", "NOT_FOUND", 404);
    }
    return row;
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
      module: "guests",
      entityType: "guest",
      entityId: input.entityId,
      metadata: input.metadata,
    });
  }

  async listGuests(ctx: ServiceContext, session: AuthSession): Promise<Guest[]> {
    this.require(session, "view");
    const rows = await this.guests.getAll(false);
    return rows.map(mapDbGuestToGuest);
  }

  async getGuestById(
    _ctx: ServiceContext,
    session: AuthSession,
    guestId: string
  ): Promise<Guest | null> {
    this.require(session, "view");
    const row = await this.guests.getById(guestId);
    if (!row || isGuestArchived(row)) return null;
    return mapDbGuestToGuest(row);
  }

  async createGuest(
    ctx: ServiceContext,
    session: AuthSession,
    values: GuestFormValues
  ): Promise<Guest> {
    this.require(session, "create");
    this.validateFormValues(values);

    const email = values.email.trim();
    if (email) {
      const existing = await this.guests.findByEmail(email);
      if (existing && !isGuestArchived(existing)) {
        throw new ServiceError(
          "A guest with this email already exists.",
          "CONFLICT",
          409
        );
      }
    }

    const row = await this.guests.create(formValuesToGuestInsert(values));

    await this.log(ctx, session, {
      action: `Created guest ${row.full_name}`,
      actionCode: ActivityActionCodes.GUEST_CREATED,
      entityId: row.id,
      metadata: { full_name: row.full_name },
    });

    return mapDbGuestToGuest(row);
  }

  async updateGuest(
    ctx: ServiceContext,
    session: AuthSession,
    guestId: string,
    values: GuestFormValues
  ): Promise<Guest> {
    if (!getGuestAccess(session).canEdit) {
      throw new ServiceError(
        "Forbidden: guests.edit required to update guest.",
        "FORBIDDEN",
        403
      );
    }

    this.validateFormValues(values);
    const row = await this.resolveRow(guestId);

    const email = values.email.trim();
    if (email) {
      const existing = await this.guests.findByEmail(email);
      if (existing && existing.id !== row.id && !isGuestArchived(existing)) {
        throw new ServiceError(
          "A guest with this email already exists.",
          "CONFLICT",
          409
        );
      }
    }

    const updated = await this.guests.update(
      row.id,
      formValuesToGuestUpdate(values)
    );

    await this.log(ctx, session, {
      action: `Updated guest ${updated.full_name}`,
      actionCode: ActivityActionCodes.GUEST_UPDATED,
      entityId: updated.id,
      metadata: { full_name: updated.full_name },
    });

    return mapDbGuestToGuest(updated);
  }

  async archiveGuest(
    ctx: ServiceContext,
    session: AuthSession,
    guestId: string
  ): Promise<Guest> {
    if (!getGuestAccess(session).canArchive) {
      throw new ServiceError(
        "Forbidden: cannot archive guests.",
        "FORBIDDEN",
        403
      );
    }

    const row = await this.resolveRow(guestId);
    const archived = await this.guests.archive(row.id);

    await this.log(ctx, session, {
      action: `Archived guest ${archived.full_name}`,
      actionCode: ActivityActionCodes.GUEST_ARCHIVED,
      entityId: archived.id,
      metadata: { full_name: archived.full_name },
    });

    return mapDbGuestToGuest(archived);
  }
}
