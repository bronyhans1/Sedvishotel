import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Ghana Cedi display — e.g. GH₵ 1,375.00 */
export function formatCurrency(amount: number): string {
  const formatted = new Intl.NumberFormat("en-GH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `GH₵ ${formatted}`;
}

/** @deprecated Use formatCurrency */
export const formatGHS = formatCurrency;

export function parseDateString(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  const start = parseDateString(checkIn);
  const end = parseDateString(checkOut);
  const diff = end.getTime() - start.getTime();
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function datesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
): boolean {
  const aS = parseDateString(aStart).getTime();
  const aE = parseDateString(aEnd).getTime();
  const bS = parseDateString(bStart).getTime();
  const bE = parseDateString(bEnd).getTime();
  return aS < bE && bS < aE;
}
