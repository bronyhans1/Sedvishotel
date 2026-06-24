/** Current local time as HH:mm for front-desk operations. */
export function getCurrentTimeString(): string {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

/** Parse HH:mm or HH:mm:ss to minutes since midnight. */
export function timeToMinutes(time: string): number {
  const trimmed = time.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!match) return 0;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours * 60 + minutes;
}

/** Combine local date (YYYY-MM-DD) and time (HH:mm) into ISO timestamp. */
export function combineDateAndTime(date: string, time: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);
  return new Date(y, m - 1, d, hours, minutes, 0, 0).toISOString();
}
