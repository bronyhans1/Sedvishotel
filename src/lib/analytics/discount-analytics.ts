import {
  computeRackRevenue,
  computeTotalDiscount,
} from "@/lib/reservations/rate-management";
import {
  PRICING_MODE_LABELS,
  REPORT_PRICING_MODES,
  type PricingMode,
} from "@/types/pricing";
import type { ChartDataPoint } from "@/types/revenue";
import type { Reservation } from "@/types/reservation";

export type DiscountAnalytics = {
  rackRevenue: number;
  netRevenue: number;
  discountGiven: number;
  overrideAmount: number;
  averageDiscountPercent: number;
  byPricingMode: ChartDataPoint[];
  byOverrideReason: ChartDataPoint[];
};

export function computeDiscountAnalytics(
  reservations: Reservation[]
): DiscountAnalytics {
  const active = reservations.filter((r) => r.status !== "cancelled");

  let rackRevenue = 0;
  let netRevenue = 0;
  let discountGiven = 0;
  let weightedDiscount = 0;
  let discountedNights = 0;

  const modeTotals = new Map<string, number>();
  const reasonTotals = new Map<string, number>();

  for (const reservation of active) {
    const rack = computeRackRevenue(
      reservation.rackRate,
      reservation.numberOfNights
    );
    const net = reservation.subtotal;
    const discount = computeTotalDiscount(
      reservation.discountAmount,
      reservation.numberOfNights
    );

    rackRevenue += rack;
    netRevenue += net;
    discountGiven += discount;

    const modeLabel =
      PRICING_MODE_LABELS[reservation.pricingMode as PricingMode] ??
      reservation.pricingMode;

    if (reservation.discountAmount > 0) {
      weightedDiscount += reservation.discountPercent * reservation.numberOfNights;
      discountedNights += reservation.numberOfNights;
      modeTotals.set(modeLabel, (modeTotals.get(modeLabel) ?? 0) + discount);
      if (reservation.overrideReason) {
        reasonTotals.set(
          reservation.overrideReason,
          (reasonTotals.get(reservation.overrideReason) ?? 0) + discount
        );
      }
    }
  }

  const byPricingMode: ChartDataPoint[] = REPORT_PRICING_MODES.map((mode) => {
    const label = PRICING_MODE_LABELS[mode];
    return {
      label,
      value: modeTotals.get(label) ?? 0,
    };
  });

  const byOverrideReason = [...reasonTotals.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  return {
    rackRevenue,
    netRevenue,
    discountGiven,
    overrideAmount: discountGiven,
    averageDiscountPercent:
      discountedNights > 0
        ? Math.round((weightedDiscount / discountedNights) * 10) / 10
        : 0,
    byPricingMode,
    byOverrideReason,
  };
}
