/** ISO date (YYYY-MM-DD) from the wall clock / local calendar. */
export function getCalendarDateString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * @deprecated Prefer getCalendarDateString() for wall-clock dates, or
 * getCurrentBusinessDate() for operational front-desk / night-audit / report day.
 * Kept as an alias so existing non-operational callers keep compiling.
 */
export function getTodayDateString(): string {
  return getCalendarDateString();
}

/** Add whole calendar days to a YYYY-MM-DD string (UTC-noon safe). */
export function addDaysToDateString(dateStr: string, days: number): string {
  const date = new Date(`${dateStr}T12:00:00`);
  date.setDate(date.getDate() + days);
  return getCalendarDateString(date);
}

/** Format YYYY-MM-DD for staff-facing labels (e.g. "3 Aug"). */
export function formatBusinessDateShort(dateStr: string): string {
  const date = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(date.getTime())) return dateStr;
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
  }).format(date);
}
