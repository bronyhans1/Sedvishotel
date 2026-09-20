import { evaluateOverstayChargeDecision } from "@/lib/reservations/overstay-fee";
import {
  buildOverstayFolioDescription,
  buildOverstaySourceReference,
  resolveOverstayStatus,
} from "@/lib/reservations/overstay-status";
import { mapDbReservationToReservation } from "@/lib/reservations/mapper";
import { loadOverstayPolicy } from "@/lib/settings/checkout-policy";
import { nightsBetween } from "@/lib/utils";
import { sessionHasPermission } from "@/lib/auth/permissions";
import type { IActivityLogRepository } from "@/repositories/activity-log.repository";
import type { IOverstayChargeRepository } from "@/repositories/overstay-charge.repository";
import type { IReservationRepository } from "@/repositories/reservation.repository";
import type { AuthSession } from "@/services/auth.service";
import type { GuestFolioService } from "@/services/guest-folio.service";
import { ServiceError } from "@/services/types";
import type { ServiceContext } from "@/services/types";
import { ActivityActionCodes } from "@/types/database/enums";
import type { DbOverstayCharge } from "@/types/database";
import type {
  OverstayCharge,
  OverstayNightAuditWarning,
  OverstayPolicy,
  OverstayProcessResult,
} from "@/types/overstay";

