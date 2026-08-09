/**
 * Night Audit Window — timing governance only.
 * Wall clock classifies close attempts; Business Date remains operational authority.
 *
 * Classification is always for the Night Audit that closes a specific Business Date.
 * That audit's window spans evening of BD → morning of BD+1. Daytime on BD itself
 * is Scheduled — never Overdue/Critical merely because wall-clock hour ≥ morning warning.
 */

import {
  addDaysToDateString,
  getCalendarDateString,
} from "@/lib/dates/today";

export type NightAuditCloseClassification =
  | "too_early"
  | "early"
  | "on_time"
  | "late"
  | "overdue";

/** Reception-facing status for the pending next audit (not the BD itself). */
export type NightAuditUxStatus =
  | "scheduled"
  | "due"
  | "overdue"
  | "critical"
  | "closed";

export type NightAuditWindowPolicy = {
  /** HH:mm — before this → Too Early (manager override). Default 23:30 */
  earliestClose: string;
  /** HH:mm — operational recommendation. Default 00:30 */
  recommendedClose: string;
  /** HH:mm — after this → Late. Default 02:00 */
  latestClose: string;
  /** Calendar hour (0–23) after which open BD is Overdue. Reuses lock policy. */
  morningWarningHour: number;
};

export const DEFAULT_NIGHT_AUDIT_WINDOW: NightAuditWindowPolicy = {
  earliestClose: "23:30",
  recommendedClose: "00:30",
  latestClose: "02:00",
  morningWarningHour: 6,
};

/** Minutes since local midnight; times after midnight stay in 0–(24*60) range. */
export function timeToMinutesOfDay(time: string): number {
  const trimmed = time.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return 0;
  return Number(match[1]) * 60 + Number(match[2]);
}

/**
 * Night-audit window spans evening → early morning.
 * Timeline on operational clock (minutes from "noon prior day" so ordering works):
 * earliest (23:30) → recommended (00:30) → latest (02:00) → morning overdue (06:00)
 */
export function auditWindowSortKey(minutesOfDay: number): number {
  // Map 12:00–23:59 to 0–719, 00:00–11:59 to 720–1439 so evening precedes morning.
  return minutesOfDay >= 12 * 60
    ? minutesOfDay - 12 * 60
    : minutesOfDay + 12 * 60;
}

export type NightAuditTimingContext = {
  /** Business Date the pending (or closing) Night Audit will close. */
  businessDate: string;
  /** Wall-clock calendar date (YYYY-MM-DD). Defaults to today when omitted. */
  calendarDate?: string;
};

export type NightAuditSchedule = {
  closesBusinessDate: string;
  /** Calendar date when recommended close typically falls. */
  scheduledCalendarDate: string;
  recommendedTime: string;
  earliestTime: string;
  latestTime: string;
  morningWarningHour: number;
};

export type NightAuditTimingAssessment = {
  classification: NightAuditCloseClassification;
  /** Reception-facing status for the pending audit. */
  uxStatus: NightAuditUxStatus;
  wallClock: string;
  delayMinutes: number;
  minutesUntilRecommended: number;
  minutesPastRecommended: number;
  requiresManagerOverride: boolean;
  requiresReason: boolean;
  label: string;
  message: string;
  reminderStage: 0 | 1 | 2 | 3 | 4 | 5;
  schedule: NightAuditSchedule | null;
};

/** Resolve when the Night Audit that closes `businessDate` is scheduled. */
export function resolveNightAuditSchedule(
  businessDate: string,
  window: NightAuditWindowPolicy
): NightAuditSchedule {
  const recommended = timeToMinutesOfDay(window.recommendedClose);
  // Recommended times before noon fall on calendar morning of BD+1.
  const scheduledCalendarDate =
    recommended < 12 * 60
      ? addDaysToDateString(businessDate, 1)
      : businessDate;

  return {
    closesBusinessDate: businessDate,
    scheduledCalendarDate,
    recommendedTime: window.recommendedClose,
    earliestTime: window.earliestClose,
    latestTime: window.latestClose,
    morningWarningHour: window.morningWarningHour,
  };
}

export function mapClassificationToUxStatus(
  classification: NightAuditCloseClassification,
  dayClosed = false
): NightAuditUxStatus {
  if (dayClosed) return "closed";
  switch (classification) {
    case "too_early":
    case "early":
      return "scheduled";
    case "on_time":
      return "due";
    case "late":
      return "overdue";
    case "overdue":
      return "critical";
  }
}

