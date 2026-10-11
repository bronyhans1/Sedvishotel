/**
 * Reservation numbers are SHMS-{year}-{sequence}.
 * Sequence is at least 4 digits. Longer values are not truncated.
 * The next sequence is one past the higher of the stored maximum and the
 * allocator counter, so a missing lower number is never reused.
 */
export function formatReservationNumber(year: number, sequence: number): string {
  if (!Number.isInteger(year) || year < 1000 || year > 9999) {
    throw new Error("Invalid reservation number year.");
  }
  if (!Number.isInteger(sequence) || sequence < 1) {
    throw new Error("Invalid reservation number sequence.");
  }
  return `SHMS-${year}-${String(sequence).padStart(4, "0")}`;
}

export function nextReservationSequence(
  existingMax: number,
  counterLast: number
): number {
  const maxStored = Number.isFinite(existingMax) ? Math.max(0, Math.trunc(existingMax)) : 0;
  const counter = Number.isFinite(counterLast) ? Math.max(0, Math.trunc(counterLast)) : 0;
  return Math.max(maxStored, counter) + 1;
}
