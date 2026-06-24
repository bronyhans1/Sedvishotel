import type { Payment, PaymentStats, PaymentTimelineEntry, PaymentTransaction, TransactionPaymentMethod } from "@/types/payment";

function tx(
  id: string,
  date: string,
  description: string,
  amount: number,
  method: TransactionPaymentMethod,
  reference: string,
  receiptNumber: string | null = null
): PaymentTransaction {
  return {
    id,
    date,
    time: "12:00",
    receiptNumber,
    description,
    amount,
    method,
    reference,
  };
}

function timelineFromTransactions(
  transactions: PaymentTransaction[]
): PaymentTimelineEntry[] {
  let paymentSequence = 0;
  let refundSequence = 0;

  return transactions.map((t) => {
    const isRefund = t.amount < 0;
    if (isRefund) refundSequence += 1;
    else paymentSequence += 1;

    return {
      id: t.id,
      kind: isRefund ? "refund" : "payment",
      sequenceNumber: isRefund ? refundSequence : paymentSequence,
      receiptNumber: t.receiptNumber,
      date: t.date,
      displayDate: new Date(t.date).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      time: t.time,
      method: t.method,
      amount: t.amount,
      description: t.description,
      reason: isRefund
        ? t.description.replace(/^Refund: /, "").split(" — ")[0]
        : undefined,
      reference: t.reference,
    };
  });
}

function withSummary(
  payment: Omit<
    Payment,
    | "timeline"
    | "totalPaid"
    | "totalRefunded"
    | "netPaid"
    | "maxRefundable"
    | "transactionCount"
    | "refundCount"
    | "firstPaymentDate"
    | "lastPaymentDate"
    | "methodsUsed"
    | "amount"
  > & {
    transactionHistory: PaymentTransaction[];
  }
): Payment {
  const positive = payment.transactionHistory.filter((t) => t.amount > 0);
  const refunds = payment.transactionHistory.filter((t) => t.amount < 0);
  const totalPaid = positive.reduce((sum, t) => sum + t.amount, 0);
  const totalRefunded = refunds.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const netPaid = totalPaid - totalRefunded;
  const methodsUsed = [...new Set(positive.map((t) => t.method))];

  return {
    ...payment,
    amount: netPaid,
    totalPaid,
    totalRefunded,
    netPaid,
    maxRefundable: Math.max(0, totalPaid - totalRefunded),
    transactionCount: positive.length,
    refundCount: refunds.length,
    firstPaymentDate: positive[0]?.date ?? payment.paymentDate,
    lastPaymentDate: positive[positive.length - 1]?.date ?? payment.paymentDate,
    methodsUsed,
    timeline: timelineFromTransactions(payment.transactionHistory),
  };
}

export const mockPayments: Payment[] = [
  withSummary({
    id: "pay_001",
    reference: "PAY-2026-8842",
    guestId: "gst_002",
    guestName: "Ama Osei",
    reservationId: "res_002",
    reservationNumber: "SHMS-2026-0143",
    roomNumber: "003",
    method: "mobile_money",
    balance: 0,
    totalDue: 575,
    status: "paid",
    paymentDate: "2026-06-02",
    transactionHistory: [
      tx("t1", "2026-06-02", "Full payment — Mobile Money", 575, "mobile_money", "PAY-2026-8842", "RCPT-2026-000001"),
    ],
  }),
  withSummary({
    id: "pay_002",
    reference: "PAY-2026-8843",
    guestId: "gst_001",
    guestName: "Kwame Mensah",
    reservationId: "res_001",
    reservationNumber: "SHMS-2026-0142",
    roomNumber: "012",
    method: "card",
    balance: 207,
    totalDue: 1407,
    status: "partial",
    paymentDate: "2026-05-28",
    notes: "Deposit received",
    transactionHistory: [
      tx("t1", "2026-05-28", "Deposit — Card", 1200, "card", "PAY-2026-8843", "RCPT-2026-000002"),
    ],
  }),
  withSummary({
    id: "pay_009",
    reference: "PAY-2026-8850",
    guestId: "gst_009",
    guestName: "Robert Kim",
    reservationId: "res_009",
    reservationNumber: "SHMS-2026-0150",
    roomNumber: "019",
    method: "online",
    balance: 450,
    totalDue: 450,
    status: "refunded",
    paymentDate: "2026-05-25",
    notes: "No-show refund",
    transactionHistory: [
      tx("t1", "2026-05-22", "Online prepayment", 450, "online", "PAY-2026-8850", "RCPT-2026-000003"),
      tx("t2", "2026-05-25", "Refund: Booking Cancellation", -450, "online", "PAY-2026-8850"),
    ],
  }),
];

export function getPaymentById(id: string): Payment | undefined {
  return mockPayments.find((p) => p.id === id || p.reference === id);
}

export function computePaymentStats(payments: Payment[]): PaymentStats {
  const countable = payments.filter((p) => p.netPaid > 0);
  const today = countable
    .filter((p) => p.paymentDate === "2026-06-02")
    .reduce((s, p) => s + p.netPaid, 0);
  const month = countable.reduce((s, p) => s + p.netPaid, 0);
  return {
    totalPayments: payments.length,
    revenueToday: today || 1375,
    revenueWeek: Math.round(month * 0.35) || 8420,
    revenueMonth: month || 28450,
    outstandingBalances: payments.reduce((s, p) => s + p.balance, 0),
    refundedPayments: payments.filter((p) => p.status === "refunded" || p.refundCount > 0).length,
  };
}

export const mockPaymentStats = computePaymentStats(mockPayments);
