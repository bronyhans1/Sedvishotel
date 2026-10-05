/**
 * Same predicate the payments table used in the browser:
 * reference, guest name, and reservation number are case-insensitive;
 * room number is matched against the already-lowercased term, case-sensitively.
 */
export function paymentMatchesSearch(
  payment: {
    reference: string;
    guestName: string;
    reservationNumber: string;
    roomNumber: string;
  },
  rawSearch: string
): boolean {
  const needle = rawSearch.trim().toLowerCase();
  if (!needle) return true;
  return (
    payment.reference.toLowerCase().includes(needle) ||
    payment.guestName.toLowerCase().includes(needle) ||
    payment.reservationNumber.toLowerCase().includes(needle) ||
    payment.roomNumber.includes(needle)
  );
}

/** Empty after trim means no search filter. */
export function normalizePaymentSearch(raw: string | undefined | null): string | null {
  const needle = raw?.trim().toLowerCase() ?? "";
  return needle ? needle : null;
}

/** Literal LIKE/ILIKE pattern. `%`, `_`, and `\` in the term stay literal. */
export function paymentSearchLikePattern(needle: string): string {
  const escaped = needle.replace(/[\\%_]/g, (char) => `\\${char}`);
  return `%${escaped}%`;
}
