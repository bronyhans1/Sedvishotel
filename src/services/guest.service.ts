import { getGuestAccess } from "@/lib/auth/guest-access";
import { sessionHasPermission } from "@/lib/auth/permissions";
import type { GuestDirectoryStats, GuestListFilters, GuestListStay } from "@/lib/guests/list-order";
import {
  formValuesToGuestInsert,
  formValuesToGuestUpdate,
  isGuestArchived,
  mapDbGuestToGuest,
} from "@/lib/guests/mapper";
import { OPERATIONAL_LIST_PAGE_SIZE } from "@/lib/pagination/constants";
import { getTotalPages, normalizePage } from "@/lib/pagination/pagination";
import type { IActivityLogRepository } from "@/repositories/activity-log.repository";
import type { IGuestRepository } from "@/repositories/guest.repository";
import type { IPaymentRepository } from "@/repositories/payment.repository";
import type { IPosRepository } from "@/repositories/pos.repository";
import type { AuthSession } from "@/services/auth.service";
import { ServiceError } from "@/services/types";
import type { ServiceContext } from "@/services/types";
import { ActivityActionCodes } from "@/types/database/enums";
import type { Guest, GuestFormValues } from "@/types/guest";

export type GuestListPage = {
  guests: Guest[];
  stays: GuestListStay[];
  total: number;
  page: number;
  pageSize: number;
  stats: GuestDirectoryStats;
};

export interface IGuestService {
  listGuests(ctx: ServiceContext, session: AuthSession): Promise<Guest[]>;
  listGuestPage(
    ctx: ServiceContext,
    session: AuthSession,
    input: { page: number; businessDate: string; filters: GuestListFilters }
  ): Promise<GuestListPage>;
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
  getGuestSpendContext(
    ctx: ServiceContext,
    session: AuthSession,
    guestId: string
  ): Promise<{ lifetimePosSpend: number; paymentMethods: string[] }>;
}

export class GuestService implements IGuestService {
  constructor(
    private readonly guests: IGuestRepository,
    private readonly activityLogs: IActivityLogRepository,
    private readonly pos?: IPosRepository,
    private readonly payments?: IPaymentRepository
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

  async listGuestPage(
    _ctx: ServiceContext,
    session: AuthSession,
    input: { page: number; businessDate: string; filters: GuestListFilters }
  ): Promise<GuestListPage> {
    this.require(session, "view");
    const pageSize = OPERATIONAL_LIST_PAGE_SIZE;
    const result = await this.guests.listPage({
      page: input.page,
      pageSize,
      businessDate: input.businessDate,
      filters: input.filters,
    });
    const page = normalizePage(input.page, getTotalPages(result.total, pageSize));
    const visible = page === input.page;
    return {
      guests: visible ? result.data.map(mapDbGuestToGuest) : [],
      stays: visible ? result.stays : [],
      total: result.total,
      page,
      pageSize,
      stats: result.stats,
    };
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

  async searchGuests(
    _ctx: ServiceContext,
    session: AuthSession,
    query: string
  ): Promise<Array<{ id: string; fullName: string; phone: string; email: string }>> {
    this.require(session, "view");
    const rows = await this.guests.searchAssignable(query, 8);
    return rows.map((row) => ({
      id: row.id,
      fullName: row.full_name,
      phone: row.phone ?? "",
      email: row.email ?? "",
    }));
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

    const phone = values.phone.trim();
    if (phone) {
      const existingByPhone = await this.guests.findByPhone(phone);
      if (existingByPhone && !isGuestArchived(existingByPhone)) {
        throw new ServiceError(
          "A guest with this phone number already exists.",
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

  async getGuestSpendContext(
    _ctx: ServiceContext,
    session: AuthSession,
    guestId: string
  ): Promise<{ lifetimePosSpend: number; paymentMethods: string[] }> {
    this.require(session, "view");
    await this.resolveRow(guestId);

    const [lifetimePosSpend, paymentMethods] = await Promise.all([
      this.pos?.sumRoomChargeTotalByGuestId(guestId) ?? Promise.resolve(0),
      this.payments?.listPaymentMethodsForGuest(guestId) ?? Promise.resolve([]),
    ]);

    return { lifetimePosSpend, paymentMethods };
  }
}
