import { getCalendarDateString } from "@/lib/dates/today";
import { getCurrentTimeString } from "@/lib/dates/time";
import {
  assessCompletedAuditTiming,
  buildCountdownState,
  classifyNightAuditTiming,
  formatDelayMinutes,
  resolveNightAuditSchedule,
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

function formatLongDate(dateStr: string): string {
  const date = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(date.getTime())) return dateStr;
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function formatShortDate(dateStr: string): string {
  const date = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(date.getTime())) return dateStr;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(date);
}

function reminderMessageForUx(input: {
  uxStatus: NightAuditCommandCenter["timing"]["uxStatus"];
  businessDate: string;
  scheduleDate: string;
  recommendedClose: string;
  dayClosed: boolean;
}): string | null {
  if (input.dayClosed) return null;
  const bd = formatLongDate(input.businessDate);
  const next = `${formatLongDate(input.scheduleDate)} at ${input.recommendedClose}`;

  switch (input.uxStatus) {
    case "scheduled":
      return `The hotel is operating on Business Date ${bd}. The next Night Audit is scheduled for ${next}.`;
    case "due":
      return `Night Audit is now due. Review the readiness checklist and close Business Date ${bd} when ready.`;
    case "overdue":
      return `Night Audit for Business Date ${bd} is overdue. Review the readiness checklist and close the Business Date when ready.`;
    case "critical":
      return `Night Audit for Business Date ${bd} is critically overdue. Management attention is recommended. The hotel is never blocked.`;
    default:
      return null;
  }
}

export async function buildNightAuditCommandCenter(input: {
  businessDate: string;
  currentAudit: NightAudit | null;
  /** Most recent closed audit (for last-audit card). */
  lastClosedAudit?: NightAudit | null;
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
  const calendarDate = getCalendarDateString();
  const timingContext = {
    businessDate: input.businessDate,
    calendarDate,
  };
  const timing = classifyNightAuditTiming(
    wallClock,
    auditWindow,
    timingContext
  );
  const countdown = buildCountdownState(
    wallClock,
    auditWindow,
    dayClosed,
    timingContext
  );
  const schedule =
    timing.schedule ??
    resolveNightAuditSchedule(input.businessDate, auditWindow);

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
    closingBusinessDate: input.businessDate,
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

  const lastClosed = input.lastClosedAudit ?? null;
  let lastCompletedAudit: NightAuditCommandCenter["lastCompletedAudit"] = null;
  if (lastClosed?.status === "closed" && lastClosed.closedAt) {
    const completed = assessCompletedAuditTiming(
      lastClosed.auditDate,
      lastClosed.closedAt,
      auditWindow
    );
    lastCompletedAudit = {
      businessDate: lastClosed.auditDate,
      auditNumber: lastClosed.auditNumber,
      closedAt: lastClosed.closedAt,
      completedLate: completed.completedLate,
      delayMinutes: completed.delayMinutes,
      delayLabel: completed.completedLate
        ? formatDelayMinutes(completed.delayMinutes)
        : null,
      scheduledCalendarDate: completed.scheduledCalendarDate,
      scheduledTime: completed.scheduledTime,
    };
  }

  const businessDayStatus = dayClosed ? "closed" : "open";
  const nextAuditUx = dayClosed ? "closed" : timing.uxStatus;

  return {
    businessDate: input.businessDate,
    businessDayStatus,
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
    calendarDate,
    auditWindow,
    timing,
    countdown,
    readiness,
    reminderStage,
    reminderMessage: reminderMessageForUx({
      uxStatus: nextAuditUx,
      businessDate: input.businessDate,
      scheduleDate: schedule.scheduledCalendarDate,
      recommendedClose: auditWindow.recommendedClose,
      dayClosed,
    }),
    lastCompletedAudit,
    nextAudit: {
      closesBusinessDate: input.businessDate,
      scheduledCalendarDate: schedule.scheduledCalendarDate,
      scheduledTime: auditWindow.recommendedClose,
      uxStatus: nextAuditUx,
      label:
        nextAuditUx === "scheduled"
          ? "Scheduled"
          : nextAuditUx === "due"
            ? "Due"
            : nextAuditUx === "overdue"
              ? "Overdue"
              : nextAuditUx === "critical"
                ? "Critical"
                : "Closed",
      summary:
        nextAuditUx === "closed"
          ? `Business Date ${formatShortDate(input.businessDate)} is closed`
          : `Closes ${formatShortDate(input.businessDate)} · ${formatShortDate(schedule.scheduledCalendarDate)} · ${auditWindow.recommendedClose}`,
    },
  };
}
