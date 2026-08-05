import { getCurrentTimeString } from "@/lib/dates/time";
import {
  deriveBusinessDayHealth,
  deriveOperationalSmartWarnings,
  mapActivityLogsToTimeline,
} from "@/lib/operational-integrity/business-day-health";
import { getBusinessDayLockService, getCorrectionSessionService } from "@/lib/operational-integrity/get-lock-services";
import { loadLockPolicy } from "@/lib/settings/lock-policy";
import { countDepartureClassifications } from "@/lib/reservations/departure-classification";
import { loadCheckoutPolicy } from "@/lib/settings/checkout-policy";
import type { IActivityLogRepository } from "@/repositories/activity-log.repository";
import type { IReservationRepository } from "@/repositories/reservation.repository";
import type { IRoomRepository } from "@/repositories/room.repository";
import type { IShiftHandoverRepository } from "@/repositories/shift-handover.repository";
import { mapDbReservationToReservation } from "@/lib/reservations/mapper";
import type { NightAudit } from "@/types/night-audit";
import type { NightAuditCommandCenter } from "@/types/operational-integrity";
import { getOverstayService } from "@/lib/overstay/get-overstay-service";

export async function buildNightAuditCommandCenter(input: {
  businessDate: string;
  currentAudit: NightAudit | null;
  reservations: IReservationRepository;
  rooms: IRoomRepository;
  activityLogs: IActivityLogRepository;
  shiftHandovers: IShiftHandoverRepository;
}): Promise<NightAuditCommandCenter> {
  const [
    lockService,
    correctionService,
    overstayService,
    lockPolicy,
    checkoutPolicy,
    rooms,
    reservationRows,
    openShift,
    activityPage,
  ] = await Promise.all([
    getBusinessDayLockService(),
    getCorrectionSessionService(),
    getOverstayService(),
    loadLockPolicy(),
    loadCheckoutPolicy(),
    input.rooms.getAll(false),
    input.reservations.getAll(),
    input.shiftHandovers.getOpenShift(),
    input.activityLogs.findAll(
      {
        dateFrom: input.businessDate,
        dateTo: input.businessDate,
      },
      { page: 1, pageSize: 40 }
    ),
  ]);

  const dayClosed = await lockService.isBusinessDayClosed(input.businessDate);
  const correctionSession = await correctionService.getOpenSession(
    input.businessDate
  );
  const pendingCharges = (await overstayService.listPendingCharges()).filter(
    (c) => c.businessDate <= input.businessDate
  );

  const reservations = reservationRows.map(mapDbReservationToReservation);
  const departure = countDepartureClassifications(
    reservations,
    input.businessDate,
    checkoutPolicy.checkOutTime,
    getCurrentTimeString()
  );

  const expectedArrivals = reservations.filter(
    (r) =>
      (r.status === "confirmed" || r.status === "pending") &&
      r.checkInDate === input.businessDate
  ).length;

  const openMaintenanceBlocks = rooms.filter(
    (r) => r.status === "maintenance"
  ).length;
  const openHousekeepingIssues = rooms.filter(
    (r) => r.status === "cleaning"
  ).length;

  const outstandingCheckOuts =
    departure.expectedDepartures +
    departure.lateCheckOuts +
    departure.overstays;

  const hour = Number(getCurrentTimeString().slice(0, 2));
  const correctionOpenHours =
    correctionSession?.durationMinutes != null
      ? Math.round(correctionSession.durationMinutes / 60)
      : null;

  const health = deriveBusinessDayHealth({
    outstandingOverstays: departure.overstays,
    pendingOverstayApprovals: pendingCharges.length,
    openCorrectionSession: Boolean(correctionSession),
    housekeepingPending: openHousekeepingIssues,
    maintenanceBlocks: openMaintenanceBlocks,
    unbalancedShift: Boolean(
      openShift &&
        openShift.closing_cash != null &&
        Number(openShift.closing_cash) !== Number(openShift.cash_drawer_amount)
    ),
    nightAuditPending: input.currentAudit?.status === "open",
    missingCashCount:
      input.currentAudit?.status === "open" &&
      (input.currentAudit.cashCounted == null ||
        input.currentAudit.cashCounted === 0),
  });

  const warnings = deriveOperationalSmartWarnings({
    businessDate: input.businessDate,
    calendarHour: hour,
    warningHour: lockPolicy.businessDayOpenWarningHour,
    nightAuditOpen: input.currentAudit?.status === "open",
    correctionSessionOpenHours: correctionOpenHours,
    correctionMaxHours: lockPolicy.correctionSessionMaxHours,
    pendingApprovals: pendingCharges.length,
    outstandingOverstays: departure.overstays,
    outstandingCheckOuts,
  });

  const timeline = mapActivityLogsToTimeline(
    activityPage.data.map((log) => ({
      id: log.id,
      created_at: log.created_at,
      action: log.action,
      action_code: log.action_code,
      module: log.module,
      user_name: log.user_name,
      metadata: log.metadata as Record<string, unknown> | null,
    }))
  );

  return {
    businessDate: input.businessDate,
    businessDayStatus: dayClosed ? "closed" : "open",
    nightAuditStatus: input.currentAudit
      ? input.currentAudit.status
      : "none",
    correctionSession,
    health,
    warnings,
    pendingOverstayApprovals: pendingCharges.length,
    outstandingCheckOuts,
    expectedArrivals,
    openMaintenanceBlocks,
    openHousekeepingIssues,
    timeline,
  };
}
