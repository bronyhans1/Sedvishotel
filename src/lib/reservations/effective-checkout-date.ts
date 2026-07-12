/**
 * Resolves the departure date to display or use in completed-stay calculations.
 *
 * - `check_out_date` remains the scheduled departure (migration 009 / 040).
 * - `actual_check_out_date` records actual departure after early check-out.
 */
export type EffectiveCheckOutDateInput = {
  status: string;
  checkOutDate?: string;
  check_out_date?: string;
  actualCheckOutDate?: string | null;
  actual_check_out_date?: string | null;
};

export function resolveEffectiveCheckOutDate(
  reservation: EffectiveCheckOutDateInput
): string {
  const checkOutDate =
    reservation.checkOutDate ?? reservation.check_out_date ?? "";
  const actualCheckOutDate =
    reservation.actualCheckOutDate ?? reservation.actual_check_out_date;

  if (reservation.status === "checked_out_early" && actualCheckOutDate) {
    return actualCheckOutDate;
  }

  return checkOutDate;
}
