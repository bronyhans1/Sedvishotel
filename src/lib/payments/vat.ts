import { roundCurrency } from "@/lib/payments/currency";
import {
  computeVatOnBase,
  computeVatOnPaymentAmount,
  computeInvoiceTotal,
} from "@/lib/payments/payment-settlement";

export {
  computeVatOnBase,
  computeVatOnPaymentAmount,
  computeInvoiceTotal,
};

/** @deprecated Use computeVatOnPaymentAmount — tax-exclusive model */
export function splitTaxInclusiveAmount(
  amount: number,
  rate: number
): { subtotal: number; vatAmount: number } {
  if (amount <= 0 || rate <= 0) {
    return { subtotal: roundCurrency(amount), vatAmount: 0 };
  }
  const vatAmount = roundCurrency((amount * rate) / (1 + rate));
  return {
    subtotal: roundCurrency(amount - vatAmount),
    vatAmount,
  };
}

/** @deprecated Use computeInvoiceTotal */
export function addTaxInclusive(subtotal: number, rate: number): number {
  return computeInvoiceTotal(subtotal, true, rate);
}

/** @deprecated */
export function taxExclusivePortion(
  taxInclusiveAmount: number,
  reservationSubtotal: number,
  reservationTotal: number
): number {
  if (taxInclusiveAmount <= 0) return 0;
  if (reservationTotal <= 0) return roundCurrency(taxInclusiveAmount);
  return roundCurrency(
    taxInclusiveAmount * (reservationSubtotal / reservationTotal)
  );
}

/**
 * VAT fields for a payment transaction (tax-exclusive invoice model).
 * @param paymentAmount — cash collected on this transaction
 * @param chargeBase — accommodation charge before VAT
 */
export function computeTransactionVatFields(
  paymentAmount: number,
  vatApplied: boolean,
  vatRate: number,
  chargeBase?: number
): { vatAmount: number; baseAmount: number } {
  const base = roundCurrency(chargeBase ?? paymentAmount);
  const invoiceVat = vatApplied ? computeVatOnBase(base, vatRate) : 0;
  const invoiceTotal = computeInvoiceTotal(base, vatApplied, vatRate);
  return computeVatOnPaymentAmount(
    paymentAmount,
    invoiceTotal,
    invoiceVat,
    vatApplied
  );
}

export function aggregateVatFromTransactions(
  transactions: {
    amount: number;
    vat_applied?: boolean | null;
    vat_amount?: number | null;
  }[]
): {
  vatCollected: number;
  vatExemptRevenue: number;
  vatOverrideCount: number;
} {
  let vatCollected = 0;
  let vatExemptRevenue = 0;
  let vatOverrideCount = 0;

  for (const tx of transactions) {
    const amount = Number(tx.amount);
    if (amount <= 0) continue;

    const vatApplied = tx.vat_applied !== false;
    const vatAmount = roundCurrency(Number(tx.vat_amount ?? 0));

    if (vatApplied && vatAmount > 0) {
      vatCollected = roundCurrency(vatCollected + vatAmount);
    } else if (!vatApplied) {
      vatExemptRevenue = roundCurrency(vatExemptRevenue + amount);
      vatOverrideCount += 1;
    }
  }

  return { vatCollected, vatExemptRevenue, vatOverrideCount };
}
