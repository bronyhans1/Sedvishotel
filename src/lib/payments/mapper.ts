import {
  aggregatePaymentMethod,
  getMethodsUsed,
} from "@/lib/payments/method-aggregation";
import { roundCurrency } from "@/lib/payments/currency";
import {
  computeTransactionTotals,
  parseRefundReason,
} from "@/lib/payments/totals";
import type {
  DbPayment,
  DbPaymentTransaction,
  DbPaymentWithRelations,
} from "@/types/database";
import type {
  Payment,
  PaymentTimelineEntry,
  PaymentTransaction,
  TransactionPaymentMethod,
} from "@/types/payment";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

function formatDate(value: string): string {
  return value.slice(0, 10);
}

function formatDisplayDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return formatDate(value);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function toTransactionMethod(
  method: DbPaymentTransaction["method"]
): TransactionPaymentMethod {
  if (method === "mixed") return "cash";
  return method;
}

function sortedTransactions(
  transactions: DbPaymentTransaction[]
): DbPaymentTransaction[] {
  return [...transactions].sort((a, b) =>
    a.transacted_at.localeCompare(b.transacted_at)
  );
}

function mapTimelineEntry(
  row: DbPaymentTransaction,
  paymentReference: string,
  paymentSequence: number,
  refundSequence: number
): PaymentTimelineEntry {
  const amount = Number(row.amount);
  const isRefund = amount < 0;

  return {
    id: row.id,
    kind: isRefund ? "refund" : "payment",
    sequenceNumber: isRefund ? refundSequence : paymentSequence,
    receiptNumber: row.receipt_number,
    date: formatDate(row.transacted_at),
    displayDate: formatDisplayDate(row.transacted_at),
    time: formatTime(row.transacted_at),
    method: toTransactionMethod(row.method),
    amount: isRefund ? amount : amount,
    description: row.description,
    reason: isRefund ? parseRefundReason(row.description) : undefined,
    reference: paymentReference,
    vatApplied: row.vat_applied ?? true,
    vatRate: Number(row.vat_rate ?? 0),
    vatAmount: Number(row.vat_amount ?? 0),
    vatExemptionReason: row.vat_exemption_reason ?? undefined,
    vatExemptionNotes: row.vat_exemption_notes ?? undefined,
  };
}

function mapPaymentTransaction(
  row: DbPaymentTransaction,
  paymentReference: string
): PaymentTransaction {
  return {
    id: row.id,
    date: formatDate(row.transacted_at),
    time: formatTime(row.transacted_at),
    receiptNumber: row.receipt_number,
    description: row.description,
    amount: Number(row.amount),
    method: toTransactionMethod(row.method),
    reference: paymentReference,
  };
}

function buildPaymentFields(
  row: DbPayment,
  transactions: DbPaymentTransaction[]
): Pick<
  Payment,
  | "method"
  | "totalPaid"
  | "totalRefunded"
  | "netPaid"
  | "maxRefundable"
  | "transactionCount"
  | "refundCount"
  | "firstPaymentDate"
  | "lastPaymentDate"
  | "methodsUsed"
  | "timeline"
  | "transactionHistory"
> {
  const ordered = sortedTransactions(transactions);
  const totals = computeTransactionTotals(ordered);
  const positive = ordered.filter((tx) => Number(tx.amount) > 0);
  const aggregatedMethod = aggregatePaymentMethod(ordered);
  const methodsUsed = getMethodsUsed(ordered);

  let paymentSequence = 0;
  let refundSequence = 0;
  const timeline = ordered.map((tx) => {
    const amount = Number(tx.amount);
    if (amount < 0) {
      refundSequence += 1;
      return mapTimelineEntry(tx, row.reference, paymentSequence, refundSequence);
    }
    paymentSequence += 1;
    return mapTimelineEntry(tx, row.reference, paymentSequence, refundSequence);
  });

  return {
    method: aggregatedMethod,
    totalPaid: totals.totalPaid,
    totalRefunded: totals.totalRefunded,
    netPaid: totals.netPaid,
    maxRefundable: totals.maxRefundable,
    transactionCount: positive.length,
    refundCount: ordered.filter((tx) => Number(tx.amount) < 0).length,
    firstPaymentDate: positive[0]
      ? formatDate(positive[0].transacted_at)
      : formatDate(row.payment_date),
    lastPaymentDate: positive[positive.length - 1]
      ? formatDate(positive[positive.length - 1].transacted_at)
      : formatDate(row.payment_date),
    methodsUsed,
    timeline,
    transactionHistory: positive.map((tx) =>
      mapPaymentTransaction(tx, row.reference)
    ),
  };
}

function mapPaymentCore(
  row: DbPayment,
  relations: {
    guestId: string;
    guestName: string;
    reservationId: string;
    reservationNumber: string;
    roomNumber: string;
  },
  transactions: DbPaymentTransaction[]
): Payment {
  const derived = buildPaymentFields(row, transactions);

  return {
    id: row.id,
    reference: row.reference,
    guestId: relations.guestId,
    guestName: relations.guestName,
    reservationId: relations.reservationId,
    reservationNumber: relations.reservationNumber,
    roomNumber: relations.roomNumber,
    amount: derived.netPaid,
    balance: roundCurrency(Number(row.balance_after)),
    totalDue: roundCurrency(Number(row.total_due)),
    status: row.status,
    paymentDate: formatDate(row.payment_date),
    notes: row.notes ?? undefined,
    ...derived,
  };
}

export function mapDbPaymentToPayment(
  row: DbPaymentWithRelations,
  transactions: DbPaymentTransaction[]
): Payment {
  const reservation = row.reservation;
  return mapPaymentCore(
    row,
    {
      guestId: row.guest_id,
      guestName: row.guest.full_name,
      reservationId: row.reservation_id,
      reservationNumber: reservation.reservation_number,
      roomNumber: reservation.room.room_number,
    },
    transactions
  );
}

export function mapDbPaymentRowToPayment(
  row: DbPayment,
  relations: {
    guestName: string;
    reservationNumber: string;
    roomNumber: string;
  },
  transactions: DbPaymentTransaction[]
): Payment {
  return mapPaymentCore(
    row,
    {
      guestId: row.guest_id,
      guestName: relations.guestName,
      reservationId: row.reservation_id,
      reservationNumber: relations.reservationNumber,
      roomNumber: relations.roomNumber,
    },
    transactions
  );
}
