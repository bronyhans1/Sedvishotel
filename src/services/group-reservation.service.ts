import { mapDbGroupReservationToGroupReservation } from "@/lib/group-reservations/mapper";
import { mapDbGroupTimelineEventToGroupTimelineEvent } from "@/lib/group-reservations/timeline-mapper";
import {
  computeMasterFolioBalance,
  mapDbFolioEntriesToSettlement,
} from "@/lib/folio/master-folio-balance";
import { recordGroupTimelineEvent } from "@/lib/group-reservations/timeline";
import { sessionHasPermission } from "@/lib/auth/permissions";
import {
  notifyBlockExpiring,
  notifyBlockReleased,
  notifyCorporateCreditLimitReached,
  notifyLargeGroupArrival,
} from "@/lib/notifications/group-notifications";
import type { IActivityLogRepository } from "@/repositories/activity-log.repository";
import type { ICorporateAccountRepository } from "@/repositories/corporate-account.repository";
import type { IGroupReservationRepository } from "@/repositories/group-reservation.repository";
import type { IGroupTimelineRepository } from "@/repositories/group-timeline.repository";
import type { IGuestFolioRepository } from "@/repositories/guest-folio.repository";
import type { INotificationRepository } from "@/repositories/notification.repository";
import type { IReservationBlockRepository } from "@/repositories/reservation-block.repository";
import type { IReservationRepository } from "@/repositories/reservation.repository";
import type { AuthSession } from "@/services/auth.service";
import type { IReservationService } from "@/services/reservation.service";
import { ServiceError } from "@/services/types";
import type { ServiceContext } from "@/services/types";
import { ActivityActionCodes } from "@/types/database/enums";
import type {
  CreateGroupInput,
  GroupFinancialSummary,
  GroupReservation,
  GroupReservationSummary,
  GroupSearchFilters,
  UpdateGroupInput,
} from "@/types/group-reservation";
import type { DbReservationStatus } from "@/types/database";
import type { ReservationFormValues, ReservationStatus } from "@/types/reservation";
import type { CreateReservationBlockInput } from "@/types/reservation-block";
import type { GroupTimelineEvent } from "@/types/group-timeline";
import type { IGroupReservationService } from "@/services/group-reservation.service.types";

export type { IGroupReservationService };

function toReservationStatus(status: DbReservationStatus): ReservationStatus {
  if (status === "completed") return "checked_out";
  return status as ReservationStatus;
}

export class GroupReservationService implements IGroupReservationService {
  constructor(
    private readonly groups: IGroupReservationRepository,
    private readonly reservations: IReservationRepository,
    private readonly reservationService: IReservationService,
    private readonly blocks: IReservationBlockRepository,
    private readonly folios: IGuestFolioRepository,
    private readonly timeline: IGroupTimelineRepository,
    private readonly corporateAccounts: ICorporateAccountRepository,
    private readonly activityLogs: IActivityLogRepository,
    private readonly notifications?: INotificationRepository
  ) {}

