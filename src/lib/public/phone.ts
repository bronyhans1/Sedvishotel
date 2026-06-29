/** Normalizes phone numbers for comparison (digits only). */
export function normalizePhone(value: string): string {
  return value.replace(/\D/g, "");
}

export function phonesMatch(stored: string | null | undefined, input: string): boolean {
  const a = normalizePhone(stored ?? "");
  const b = normalizePhone(input);
  if (!a || !b) return false;
  return a === b || a.endsWith(b) || b.endsWith(a);
}
