import type { Payment, PaymentStats } from "@/types/payment";

/** Fields the payment KPIs actually read. The formulas below are unchanged. */
export type PaymentStatsSource = Pick<
  Payment,
  "netPaid" | "paymentDate" | "balance" | "status" | "refundCount"
>;

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function paymentNetRevenue(payment: PaymentStatsSource): number {
  return payment.netPaid;
}

function isRevenueCountable(payment: PaymentStatsSource): boolean {
  return payment.netPaid > 0;
}

export function computePaymentStats(
  payments: readonly PaymentStatsSource[],
  asOfDate?: string
): PaymentStats {
  const now = asOfDate ? new Date(`${asOfDate}T12:00:00`) : new Date();
  const today = asOfDate ?? now.toISOString().slice(0, 10);
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);

  const countable = payments.filter(isRevenueCountable);

  const revenueToday = countable
    .filter((p) => p.paymentDate === today)
    .reduce((sum, p) => sum + paymentNetRevenue(p), 0);

  const revenueWeek = countable
    .filter((p) => new Date(p.paymentDate) >= weekStart)
    .reduce((sum, p) => sum + paymentNetRevenue(p), 0);

  const revenueMonth = countable
    .filter((p) => new Date(p.paymentDate) >= monthStart)
    .reduce((sum, p) => sum + paymentNetRevenue(p), 0);

  return {
    totalPayments: payments.length,
    revenueToday,
    revenueWeek,
    revenueMonth,
    outstandingBalances: payments.reduce((sum, p) => sum + p.balance, 0),
    refundedPayments: payments.filter(
      (p) => p.status === "refunded" || p.refundCount > 0
    ).length,
  };
}
