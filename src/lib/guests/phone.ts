/** Normalize phone for deduplication matching (digits only). */
export function normalizePhoneDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function phonesMatch(a: string, b: string): boolean {
  const left = normalizePhoneDigits(a);
  const right = normalizePhoneDigits(b);
  return Boolean(left) && left === right;
}