function compareDateStrings(a: string, b: string): number {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

/**
 * Classify wall-clock position relative to the Night Audit that closes `businessDate`.
 * Without context, falls back to wall-clock-only (legacy); callers that know BD must pass it.
 */
export function classifyNightAuditTiming(
  wallClockHhMm: string,
  window: NightAuditWindowPolicy,
  context?: NightAuditTimingContext
): NightAuditTimingAssessment {
  const now = timeToMinutesOfDay(wallClockHhMm);
  const earliest = timeToMinutesOfDay(window.earliestClose);
  const recommended = timeToMinutesOfDay(window.recommendedClose);
  const latest = timeToMinutesOfDay(window.latestClose);
  const morning = window.morningWarningHour * 60;

  const nowKey = auditWindowSortKey(now);
  const earliestKey = auditWindowSortKey(earliest);
  const recommendedKey = auditWindowSortKey(recommended);
  const latestKey = auditWindowSortKey(latest);
  const morningKey = auditWindowSortKey(morning);

  const calendarDate =
    context?.calendarDate ?? getCalendarDateString();
  const businessDate = context?.businessDate;
  const schedule = businessDate
    ? resolveNightAuditSchedule(businessDate, window)
    : null;

  let classification: NightAuditCloseClassification;

  if (businessDate) {
    const nextCalendar = addDaysToDateString(businessDate, 1);
    const vsBd = compareDateStrings(calendarDate, businessDate);
    const vsNext = compareDateStrings(calendarDate, nextCalendar);

    if (vsBd < 0) {
      // Calendar still before the Business Date — audit not due.
      classification = "too_early";
    } else if (vsBd === 0) {
      /**
       * Same calendar day as BD.
       * Use plain minutes-of-day (not noon-pivot): morning 06:28 is BEFORE
       * evening earliest 23:30, so the next audit is Scheduled — not Overdue.
       */
      if (now < earliest) {
        classification = "too_early";
      } else if (recommended > earliest) {
        // Unusual: recommended still on the same evening after earliest.
        if (now < recommended) {
          classification = "early";
        } else if (now <= latest) {
          classification = "on_time";
        } else {
          classification = "late";
        }
      } else {
        // Normal: recommended is after midnight → evening after earliest is approaching.
        classification = "early";
      }
    } else if (vsNext === 0) {
      // Calendar morning after BD — intended close window / late / overdue.
      // Plain minutes: 00:30 recommended, 02:00 latest, 06:00 morning.
      if (now < recommended) {
        classification = "early";
      } else if (now <= latest) {
        classification = "on_time";
      } else if (now >= morning) {
        classification = "overdue";
      } else {
        classification = "late";
      }
    } else {
      // More than one calendar day past BD — critically overdue.
      classification = "overdue";
    }
  } else {
    // Legacy wall-clock-only path (close attempts should always pass BD context).
    if (nowKey < earliestKey) {
      classification = "too_early";
    } else if (nowKey < recommendedKey) {
      classification = "early";
    } else if (nowKey <= latestKey) {
      classification = "on_time";
    } else if (nowKey >= morningKey) {
      classification = "overdue";
    } else {
      classification = "late";
    }
  }

  // Minutes until/past recommended relative to the scheduled calendar day when known.
  let minutesUntilRecommended = recommendedKey - nowKey;
  let minutesPastRecommended = Math.max(0, nowKey - recommendedKey);

  if (businessDate && schedule) {
    const sched = schedule.scheduledCalendarDate;
    const vsSched = compareDateStrings(calendarDate, sched);
    if (vsSched < 0) {
      // Before scheduled calendar day — treat as full day(s) remaining + time-of-day delta.
      const dayGapMs =
        new Date(`${sched}T12:00:00`).getTime() -
        new Date(`${calendarDate}T12:00:00`).getTime();
      const dayGapMinutes = Math.round(dayGapMs / 60000);
      minutesUntilRecommended = dayGapMinutes + (recommended - now);
      minutesPastRecommended = 0;
    } else if (vsSched > 0) {
      const dayGapMs =
        new Date(`${calendarDate}T12:00:00`).getTime() -
        new Date(`${sched}T12:00:00`).getTime();
      const dayGapMinutes = Math.round(dayGapMs / 60000);
      minutesUntilRecommended = -(dayGapMinutes + (now - recommended));
      minutesPastRecommended = Math.max(0, -minutesUntilRecommended);
    } else {
      minutesUntilRecommended = recommended - now;
      minutesPastRecommended = Math.max(0, now - recommended);
    }
  }

  const delayMinutes =
    classification === "late" || classification === "overdue"
      ? Math.max(0, minutesPastRecommended)
      : 0;

  const requiresManagerOverride = classification === "too_early";
  const requiresReason =
    classification === "too_early" ||
    classification === "late" ||
    classification === "overdue";

  const uxStatus = mapClassificationToUxStatus(classification);

  const labels: Record<NightAuditCloseClassification, string> = {
    too_early: "Scheduled",
    early: "Scheduled",
    on_time: "Due",
    late: "Overdue",
    overdue: "Critical",
  };

  const scheduledLabel = schedule
    ? `${schedule.scheduledCalendarDate} · ${window.recommendedClose}`
    : window.recommendedClose;

  const messages: Record<NightAuditCloseClassification, string> = {
    too_early: schedule
      ? `Next Night Audit is scheduled for ${scheduledLabel} (closes Business Date ${businessDate}).`
      : `Before earliest close (${window.earliestClose}). Manager override and reason required.`,
    early: `Approaching recommended Night Audit (${window.recommendedClose}). Soft warning only.`,
    on_time: `Night Audit is due now (recommended ${window.recommendedClose}).`,
    late: `Night Audit is overdue past latest close (${window.latestClose}). Reason required; delay will be recorded.`,
    overdue: `Night Audit is critically overdue (past morning warning ${window.morningWarningHour}:00). Still closable with reason — hotel is never blocked.`,
  };

  let reminderStage: NightAuditTimingAssessment["reminderStage"] = 0;
  if (classification === "overdue") {
    reminderStage = 5;
  } else if (classification === "late") {
    reminderStage = 4;
  } else if (classification === "on_time") {
    reminderStage = minutesPastRecommended >= 30 ? 4 : 3;
  } else if (classification === "early") {
    reminderStage = minutesUntilRecommended <= 30 ? 2 : 1;
  } else if (classification === "too_early") {
    // Approaching evening window on BD calendar day only.
    if (
      businessDate &&
      calendarDate === businessDate &&
      now >= earliest - 30 &&
      now < earliest
    ) {
      reminderStage = 1;
    } else {
      reminderStage = 0;
    }
  }

  return {
    classification,
    uxStatus,
    wallClock: wallClockHhMm.slice(0, 5),
    delayMinutes,
    minutesUntilRecommended,
    minutesPastRecommended,
    requiresManagerOverride,
    requiresReason,
    label: labels[classification],
    message: messages[classification],
    reminderStage,
    schedule,
  };
}

export type CountdownCardState = {
  mode: "preparing" | "due" | "late" | "overdue" | "closed";
  title: string;
  /** Absolute seconds until/past recommended (negative = past). */
  secondsDelta: number;
  display: string;
  statusLabel: string;
};

export function buildCountdownState(
  wallClockHhMm: string,
  window: NightAuditWindowPolicy,
  dayClosed: boolean,
  context?: NightAuditTimingContext
): CountdownCardState {
  if (dayClosed) {
    return {
      mode: "closed",
      title: "Night Audit Closed",
      secondsDelta: 0,
      display: "—",
      statusLabel: "Business Date closed",
    };
  }

  const timing = classifyNightAuditTiming(wallClockHhMm, window, context);
  const secondsDelta = timing.minutesUntilRecommended * 60;

  const abs = Math.abs(secondsDelta);
  const h = Math.floor(abs / 3600);
  const m = Math.floor((abs % 3600) / 60);
  const s = abs % 60;
  const display = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;

  if (timing.uxStatus === "critical") {
    return {
      mode: "overdue",
      title: "Night Audit Critical",
      secondsDelta,
      display,
      statusLabel: "Critically overdue — close when ready (hotel never blocked)",
    };
  }
  if (timing.uxStatus === "overdue") {
    return {
      mode: "late",
      title: "Night Audit Overdue",
      secondsDelta,
      display,
      statusLabel: "Past latest close — reason required",
    };
  }
  if (timing.uxStatus === "due") {
    return {
      mode: "due",
      title: "Night Audit Due",
      secondsDelta,
      display,
      statusLabel: "Ready to close when checklist allows",
    };
  }
  return {
    mode: "preparing",
    title: "Next Night Audit",
    secondsDelta,
    display,
    statusLabel: timing.schedule
      ? `Scheduled · ${timing.schedule.scheduledCalendarDate} · ${window.recommendedClose}`
      : "Scheduled — not due yet",
  };
}

/** Derive late-completion facts for a closed audit (for history / last-audit card). */
export function assessCompletedAuditTiming(
  auditDate: string,
  closedAtIso: string,
  window: NightAuditWindowPolicy
): {
  completedLate: boolean;
  delayMinutes: number;
  scheduledCalendarDate: string;
  scheduledTime: string;
} {
  const schedule = resolveNightAuditSchedule(auditDate, window);
  const closed = new Date(closedAtIso);
  if (Number.isNaN(closed.getTime())) {
    return {
      completedLate: false,
      delayMinutes: 0,
      scheduledCalendarDate: schedule.scheduledCalendarDate,
      scheduledTime: schedule.recommendedTime,
    };
  }

  const [rh, rm] = schedule.recommendedTime.split(":").map(Number);
  const scheduled = new Date(`${schedule.scheduledCalendarDate}T12:00:00`);
  scheduled.setHours(rh || 0, rm || 0, 0, 0);

  const delayMinutes = Math.max(
    0,
    Math.round((closed.getTime() - scheduled.getTime()) / 60000)
  );

  return {
    completedLate: delayMinutes > 0,
    delayMinutes,
    scheduledCalendarDate: schedule.scheduledCalendarDate,
    scheduledTime: schedule.recommendedTime,
  };
}

export function formatDelayMinutes(minutes: number): string {
  if (minutes <= 0) return "0m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
