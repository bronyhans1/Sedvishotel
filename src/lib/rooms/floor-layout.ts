/** Normalize room numbers for storage and lookup. Numeric values are zero-padded; alphanumeric values are trimmed as entered. */
export function normalizeRoomNumber(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  if (/^\d+$/.test(trimmed)) {
    return trimmed.padStart(3, "0");
  }
  return trimmed;
}

/** Client/server validation for room number format (independent of floor). */
export function isValidRoomNumber(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 32) return false;
  return /^[A-Za-z0-9][A-Za-z0-9 \-]*$/.test(trimmed);
}
