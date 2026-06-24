import { roundCurrency } from "@/lib/payments/currency";

export type CashVarianceTone = "zero" | "negative" | "positive";

export function computeCashVariance(expected: number, counted: number): number {
  return roundCurrency(counted - expected);
}

export function getCashVarianceTone(variance: number): CashVarianceTone {
  if (variance === 0) return "zero";
  if (variance < 0) return "negative";
  return "positive";
}

export function cashVarianceClassName(variance: number): string {
  const tone = getCashVarianceTone(variance);
  if (tone === "zero") return "text-emerald-600";
  if (tone === "negative") return "text-red-600";
  return "text-amber-600";
}

export function formatSignedCurrency(amount: number): string {
  const prefix = amount > 0 ? "+" : amount < 0 ? "-" : "";
  return `${prefix}GH₵${Math.abs(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