function mapCharge(row: DbOverstayCharge): OverstayCharge {
  const snap = row.policy_snapshot ?? {};
  return {
    id: row.id,
    reservationId: row.reservation_id,
    businessDate: row.business_date,
    roomNumber: row.room_number,
    chargeMode: row.charge_mode as OverstayCharge["chargeMode"],
    status: row.status,
    amount: Number(row.amount),
    currency: row.currency,
    nightRate: Number(row.night_rate),
    overstayDays: row.overstay_days,
    policySnapshot: {
      chargeMode: (snap.chargeMode as OverstayPolicy["chargeMode"]) ?? "none",
      managerApprovalRequired: Boolean(snap.managerApprovalRequired),
      allowManualWaiver: snap.allowManualWaiver !== false,
      autoCreatePendingCharge: snap.autoCreatePendingCharge !== false,
      nightAuditMode:
        (snap.nightAuditMode as OverstayPolicy["nightAuditMode"]) ?? "acknowledge",
    },
    folioEntryId: row.folio_entry_id,
    sourceReference: row.source_reference,
    decisionNotes: row.decision_notes,
    createdById: row.created_by,
    approvedById: row.approved_by,
    approvedAt: row.approved_at,
    waivedById: row.waived_by,
    waivedAt: row.waived_at,
    rejectedById: row.rejected_by,
    rejectedAt: row.rejected_at,
    postedAt: row.posted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Overstay Engine — revenue recovery on Business Date advance.
 * Reuses GuestFolioService posting; does not duplicate accommodation math engines.
 */
export class OverstayService {
  constructor(
    private readonly charges: IOverstayChargeRepository,
    private readonly reservations: IReservationRepository,
    private readonly folios: GuestFolioService,
    private readonly activityLogs: IActivityLogRepository
  ) {}

  private requireManage(session: AuthSession) {
    if (!sessionHasPermission(session, "check_out", "manage")) {
      throw new ServiceError(
        "Manager permission required (check_out.manage).",
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
      entityId?: string | null;
      metadata?: Record<string, unknown>;
    }
  ) {
    await this.activityLogs.create({
      userId: ctx.userId,
      userName: session.fullName,
      action: input.action,
      actionCode: input.actionCode,
      module: "reservations",
      entityType: "overstay_charge",
      entityId: input.entityId ?? undefined,
      status: "success",
      metadata: input.metadata ?? {},
    });
  }

  async getChargesForReservation(
    reservationId: string
  ): Promise<OverstayCharge[]> {
    const rows = await this.charges.listByReservation(reservationId);
    return rows.map(mapCharge);
  }

  async getLatestChargeForReservation(
    reservationId: string
  ): Promise<OverstayCharge | null> {
    const rows = await this.charges.listByReservation(reservationId);
    if (rows.length === 0) return null;
    return mapCharge(rows[rows.length - 1]!);
  }

  async getChargeForBusinessDate(
    reservationId: string,
    businessDate: string
  ): Promise<OverstayCharge | null> {
    const row = await this.charges.getByReservationAndBusinessDate(
      reservationId,
      businessDate
    );
    return row ? mapCharge(row) : null;
  }

  async listPendingCharges(): Promise<OverstayCharge[]> {
    return (await this.charges.listPending()).map(mapCharge);
  }

  async listAllCharges(): Promise<OverstayCharge[]> {
    return (await this.charges.listAll()).map(mapCharge);
  }

  /**
   * Night Audit pre-close warning — policy-driven, not hardcoded block.
   * Prefetched reservations (same shape as reservations.getAll) skip a duplicate fetch.
   */
  async buildNightAuditWarning(
    businessDate: string,
    prefetchedReservations?: Awaited<
      ReturnType<IReservationRepository["getAll"]>
    >
  ): Promise<OverstayNightAuditWarning> {
    const policy = await loadOverstayPolicy();
    const all =
      prefetchedReservations !== undefined
        ? prefetchedReservations
        : await this.reservations.getAll();
    const checkedIn = all
      .map(mapDbReservationToReservation)
      .filter((r) => r.status === "checked_in");

    const activeOverstayCount = checkedIn.filter(
      (r) => r.checkOutDate < businessDate
    ).length;
    const projectedOverstayCount = checkedIn.filter(
      (r) => r.checkOutDate === businessDate
    ).length;
    const total = activeOverstayCount + projectedOverstayCount;

    return {
      activeOverstayCount,
      projectedOverstayCount,
      mode: policy.nightAuditMode,
      message:
        total > 0
          ? `There are ${total} active Overstay${total === 1 ? "" : "s"} (${activeOverstayCount} current, ${projectedOverstayCount} projected on day close).`
          : "No active Overstays.",
      requiresAcknowledgement:
        total > 0 &&
        (policy.nightAuditMode === "acknowledge" ||
          policy.nightAuditMode === "require_manager"),
      requiresManager: total > 0 && policy.nightAuditMode === "require_manager",
    };
  }

  /**
   * Evaluate all checked-in overstays for a Business Date (after BD advance or recovery retry).
   * Fully idempotent: existing (reservation, businessDate) rows are never duplicated.
   */
  async processBusinessDateCharges(
    ctx: ServiceContext,
    session: AuthSession,
    businessDate: string,
    options?: { policyCheckOutTime?: string }
  ): Promise<OverstayProcessResult> {
    const policy = await loadOverstayPolicy();
    const policyCheckOutTime = options?.policyCheckOutTime ?? "11:00";
    const all = await this.reservations.getAll();
    const checkedIn = all
      .map(mapDbReservationToReservation)
      .filter((r) => r.status === "checked_in");

    const result: OverstayProcessResult = {
      businessDate,
      evaluated: 0,
      created: 0,
      posted: 0,
      pending: 0,
      skipped: 0,
      alreadyHandled: 0,
      errors: [],
    };

    for (const reservation of checkedIn) {
      if (reservation.checkOutDate >= businessDate) continue;
      result.evaluated += 1;

      try {
        const outcome = await this.processSingleReservation(
          ctx,
          session,
          reservation.id,
          businessDate,
          policy,
          policyCheckOutTime
        );
        if (outcome === "already") result.alreadyHandled += 1;
        else if (outcome === "posted") {
          result.created += 1;
          result.posted += 1;
        } else if (outcome === "pending") {
          result.created += 1;
          result.pending += 1;
        } else if (outcome === "skipped") {
          result.created += 1;
          result.skipped += 1;
        }
      } catch (error) {
        result.errors.push({
          reservationId: reservation.id,
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    await this.log(ctx, session, {
      action: `Overstay evaluation for business date ${businessDate}`,
      actionCode: ActivityActionCodes.RESERVATION_OVERSTAY_EVALUATED,
      metadata: {
        business_date: businessDate,
        ...result,
        policy,
      },
    });

    return result;
  }

  private async processSingleReservation(
    ctx: ServiceContext,
    session: AuthSession,
    reservationId: string,
    businessDate: string,
    policy: OverstayPolicy,
    policyCheckOutTime: string
  ): Promise<"already" | "posted" | "pending" | "skipped"> {
    const existing = await this.charges.getByReservationAndBusinessDate(
      reservationId,
      businessDate
    );
    if (existing) {
      if (existing.status === "approved") {
        await this.postApprovedCharge(ctx, session, mapCharge(existing));
      }
      return "already";
    }

    const row = await this.reservations.getById(reservationId);
    if (!row || row.status !== "checked_in") return "skipped";
    const reservation = mapDbReservationToReservation(row);

    const hasPrior = await this.charges.hasAnyForReservation(reservationId, [
      "rejected",
    ]);

    const decision = evaluateOverstayChargeDecision({
      policy,
      nightRate: reservation.chargedRate || reservation.rackRate || 0,
      hasPriorOverstayCharge: hasPrior,
      alreadyHandledForBusinessDate: false,
    });

    const sourceReference = buildOverstaySourceReference(
      reservationId,
      businessDate
    );
    const overstayDays = Math.max(
      1,
      nightsBetween(reservation.checkOutDate, businessDate)
    );
    const nightRate = reservation.chargedRate || reservation.rackRate || 0;

    if (decision.action === "skip") {
      if (policy.chargeMode === "none") {
        try {
          const created = await this.charges.create({
            reservationId,
            businessDate,
            roomNumber: reservation.roomNumber,
            chargeMode: policy.chargeMode,
            status: "skipped",
            amount: 0,
            currency: "GHS",
            nightRate,
            overstayDays,
            policySnapshot: { ...policy },
            sourceReference,
            decisionNotes: decision.reason,
            createdBy: ctx.userId,
          });
          await this.log(ctx, session, {
            action: `Overstay skipped (no automatic charge) — Room ${reservation.roomNumber}`,
            actionCode: ActivityActionCodes.RESERVATION_OVERSTAY_CHARGE_CREATED,
            entityId: created.id,
            metadata: {
              business_date: businessDate,
              reservation_id: reservationId,
              room: reservation.roomNumber,
              policy,
              decision: decision.reason,
              amount: 0,
            },
          });
        } catch {
          return "already";
        }
        return "skipped";
      }
      return "skipped";
    }

    const amount = decision.amount;

    let created: DbOverstayCharge;
    try {
      created = await this.charges.create({
        reservationId,
        businessDate,
        roomNumber: reservation.roomNumber,
        chargeMode: policy.chargeMode,
        status: "pending",
        amount,
        currency: "GHS",
        nightRate,
        overstayDays,
        policySnapshot: { ...policy },
        sourceReference,
        decisionNotes: decision.reason,
        createdBy: ctx.userId,
      });
    } catch {
      return "already";
    }

    await this.log(ctx, session, {
      action: `Overstay charge ${decision.action} — Room ${reservation.roomNumber}`,
      actionCode: ActivityActionCodes.RESERVATION_OVERSTAY_CHARGE_CREATED,
      entityId: created.id,
      metadata: {
        business_date: businessDate,
        reservation_id: reservationId,
        room: reservation.roomNumber,
        policy,
        decision: decision.reason,
        amount,
        status: decision.action,
      },
    });

    if (decision.action === "pending") {
      return "pending";
    }

    // Create as pending then immediately post (status machine clarity + recovery)
    const description = buildOverstayFolioDescription({
      roomNumber: reservation.roomNumber,
      businessDate,
      nights: 1,
    });

    try {
      const entry = await this.folios.integrateOverstayCharge(
        ctx,
        session,
        reservationId,
        amount,
        sourceReference,
        description
      );
      await this.charges.update(created.id, {
        status: "posted",
        folioEntryId: entry?.id ?? null,
        postedAt: new Date().toISOString(),
      });
      await this.log(ctx, session, {
        action: `Overstay charge posted to folio — Room ${reservation.roomNumber}`,
        actionCode: ActivityActionCodes.RESERVATION_OVERSTAY_CHARGE_POSTED,
        entityId: created.id,
        metadata: {
          business_date: businessDate,
          reservation_id: reservationId,
          room: reservation.roomNumber,
          amount,
          folio_entry_id: entry?.id ?? null,
          source_reference: sourceReference,
        },
      });
      return "posted";
    } catch (error) {
      // Leave as pending for recovery / manager review
      await this.charges.update(created.id, {
        status: "pending",
        decisionNotes: `Post failed: ${
          error instanceof Error ? error.message : "unknown"
        }. Retry safe.`,
      });
      return "pending";
    }
  }

  private async postApprovedCharge(
    ctx: ServiceContext,
    session: AuthSession,
    charge: OverstayCharge
  ): Promise<void> {
    if (charge.status === "posted") return;
    const description = buildOverstayFolioDescription({
      roomNumber: charge.roomNumber ?? "—",
      businessDate: charge.businessDate,
      nights: 1,
    });
    const entry = await this.folios.integrateOverstayCharge(
      ctx,
      session,
      charge.reservationId,
      charge.amount,
      charge.sourceReference,
      description
    );
    await this.charges.update(charge.id, {
      status: "posted",
      folioEntryId: entry?.id ?? null,
      postedAt: new Date().toISOString(),
    });
  }

  async approveCharge(
    ctx: ServiceContext,
    session: AuthSession,
    chargeId: string,
    notes?: string
  ): Promise<OverstayCharge> {
    this.requireManage(session);
    const row = await this.findChargeOrThrow(chargeId);
    if (row.status !== "pending" && row.status !== "approved") {
      throw new ServiceError(
        `Cannot approve charge in status ${row.status}.`,
        "VALIDATION",
        400
      );
    }

    const now = new Date().toISOString();
    const updated = await this.charges.update(chargeId, {
      status: "approved",
      approvedBy: ctx.userId,
      approvedAt: now,
      decisionNotes: notes?.trim() || row.decision_notes,
    });

    await this.log(ctx, session, {
      action: `Overstay charge approved`,
      actionCode: ActivityActionCodes.RESERVATION_OVERSTAY_APPROVED,
      entityId: chargeId,
      metadata: {
        business_date: row.business_date,
        reservation_id: row.reservation_id,
        room: row.room_number,
        amount: Number(row.amount),
        approval: true,
        notes: notes ?? null,
      },
    });

    await this.postApprovedCharge(ctx, session, mapCharge(updated));
    const posted = await this.charges.getBySourceReference(row.source_reference);
    return mapCharge(posted ?? updated);
  }

  async rejectCharge(
    ctx: ServiceContext,
    session: AuthSession,
    chargeId: string,
    reason: string
  ): Promise<OverstayCharge> {
    this.requireManage(session);
    const row = await this.findChargeOrThrow(chargeId);
    if (row.status !== "pending") {
      throw new ServiceError(
        `Cannot reject charge in status ${row.status}.`,
        "VALIDATION",
        400
      );
    }
    const trimmed = reason.trim();
    if (!trimmed) {
      throw new ServiceError("Rejection reason is required.", "VALIDATION", 400);
    }

    const updated = await this.charges.update(chargeId, {
      status: "rejected",
      rejectedBy: ctx.userId,
      rejectedAt: new Date().toISOString(),
      decisionNotes: trimmed,
    });

    await this.log(ctx, session, {
      action: `Overstay charge rejected`,
      actionCode: ActivityActionCodes.RESERVATION_OVERSTAY_REJECTED,
      entityId: chargeId,
      metadata: {
        business_date: row.business_date,
        reservation_id: row.reservation_id,
        room: row.room_number,
        amount: Number(row.amount),
        approval: false,
        decision: trimmed,
      },
    });

    return mapCharge(updated);
  }

  async waiveCharge(
    ctx: ServiceContext,
    session: AuthSession,
    chargeId: string,
    reason: string
  ): Promise<OverstayCharge> {
    this.requireManage(session);
    const policy = await loadOverstayPolicy();
    if (!policy.allowManualWaiver) {
      throw new ServiceError(
        "Manual waiver is disabled in Hotel Policy.",
        "VALIDATION",
        400
      );
    }

    const row = await this.findChargeOrThrow(chargeId);
    if (row.status === "posted") {
      throw new ServiceError(
        "Posted charges cannot be waived here — use folio adjustments.",
        "VALIDATION",
        400
      );
    }
    if (row.status === "waived") {
      return mapCharge(row);
    }

    const trimmed = reason.trim();
    if (!trimmed) {
      throw new ServiceError("Waiver reason is required.", "VALIDATION", 400);
    }

    const updated = await this.charges.update(chargeId, {
      status: "waived",
      waivedBy: ctx.userId,
      waivedAt: new Date().toISOString(),
      decisionNotes: trimmed,
    });

    await this.log(ctx, session, {
      action: `Overstay charge waived`,
      actionCode: ActivityActionCodes.RESERVATION_OVERSTAY_WAIVED,
      entityId: chargeId,
      metadata: {
        business_date: row.business_date,
        reservation_id: row.reservation_id,
        room: row.room_number,
        amount: Number(row.amount),
        waiver: true,
        decision: trimmed,
        user: session.fullName,
      },
    });

    return mapCharge(updated);
  }

  /**
   * Create a manual pending/waived record from reception when auto-create is off
   * or for acknowledgement without charge.
   */
  async resolveStatusForReservation(
    reservationId: string,
    businessDate: string,
    policyCheckOutTime: string
  ) {
    const row = await this.reservations.getById(reservationId);
    if (!row) {
      throw new ServiceError("Reservation not found.", "NOT_FOUND", 404);
    }
    const reservation = mapDbReservationToReservation(row);
    const latest = await this.getLatestChargeForReservation(reservationId);
    return resolveOverstayStatus({
      status: reservation.status,
      checkInDate: reservation.checkInDate,
      scheduledCheckOutDate: reservation.checkOutDate,
      businessDate,
      policyCheckOutTime,
      chargeStatus: latest?.status ?? null,
    });
  }

  /**
   * Manager-initiated recovery evaluation for a single reservation (v2.4.1).
   * Reuses processSingleReservation — does not duplicate charge or policy logic.
   */
  async recoverReservationEvaluation(
    ctx: ServiceContext,
    session: AuthSession,
    reservationId: string,
    businessDate: string,
    options?: { policyCheckOutTime?: string }
  ): Promise<{
    outcome: "posted" | "pending" | "skipped" | "already" | "none";
    charge: OverstayCharge | null;
  }> {
    this.requireManage(session);
    const policy = await loadOverstayPolicy();
    const policyCheckOutTime = options?.policyCheckOutTime ?? "11:00";

    const existing = await this.charges.getByReservationAndBusinessDate(
      reservationId,
      businessDate
    );

    if (existing) {
      if (existing.status === "posted") {
        if (!existing.folio_entry_id) {
          const mapped = mapCharge(existing);
          const description = buildOverstayFolioDescription({
            roomNumber: mapped.roomNumber ?? "—",
            businessDate: mapped.businessDate,
            nights: 1,
          });
          const entry = await this.folios.integrateOverstayCharge(
            ctx,
            session,
            mapped.reservationId,
            mapped.amount,
            mapped.sourceReference,
            description
          );
          await this.charges.update(existing.id, {
            folioEntryId: entry?.id ?? null,
            postedAt: mapped.postedAt ?? new Date().toISOString(),
          });
          const posted = await this.charges.getBySourceReference(
            existing.source_reference
          );
          await this.log(ctx, session, {
            action: `Overstay recovery — re-posted missing folio integration`,
            actionCode: ActivityActionCodes.RESERVATION_OVERSTAY_RECOVERY_EVALUATED,
            entityId: existing.id,
            metadata: {
              business_date: businessDate,
              reservation_id: reservationId,
              recovery: true,
              outcome: "posted",
            },
          });
          return {
            outcome: "posted",
            charge: posted ? mapCharge(posted) : mapped,
          };
        }
        return { outcome: "already", charge: mapCharge(existing) };
      }

      if (existing.status === "pending") {
        throw new ServiceError(
          "Pending overstay charge — use Approve, Reject, or Waive instead of recovery.",
          "VALIDATION",
          400
        );
      }

      if (existing.status === "skipped") {
        const snapshot = existing.policy_snapshot ?? {};
        const evaluatedMode =
          (snapshot.chargeMode as OverstayPolicy["chargeMode"]) ?? "none";
        if (policy.chargeMode === "none") {
          throw new ServiceError(
            "Recovery not applicable — current policy is No Automatic Charge.",
            "VALIDATION",
            400
          );
        }
        if (evaluatedMode === policy.chargeMode) {
          throw new ServiceError(
            "Recovery not applicable — charge was intentionally skipped under current policy.",
            "VALIDATION",
            400
          );
        }
        const removed = await this.charges.deleteIfSkipped(existing.id);
        if (!removed) {
          throw new ServiceError(
            "Could not clear skipped ledger row for recovery.",
            "VALIDATION",
            400
          );
        }
      }

      if (existing.status === "waived" || existing.status === "rejected") {
        throw new ServiceError(
          `Recovery not applicable for ${existing.status} overstay charges.`,
          "VALIDATION",
          400
        );
      }

      if (existing.status === "approved") {
        await this.postApprovedCharge(ctx, session, mapCharge(existing));
        const posted = await this.charges.getBySourceReference(
          existing.source_reference
        );
        await this.log(ctx, session, {
          action: `Overstay recovery — posted approved charge to folio`,
          actionCode: ActivityActionCodes.RESERVATION_OVERSTAY_RECOVERY_EVALUATED,
          entityId: existing.id,
          metadata: {
            business_date: businessDate,
            reservation_id: reservationId,
            recovery: true,
            outcome: "posted",
          },
        });
        return {
          outcome: "posted",
          charge: posted ? mapCharge(posted) : mapCharge(existing),
        };
      }
    }

    if (policy.chargeMode === "none") {
      throw new ServiceError(
        "Recovery not applicable — current policy is No Automatic Charge.",
        "VALIDATION",
        400
      );
    }

    const outcome = await this.processSingleReservation(
      ctx,
      session,
      reservationId,
      businessDate,
      policy,
      policyCheckOutTime
    );

    const chargeRow = await this.charges.getByReservationAndBusinessDate(
      reservationId,
      businessDate
    );

    await this.log(ctx, session, {
      action: `Overstay recovery evaluation for business date ${businessDate}`,
      actionCode: ActivityActionCodes.RESERVATION_OVERSTAY_RECOVERY_EVALUATED,
      entityId: chargeRow?.id ?? null,
      metadata: {
        business_date: businessDate,
        reservation_id: reservationId,
        recovery: true,
        outcome,
        policy,
      },
    });

    return {
      outcome: outcome === "already" ? "already" : outcome,
      charge: chargeRow ? mapCharge(chargeRow) : null,
    };
  }

  private async findChargeOrThrow(chargeId: string): Promise<DbOverstayCharge> {
    const row = await this.charges.getById(chargeId);
    if (!row) {
      throw new ServiceError("Overstay charge not found.", "NOT_FOUND", 404);
    }
    return row;
  }
}
