import { nightsBetween } from "@/lib/utils";

export type StayPricingInput = {
  roomRate: number;
  checkIn: string;
  checkOut: string;
  taxRate: number;
  serviceChargeRate: number;
};

export type StayPricingResult = {
  numberOfNights: number;
  subtotal: number;
  serviceCharge: number;
  taxes: number;
  totalAmount: number;
};

/** Normalizes DB/UI rates (0.15 or 15) to a decimal multiplier. */
export function normalizeRatePercent(value: number): number {
  return value > 1 ? value / 100 : value;
}

export function formatRatePercentLabel(value: number): string {
  const percent = normalizeRatePercent(value) * 100;
  return Number.isInteger(percent) ? String(percent) : percent.toFixed(1);
}

/** Shared stay pricing — subtotal, service charge, and tax on subtotal (SHMS rule). */
export function computeStayPricing(input: StayPricingInput): StayPricingResult {
  const taxRate = normalizeRatePercent(input.taxRate);
  const serviceRate = normalizeRatePercent(input.serviceChargeRate);
  const numberOfNights = nightsBetween(input.checkIn, input.checkOut);
  const subtotal = roomRateTotal(input.roomRate, numberOfNights);
  const serviceCharge = Math.round(subtotal * serviceRate);
  const taxes = Math.round(subtotal * taxRate);
  const totalAmount = subtotal + serviceCharge + taxes;

  return {
    numberOfNights,
    subtotal,
    serviceCharge,
    taxes,
    totalAmount,
  };
}

function roomRateTotal(roomRate: number, numberOfNights: number): number {
  return roomRate * numberOfNights;
}

/** Derives the effective tax percentage from a reservation pricing snapshot. */
export function deriveTaxPercentFromSnapshot(subtotal: number, taxes: number): string {
  if (subtotal <= 0 || taxes <= 0) return "0";
  const percent = (taxes / subtotal) * 100;
  return Number.isInteger(percent) ? String(percent) : percent.toFixed(1);
}

/** Label for reservation payment summary, e.g. "Taxes (15%)" or "Taxes (0%)". */
export function formatTaxSummaryLabel(subtotal: number, taxes: number): string {
  return `Taxes (${deriveTaxPercentFromSnapshot(subtotal, taxes)}%)`;
}

/** Resolves tax/service rates from a stored reservation snapshot, or falls back to hotel settings. */
export function resolvePricingRatesFromSnapshot(
  subtotal: number,
  taxes: number,
  serviceCharge: number,
  settings: { taxRate: number; serviceCharge: number }
): { taxRate: number; serviceChargeRate: number } {
  if (subtotal > 0) {
    const taxDecimal = taxes / subtotal;
    const serviceDecimal = serviceCharge / subtotal;
    return {
      taxRate: taxDecimal <= 1 ? taxDecimal : taxDecimal * 100,
      serviceChargeRate: serviceDecimal <= 1 ? serviceDecimal : serviceDecimal * 100,
    };
  }
  return {
    taxRate: settings.taxRate,
    serviceChargeRate: settings.serviceCharge,
  };
}
