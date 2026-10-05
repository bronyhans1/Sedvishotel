/**
 * Activity-log "today" window.
 * Matches `created_at` values whose UTC calendar date equals `day`,
 * which is what the previous in-memory stats used (`created_at.startsWith(day)`).
 */
export function utcActivityLogDayWindow(now = new Date()): {
  day: string;
  start: string;
  endExclusive: string;
} {
  const day = now.toISOString().slice(0, 10);
  const start = `${day}T00:00:00.000Z`;
  const next = new Date(start);
  next.setUTCDate(next.getUTCDate() + 1);
  return { day, start, endExclusive: next.toISOString() };
}

/** Same substrings `computeLogStats` used on `action_code`. */
export const ACTIVITY_LOG_KPI_ACTION_INCLUDES = {
  reservationsCreated: "reservation.created",
  paymentsRecorded: "payment.recorded",
  checkIns: "checked_in",
  checkOuts: "checked_out",
} as const;

export function isOnUtcActivityLogDay(createdAt: string, day: string): boolean {
  return createdAt.startsWith(day);
}
