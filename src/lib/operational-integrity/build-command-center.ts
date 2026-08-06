import { getCurrentTimeString } from "@/lib/dates/time";
import {
  buildCountdownState,
  classifyNightAuditTiming,
} from "@/lib/night-audit/audit-window";
import { buildNightAuditCloseReadiness } from "@/lib/night-audit/close-readiness";
import {
  deriveBusinessDayHealth,
  deriveOperationalSmartWarnings,
  mapActivityLogsToTimeline,
} from "@/lib/operational-integrity/business-day-health";
import { getBusinessDayLockService, getCorrectionSessionService } from "@/lib/operational-integrity/get-lock-services";
import { loadLockPolicy } from "@/lib/settings/lock-policy";
import { loadNightAuditWindowPolicy } from "@/lib/settings/night-audit-window";
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

function reminderMessageForStage(
  stage: 0 | 1 | 2 | 3 | 4 | 5,
  recommendedClose: string
): string | null {
  switch (stage) {
    case 1:
      return `Night Audit window is approaching. Please complete outstanding front desk activities. Recommended audit time: ${recommendedClose}.`;
    case 2:
      return `Approaching recommended Night Audit (${recommendedClose}). Review pending departures, cash count, and operational readiness.`;
    case 3:
      return `Night Audit is now due (${recommendedClose}). Review the Operations Command Center and run Night Audit when ready.`;
    case 4:
      return `Night Audit is overdue past the recommended time. Please complete Night Audit or contact the Duty Manager if activities are still in progress.`;
    case 5:
      return `Critical: Night Audit is late or past morning warning. Close the Business Date when ready — the hotel is never blocked.`;
    default:
      return null;
  }
}

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
    auditWindow,
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
    loadNightAuditWindowPolicy(),
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
  const wallClock = getCurrentTimeString();
  const departure = countDepartureClassifications(
    reservations,
    input.businessDate,
    checkoutPolicy.checkOutTime,
    wallClock
  );

  const expectedArrivals = reservations.filter(
    (r) =>
      (r.status === "confirmed" || r.status === "pending") &&
      r.checkInDate === input.businessDate
  ).length;
  const expectedArrivalsPending = reservations.filter(
    (r) =>
      r.status === "confirmed" &&
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

  const hour = Number(wallClock.slice(0, 2));
  const correctionOpenHours =
    correctionSession?.durationMinutes != null
      ? Math.round(correctionSession.durationMinutes / 60)
      : null;

  const nightAuditOpen = input.currentAudit?.status === "open";
  const timing = classifyNightAuditTiming(wallClock, auditWindow);
  const countdown = buildCountdownState(wallClock, auditWindow, dayClosed);

  const unbalancedShift = Boolean(
    openShift &&
      openShift.closing_cash != null &&
      Number(openShift.closing_cash) !== Number(openShift.cash_drawer_amount)
  );

  const readiness = buildNightAuditCloseReadiness({
    cashCountedEntered: Boolean(
      input.currentAudit?.cashCounted != null &&
        Number(input.currentAudit.cashCounted) > 0
    ),
    correctionSessionOpen: Boolean(correctionSession),
    pendingCheckOuts: outstandingCheckOuts,
    outstandingOverstayApprovals: pendingCharges.length,
    openFoliosEstimate: 0,
    outstandingChargesEstimate: pendingCharges.length,
    shiftOpen: Boolean(openShift),
    shiftBalanced: !unbalancedShift,
    housekeepingCleaning: openHousekeepingIssues,
    expectedArrivals,
    expectedArrivalsPending,
    timing,
    window: auditWindow,
    dayClosed,
  });

  const health = deriveBusinessDayHealth({
    outstandingOverstays: departure.overstays,
    pendingOverstayApprovals: pendingCharges.length,
    openCorrectionSession: Boolean(correctionSession),
    housekeepingPending: openHousekeepingIssues,
    maintenanceBlocks: openMaintenanceBlocks,
    unbalancedShift,
    nightAuditPending: nightAuditOpen,
    missingCashCount:
      nightAuditOpen &&
      (input.currentAudit?.cashCounted == null ||
        input.currentAudit.cashCounted === 0),
    closeClassification: nightAuditOpen ? timing.classification : null,
  });

  const warnings = deriveOperationalSmartWarnings({
    businessDate: input.businessDate,
    calendarHour: hour,
    warningHour: lockPolicy.businessDayOpenWarningHour,
    nightAuditOpen,
    correctionSessionOpenHours: correctionOpenHours,
    correctionMaxHours: lockPolicy.correctionSessionMaxHours,
    pendingApprovals: pendingCharges.length,
    outstandingOverstays: departure.overstays,
    outstandingCheckOuts,
    closeClassification: nightAuditOpen ? timing.classification : null,
    recommendedClose: auditWindow.recommendedClose,
    latestClose: auditWindow.latestClose,
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

  const reminderStage = nightAuditOpen && !dayClosed ? timing.reminderStage : 0;

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
    wallClock,
    auditWindow,
    timing,
    countdown,
    readiness,
    reminderStage,
    reminderMessage: reminderMessageForStage(
      reminderStage,
      auditWindow.recommendedClose
    ),
  };
}
