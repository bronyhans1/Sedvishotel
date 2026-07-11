import { PAYMENT_METHOD_LABELS } from "@/lib/analytics/payment-labels";
import type { DbPaymentTransaction } from "@/types/database";
import type { PaymentMethod, TransactionPaymentMethod } from "@/types/payment";

type MethodCarrier = Pick<DbPaymentTransaction, "method" | "amount">;

function positiveTransactionMethods(
  transactions: MethodCarrier[]
): TransactionPaymentMethod[] {
  const methods = new Set<TransactionPaymentMethod>();
  for (const tx of transactions) {
    if (Number(tx.amount) <= 0 || tx.method === "mixed") continue;
    methods.add(tx.method as TransactionPaymentMethod);
  }
  return [...methods];
}

export function aggregatePaymentMethod(
  transactions: MethodCarrier[]
): PaymentMethod {
  const methods = positiveTransactionMethods(transactions);
  if (methods.length === 0) return "cash";
  if (methods.length === 1) return methods[0];
  return "mixed";
}

export function getMethodsUsed(
  transactions: MethodCarrier[]
): TransactionPaymentMethod[] {
  return positiveTransactionMethods(transactions).sort((a, b) =>
    PAYMENT_METHOD_LABELS[a].localeCompare(PAYMENT_METHOD_LABELS[b])
  );
}

export function formatMethodsUsed(
  methods: TransactionPaymentMethod[]
): string {
  return methods.map((m) => PAYMENT_METHOD_LABELS[m]).join(", ");
}

export function countPositiveTransactions(
  transactions: MethodCarrier[]
): number {
  return transactions.filter((tx) => Number(tx.amount) > 0).length;
}