  private require(session: AuthSession, action: "view" | "create" | "edit" | "delete" | "manage"): void {
    if (!sessionHasPermission(session, "group_reservations", action)) {
      throw new ServiceError(
        `Forbidden: missing permission group_reservations.${action}`,
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
      entityId: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<void> {
    await this.activityLogs.create({
      userId: ctx.userId,
      userName: session.fullName,
      action: input.action,
      actionCode: input.actionCode,
      module: "group_reservations",
      entityType: "group_reservation",
      entityId: input.entityId,
      metadata: input.metadata ?? {},
      status: "success",
    });
  }

  private mapGroup(row: Awaited<ReturnType<IGroupReservationRepository["getById"]>>): GroupReservation {
    if (!row) {
      throw new ServiceError("Group reservation not found.", "NOT_FOUND", 404);
    }
    return mapDbGroupReservationToGroupReservation(row);
  }

  private validateDates(arrival: string, departure: string): void {
    if (!arrival || !departure || departure <= arrival) {
      throw new ServiceError("Departure must be after arrival.", "VALIDATION", 400);
    }
  }

  private async syncGroupCounts(groupId: string): Promise<void> {
    const reservations = await this.groups.listReservations(groupId);
    const actualRooms = reservations.filter(
      (r) => r.status !== "cancelled" && r.status !== "no_show"
    ).length;
    const actualGuests = reservations.reduce(
      (sum, r) => sum + Number(r.adults ?? 0) + Number(r.children ?? 0),
      0
    );
    await this.groups.update(groupId, {
      actual_rooms: actualRooms,
      actual_guests: actualGuests,
    });
  }

  private async assertGroupEditable(groupId: string) {
    const group = await this.groups.getById(groupId);
    if (!group) throw new ServiceError("Group not found.", "NOT_FOUND", 404);
    if (group.status === "cancelled" || group.status === "closed") {
      throw new ServiceError("Group is closed or cancelled.", "VALIDATION", 400);
    }
    return group;
  }

  async createGroup(
    ctx: ServiceContext,
    session: AuthSession,
    input: CreateGroupInput
  ): Promise<GroupReservation> {
    this.require(session, "create");
    this.validateDates(input.arrivalDate, input.departureDate);

    const row = await this.groups.create({
      group_name: input.groupName.trim(),
      group_type: input.groupType,
      status: "draft",
      billing_policy: input.billingPolicy,
      corporate_account_id: input.corporateAccountId ?? null,
      master_reservation_id: null,
      arrival_date: input.arrivalDate,
      departure_date: input.departureDate,
      expected_rooms: input.expectedRooms ?? 0,
      expected_guests: input.expectedGuests ?? 0,
      actual_rooms: 0,
      actual_guests: 0,
      notes: input.notes?.trim() || null,
      created_by: ctx.userId,
    });

    await recordGroupTimelineEvent(this.timeline, {
      groupReservationId: row.id,
      eventType: "group_created",
      description: `Group ${row.group_number} created: ${row.group_name}`,
      staffId: ctx.userId,
      staffName: session.fullName,
    });

    await this.log(ctx, session, {
      action: `Group created: ${row.group_number}`,
      actionCode: ActivityActionCodes.GROUP_CREATED,
      entityId: row.id,
      metadata: { group_number: row.group_number },
    });

    if (this.notifications && (input.expectedRooms ?? 0) >= 10) {
      await notifyLargeGroupArrival(this.notifications, {
        groupId: row.id,
        groupNumber: row.group_number,
        groupName: row.group_name,
        expectedRooms: input.expectedRooms ?? 0,
        arrivalDate: input.arrivalDate,
      });
    }

    return mapDbGroupReservationToGroupReservation(row);
  }

  async updateGroup(
    ctx: ServiceContext,
    session: AuthSession,
    id: string,
    input: UpdateGroupInput
  ): Promise<GroupReservation> {
    this.require(session, "edit");
    await this.assertGroupEditable(id);

    const patch: Parameters<IGroupReservationRepository["update"]>[1] = {};
    if (input.groupName !== undefined) patch.group_name = input.groupName.trim();
    if (input.groupType !== undefined) patch.group_type = input.groupType;
    if (input.billingPolicy !== undefined) patch.billing_policy = input.billingPolicy;
    if (input.corporateAccountId !== undefined) {
      patch.corporate_account_id = input.corporateAccountId;
    }
    if (input.arrivalDate !== undefined) patch.arrival_date = input.arrivalDate;
    if (input.departureDate !== undefined) patch.departure_date = input.departureDate;
    if (input.expectedRooms !== undefined) patch.expected_rooms = input.expectedRooms;
    if (input.expectedGuests !== undefined) patch.expected_guests = input.expectedGuests;
    if (input.notes !== undefined) patch.notes = input.notes?.trim() || null;
    if (input.status !== undefined) patch.status = input.status;

    if (patch.arrival_date && patch.departure_date) {
      this.validateDates(patch.arrival_date, patch.departure_date);
    }

    const row = await this.groups.update(id, patch);

    if (input.corporateAccountId !== undefined) {
      await recordGroupTimelineEvent(this.timeline, {
        groupReservationId: id,
        eventType: "company_updated",
        description: "Corporate account link updated",
        staffId: ctx.userId,
        staffName: session.fullName,
        entityType: "corporate_account",
        entityId: input.corporateAccountId,
      });
    }

    await this.log(ctx, session, {
      action: `Group updated: ${row.group_number}`,
      actionCode: ActivityActionCodes.GROUP_UPDATED,
      entityId: row.id,
    });

    return mapDbGroupReservationToGroupReservation(row);
  }

  async cancelGroup(
    ctx: ServiceContext,
    session: AuthSession,
    id: string,
    reason?: string
  ): Promise<GroupReservation> {
    this.require(session, "manage");
    const group = await this.assertGroupEditable(id);
    const childReservations = await this.groups.listReservations(id);

    for (const reservation of childReservations) {
      if (reservation.status !== "cancelled" && reservation.status !== "checked_out") {
        await this.reservationService.cancelReservation(
          ctx,
          session,
          reservation.id,
          reason ?? `Group ${group.group_number} cancelled`
        );
      }
    }

    const row = await this.groups.update(id, { status: "cancelled" });

    await recordGroupTimelineEvent(this.timeline, {
      groupReservationId: id,
      eventType: "group_cancelled",
      description: reason?.trim() || `Group ${row.group_number} cancelled`,
      staffId: ctx.userId,
      staffName: session.fullName,
      metadata: { reason: reason ?? null },
    });

    await this.log(ctx, session, {
      action: `Group cancelled: ${row.group_number}`,
      actionCode: ActivityActionCodes.GROUP_CANCELLED,
      entityId: row.id,
    });

    return mapDbGroupReservationToGroupReservation(row);
  }

  async closeGroup(
    ctx: ServiceContext,
    session: AuthSession,
    id: string
  ): Promise<GroupReservation> {
    this.require(session, "manage");
    await this.assertGroupEditable(id);
    const row = await this.groups.update(id, { status: "closed" });

    await recordGroupTimelineEvent(this.timeline, {
      groupReservationId: id,
      eventType: "group_closed",
      description: `Group ${row.group_number} closed`,
      staffId: ctx.userId,
      staffName: session.fullName,
    });

    await this.log(ctx, session, {
      action: `Group closed: ${row.group_number}`,
      actionCode: ActivityActionCodes.GROUP_CLOSED,
      entityId: row.id,
    });

    return mapDbGroupReservationToGroupReservation(row);
  }

  async confirmGroup(
    ctx: ServiceContext,
    session: AuthSession,
    id: string
  ): Promise<GroupReservation> {
    this.require(session, "edit");
    await this.assertGroupEditable(id);
    const row = await this.groups.update(id, { status: "confirmed" });

    await recordGroupTimelineEvent(this.timeline, {
      groupReservationId: id,
      eventType: "group_confirmed",
      description: `Group ${row.group_number} confirmed`,
      staffId: ctx.userId,
      staffName: session.fullName,
    });

    await this.log(ctx, session, {
      action: `Group confirmed: ${row.group_number}`,
      actionCode: ActivityActionCodes.GROUP_UPDATED,
      entityId: row.id,
      metadata: { status: "confirmed" },
    });

    return mapDbGroupReservationToGroupReservation(row);
  }

  async getGroup(
    ctx: ServiceContext,
    session: AuthSession,
    id: string
  ): Promise<GroupReservation | null> {
    this.require(session, "view");
    const row = await this.groups.getById(id);
    return row ? mapDbGroupReservationToGroupReservation(row) : null;
  }

  async getGroups(
    ctx: ServiceContext,
    session: AuthSession,
    filters?: GroupSearchFilters
  ): Promise<GroupReservation[]> {
    this.require(session, "view");
    const rows = await this.groups.list(filters);
    return rows.map(mapDbGroupReservationToGroupReservation);
  }

  async getSummary(
    ctx: ServiceContext,
    session: AuthSession,
    id: string
  ): Promise<GroupReservationSummary | null> {
    this.require(session, "view");
    const row = await this.groups.getById(id);
    if (!row) return null;

    const counts = await this.groups.countReservationsByStatus(id);
    const blockRows = await this.blocks.listByGroup(id);
    let corporateAccountName: string | null = null;
    if (row.corporate_account_id) {
      const corp = await this.corporateAccounts.getById(row.corporate_account_id);
      corporateAccountName = corp?.company_name ?? null;
    }

    return {
      group: mapDbGroupReservationToGroupReservation(row),
      reservationCount: counts.total,
      blockCount: blockRows.filter((b) => b.status === "blocked").length,
      checkedInCount: counts.checkedIn,
      checkedOutCount: counts.checkedOut,
      corporateAccountName,
    };
  }

  async getFinancialSummary(
    ctx: ServiceContext,
    session: AuthSession,
    id: string
  ): Promise<GroupFinancialSummary | null> {
    this.require(session, "view");
    const group = await this.groups.getById(id);
    if (!group) return null;

    let masterFolioId: string | null = null;
    let masterEntries = mapDbFolioEntriesToSettlement([]);
    const childEntriesList: ReturnType<typeof mapDbFolioEntriesToSettlement>[] = [];

    if (group.master_reservation_id) {
      const masterFolio = await this.folios.getByReservationId(group.master_reservation_id);
      if (masterFolio) {
        masterFolioId = masterFolio.id;
        masterEntries = mapDbFolioEntriesToSettlement(masterFolio.entries ?? []);
        const children = await this.folios.listChildFolios(masterFolio.id);
        for (const child of children) {
          childEntriesList.push(mapDbFolioEntriesToSettlement(child.entries ?? []));
        }
      }
    } else {
      const reservations = await this.groups.listReservations(id);
      for (const reservation of reservations) {
        const folio = await this.folios.getByReservationId(reservation.id);
        if (folio) {
          childEntriesList.push(mapDbFolioEntriesToSettlement(folio.entries ?? []));
        }
      }
    }

    const balance = computeMasterFolioBalance(masterEntries, childEntriesList);

    if (group.corporate_account_id && this.notifications) {
      const corp = await this.corporateAccounts.getById(group.corporate_account_id);
      if (
        corp?.credit_limit != null &&
        balance.outstandingBalance > Number(corp.credit_limit)
      ) {
        await notifyCorporateCreditLimitReached(this.notifications, {
          corporateAccountId: corp.id,
          companyName: corp.company_name,
          outstandingBalance: balance.outstandingBalance,
          creditLimit: Number(corp.credit_limit),
        });
      }
    }

    return {
      groupId: id,
      totalCharges: balance.totalCharges,
      totalPayments: balance.totalPayments,
      outstandingBalance: balance.outstandingBalance,
      masterFolioId,
      childFolioCount: childEntriesList.length,
    };
  }

  async addReservation(
    ctx: ServiceContext,
    session: AuthSession,
    groupId: string,
    values: ReservationFormValues,
    options?: { setAsMaster?: boolean }
  ): Promise<GroupReservation> {
    this.require(session, "edit");
    const group = await this.assertGroupEditable(groupId);

    const reservation = await this.reservationService.createReservation(ctx, session, {
      ...values,
      checkInDate: values.checkInDate || group.arrival_date,
      checkOutDate: values.checkOutDate || group.departure_date,
      status: values.status ?? "confirmed",
    });

    await this.reservations.update(reservation.id, {
      group_reservation_id: groupId,
    });

    if (options?.setAsMaster || !group.master_reservation_id) {
      await this.groups.update(groupId, { master_reservation_id: reservation.id });
    }

    await this.syncGroupCounts(groupId);

    await recordGroupTimelineEvent(this.timeline, {
      groupReservationId: groupId,
      eventType: "reservation_added",
      description: `Reservation ${reservation.reservationNumber} added to group`,
      staffId: ctx.userId,
      staffName: session.fullName,
      entityType: "reservation",
      entityId: reservation.id,
      metadata: { reservation_number: reservation.reservationNumber },
    });

    await this.log(ctx, session, {
      action: `Reservation added to group ${group.group_number}`,
      actionCode: ActivityActionCodes.GROUP_ROOM_ADDED,
      entityId: groupId,
      metadata: { reservation_id: reservation.id },
    });

    const row = await this.groups.getById(groupId);
    return this.mapGroup(row);
  }

  async removeReservation(
    ctx: ServiceContext,
    session: AuthSession,
    groupId: string,
    reservationId: string,
    reason?: string
  ): Promise<GroupReservation> {
    this.require(session, "edit");
    const group = await this.assertGroupEditable(groupId);

    await this.reservationService.cancelReservation(
      ctx,
      session,
      reservationId,
      reason ?? `Removed from group ${group.group_number}`
    );

    if (group.master_reservation_id === reservationId) {
      const remaining = (await this.groups.listReservations(groupId)).filter(
        (r) => r.id !== reservationId && r.status !== "cancelled"
      );
      await this.groups.update(groupId, {
        master_reservation_id: remaining[0]?.id ?? null,
      });
    }

    await this.reservations.update(reservationId, { group_reservation_id: null });
    await this.syncGroupCounts(groupId);

    await recordGroupTimelineEvent(this.timeline, {
      groupReservationId: groupId,
      eventType: "reservation_removed",
      description: reason?.trim() || "Reservation removed from group",
      staffId: ctx.userId,
      staffName: session.fullName,
      entityType: "reservation",
      entityId: reservationId,
    });

    await this.log(ctx, session, {
      action: `Reservation removed from group ${group.group_number}`,
      actionCode: ActivityActionCodes.GROUP_ROOM_REMOVED,
      entityId: groupId,
      metadata: { reservation_id: reservationId },
    });

    const row = await this.groups.getById(groupId);
    return this.mapGroup(row);
  }

  async assignRoom(
    ctx: ServiceContext,
    session: AuthSession,
    groupId: string,
    reservationId: string,
    roomNumber: string
  ): Promise<GroupReservation> {
    return this.moveReservation(ctx, session, groupId, reservationId, roomNumber);
  }

  async assignGuest(
    ctx: ServiceContext,
    session: AuthSession,
    groupId: string,
    reservationId: string,
    values: Pick<ReservationFormValues, "guestName" | "guestPhone" | "guestEmail">
  ): Promise<GroupReservation> {
    this.require(session, "edit");
    await this.assertGroupEditable(groupId);

    const existing = await this.reservations.getById(reservationId);
    if (!existing || existing.group_reservation_id !== groupId) {
      throw new ServiceError("Reservation not in this group.", "NOT_FOUND", 404);
    }

    await this.reservationService.updateReservation(ctx, session, reservationId, {
      guestName: values.guestName,
      guestPhone: values.guestPhone,
      guestEmail: values.guestEmail,
      roomNumber: existing.room?.room_number ?? "",
      checkInDate: existing.check_in_date,
      checkOutDate: existing.check_out_date,
      adults: existing.adults,
      children: existing.children,
      bookingSource: existing.booking_source,
      status: toReservationStatus(existing.status),
    });

    await recordGroupTimelineEvent(this.timeline, {
      groupReservationId: groupId,
      eventType: "guest_assigned",
      description: `Guest assigned: ${values.guestName}`,
      staffId: ctx.userId,
      staffName: session.fullName,
      entityType: "reservation",
      entityId: reservationId,
    });

    await this.log(ctx, session, {
      action: "Guest assigned to group reservation",
      actionCode: ActivityActionCodes.GROUP_GUEST_ADDED,
      entityId: groupId,
      metadata: { reservation_id: reservationId },
    });

    const row = await this.groups.getById(groupId);
    return this.mapGroup(row);
  }

  async moveReservation(
    ctx: ServiceContext,
    session: AuthSession,
    groupId: string,
    reservationId: string,
    roomNumber: string
  ): Promise<GroupReservation> {
    this.require(session, "edit");
    await this.assertGroupEditable(groupId);

    const existing = await this.reservations.getById(reservationId);
    if (!existing || existing.group_reservation_id !== groupId) {
      throw new ServiceError("Reservation not in this group.", "NOT_FOUND", 404);
    }

    await this.reservationService.updateReservation(ctx, session, reservationId, {
      guestName: existing.guest?.full_name ?? "",
      guestPhone: existing.guest?.phone ?? "",
      guestEmail: existing.guest?.email ?? "",
      roomNumber,
      checkInDate: existing.check_in_date,
      checkOutDate: existing.check_out_date,
      adults: existing.adults,
      children: existing.children,
      bookingSource: existing.booking_source,
      status: toReservationStatus(existing.status),
    });

    await recordGroupTimelineEvent(this.timeline, {
      groupReservationId: groupId,
      eventType: "room_changed",
      description: `Room changed to ${roomNumber}`,
      staffId: ctx.userId,
      staffName: session.fullName,
      entityType: "reservation",
      entityId: reservationId,
      metadata: { room_number: roomNumber },
    });

    await this.log(ctx, session, {
      action: "Group reservation room changed",
      actionCode: ActivityActionCodes.GROUP_ROOM_ASSIGNED,
      entityId: groupId,
      metadata: { reservation_id: reservationId, room_number: roomNumber },
    });

    const row = await this.groups.getById(groupId);
    return this.mapGroup(row);
  }

  async changeDates(
    ctx: ServiceContext,
    session: AuthSession,
    groupId: string,
    reservationId: string,
    checkInDate: string,
    checkOutDate: string
  ): Promise<GroupReservation> {
    this.require(session, "edit");
    await this.assertGroupEditable(groupId);

    const existing = await this.reservations.getById(reservationId);
    if (!existing || existing.group_reservation_id !== groupId) {
      throw new ServiceError("Reservation not in this group.", "NOT_FOUND", 404);
    }

    await this.reservationService.updateReservation(ctx, session, reservationId, {
      guestName: existing.guest?.full_name ?? "",
      guestPhone: existing.guest?.phone ?? "",
      guestEmail: existing.guest?.email ?? "",
      roomNumber: existing.room?.room_number ?? "",
      checkInDate,
      checkOutDate,
      adults: existing.adults,
      children: existing.children,
      bookingSource: existing.booking_source,
      status: toReservationStatus(existing.status),
    });

    await recordGroupTimelineEvent(this.timeline, {
      groupReservationId: groupId,
      eventType: "room_changed",
      description: `Stay dates changed: ${checkInDate} → ${checkOutDate}`,
      staffId: ctx.userId,
      staffName: session.fullName,
      entityType: "reservation",
      entityId: reservationId,
    });

    const row = await this.groups.getById(groupId);
    return this.mapGroup(row);
  }

  async createBlock(
    ctx: ServiceContext,
    session: AuthSession,
    input: CreateReservationBlockInput
  ): Promise<GroupReservation> {
    this.require(session, "create");
    const group = await this.assertGroupEditable(input.groupReservationId);

    const block = await this.blocks.create({
      group_reservation_id: input.groupReservationId,
      room_id: input.roomId,
      room_type_id: input.roomTypeId,
      hold_until: input.holdUntil,
      status: "blocked",
      created_by: ctx.userId,
    });

    await recordGroupTimelineEvent(this.timeline, {
      groupReservationId: input.groupReservationId,
      eventType: "block_created",
      description: `Room block created until ${input.holdUntil}`,
      staffId: ctx.userId,
      staffName: session.fullName,
      entityType: "reservation_block",
      entityId: block.id,
    });

    await this.log(ctx, session, {
      action: `Room block created for group ${group.group_number}`,
      actionCode: ActivityActionCodes.GROUP_ROOM_ADDED,
      entityId: group.id,
      metadata: { block_id: block.id },
    });

    if (this.notifications) {
      await notifyBlockExpiring(this.notifications, {
        groupId: group.id,
        groupNumber: group.group_number,
        holdUntil: input.holdUntil,
        blockId: block.id,
      });
    }

    const row = await this.groups.getById(input.groupReservationId);
    return this.mapGroup(row);
  }

  async releaseExpiredBlocks(ctx: ServiceContext, session: AuthSession): Promise<number> {
    this.require(session, "edit");
    const expired = await this.blocks.listExpiredBlocks();
    let released = 0;

    for (const block of expired) {
      const now = new Date().toISOString();
      await this.blocks.update(block.id, {
        status: "expired",
        released_at: now,
      });

      const group = await this.groups.getById(block.group_reservation_id);
      if (group) {
        await recordGroupTimelineEvent(this.timeline, {
          groupReservationId: block.group_reservation_id,
          eventType: "block_expired",
          description: "Reservation block expired and released",
          staffId: ctx.userId,
          staffName: session.fullName,
          entityType: "reservation_block",
          entityId: block.id,
        });

        await this.log(ctx, session, {
          action: `Block expired for group ${group.group_number}`,
          actionCode: ActivityActionCodes.GROUP_ROOM_REMOVED,
          entityId: group.id,
          metadata: { block_id: block.id },
        });

        if (this.notifications) {
          await notifyBlockReleased(this.notifications, {
            groupId: group.id,
            groupNumber: group.group_number,
            blockId: block.id,
          });
        }
      }
      released += 1;
    }

    return released;
  }

  async getTimeline(
    ctx: ServiceContext,
    session: AuthSession,
    groupId: string
  ): Promise<GroupTimelineEvent[]> {
    this.require(session, "view");
    const rows = await this.timeline.listByGroup(groupId);
    return rows.map(mapDbGroupTimelineEventToGroupTimelineEvent);
  }

  async linkChildFolioToMaster(
    ctx: ServiceContext,
    session: AuthSession,
    groupId: string,
    childFolioId: string,
    masterFolioId: string
  ): Promise<void> {
    this.require(session, "edit");
    await this.assertGroupEditable(groupId);
    await this.folios.setParentFolio(childFolioId, masterFolioId);

    await recordGroupTimelineEvent(this.timeline, {
      groupReservationId: groupId,
      eventType: "room_assigned",
      description: "Child folio linked to master folio",
      staffId: ctx.userId,
      staffName: session.fullName,
      entityType: "guest_folio",
      entityId: childFolioId,
      metadata: { master_folio_id: masterFolioId },
    });
  }
}
