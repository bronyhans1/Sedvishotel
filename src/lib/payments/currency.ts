export const OVERPAYMENT_ERROR = "Amount exceeds outstanding balance.";

export const OVER_REFUND_ERROR = "Refund exceeds total paid amount.";

export function roundCurrency(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Number(value.toFixed(2));
}

export function exceedsOutstandingBalance(
  requestedAmount: number,
  outstandingBalance: number
): boolean {
  return roundCurrency(requestedAmount) > roundCurrency(outstandingBalance);
}

export function exceedsRefundableAmount(
  requestedAmount: number,
  maxRefundable: number
): boolean {
  return roundCurrency(requestedAmount) > roundCurrency(maxRefundable);
}

export function computeOutstandingBalance(
  totalDue: number,
  amountPaid: number
): number {
  return roundCurrency(roundCurrency(totalDue) - roundCurrency(amountPaid));
}
