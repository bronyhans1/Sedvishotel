/**
 * Night Audit Window — timing governance only.
 * Wall clock classifies close attempts; Business Date remains operational authority.
 */

export type NightAuditCloseClassification =
  | "too_early"
  | "early"
  | "on_time"
  | "late"
  | "overdue";

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

export type NightAuditTimingAssessment = {
  classification: NightAuditCloseClassification;
  wallClock: string;
  delayMinutes: number;
  minutesUntilRecommended: number;
  minutesPastRecommended: number;
  requiresManagerOverride: boolean;
  requiresReason: boolean;
  label: string;
  message: string;
  reminderStage: 0 | 1 | 2 | 3 | 4 | 5;
};

export function classifyNightAuditTiming(
  wallClockHhMm: string,
  window: NightAuditWindowPolicy
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

  const minutesUntilRecommended = recommendedKey - nowKey;
  const minutesPastRecommended = Math.max(0, nowKey - recommendedKey);

  let classification: NightAuditCloseClassification;
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

  const delayMinutes =
    classification === "late" || classification === "overdue"
      ? Math.max(0, nowKey - latestKey)
      : 0;

  const requiresManagerOverride = classification === "too_early";
  const requiresReason =
    classification === "too_early" ||
    classification === "late" ||
    classification === "overdue";

  const labels: Record<NightAuditCloseClassification, string> = {
    too_early: "Too Early",
    early: "Early",
    on_time: "On Time",
    late: "Late",
    overdue: "Overdue",
  };

  const messages: Record<NightAuditCloseClassification, string> = {
    too_early: `Before earliest close (${window.earliestClose}). Manager override and reason required.`,
    early: `After earliest close, before recommended (${window.recommendedClose}). Soft warning only.`,
    on_time: `Within the Night Audit window (${window.recommendedClose}–${window.latestClose}).`,
    late: `After latest close (${window.latestClose}). Reason required; delay will be recorded.`,
    overdue: `Past morning warning (${window.morningWarningHour}:00). Critical — still closable with reason.`,
  };

  let reminderStage: NightAuditTimingAssessment["reminderStage"] = 0;
  const approaching = earliestKey - 30; // ~30 min before earliest as stage 1 if evening
  if (nowKey >= morningKey && nowKey > latestKey) {
    reminderStage = 5;
  } else if (nowKey >= latestKey) {
    reminderStage = 5;
  } else if (nowKey >= recommendedKey + 30) {
    reminderStage = 4;
  } else if (nowKey >= recommendedKey) {
    reminderStage = 3;
  } else if (nowKey >= recommendedKey - 30) {
    reminderStage = 2;
  } else if (nowKey >= earliestKey - 30 || nowKey >= approaching) {
    reminderStage = 1;
  }

  return {
    classification,
    wallClock: wallClockHhMm.slice(0, 5),
    delayMinutes,
    minutesUntilRecommended,
    minutesPastRecommended,
    requiresManagerOverride,
    requiresReason,
    label: labels[classification],
    message: messages[classification],
    reminderStage,
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
  dayClosed: boolean
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

  const timing = classifyNightAuditTiming(wallClockHhMm, window);
  const now = timeToMinutesOfDay(wallClockHhMm);
  const recommended = timeToMinutesOfDay(window.recommendedClose);
  const nowKey = auditWindowSortKey(now);
  const recommendedKey = auditWindowSortKey(recommended);
  const secondsDelta = (recommendedKey - nowKey) * 60;

  const abs = Math.abs(secondsDelta);
  const h = Math.floor(abs / 3600);
  const m = Math.floor((abs % 3600) / 60);
  const s = abs % 60;
  const display = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;

  if (timing.classification === "overdue") {
    return {
      mode: "overdue",
      title: "Night Audit Overdue",
      secondsDelta,
      display,
      statusLabel: "Critical — close Business Date",
    };
  }
  if (timing.classification === "late") {
    return {
      mode: "late",
      title: "Night Audit Late",
      secondsDelta,
      display,
      statusLabel: "Past latest close — reason required",
    };
  }
  if (secondsDelta <= 0) {
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
    title: "Preparing for Night Audit",
    secondsDelta,
    display,
    statusLabel: "Time remaining until recommended",
  };
}
