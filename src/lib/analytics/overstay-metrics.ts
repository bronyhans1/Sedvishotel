import { roundCurrency } from "@/lib/payments/currency";
import type { OverstayCharge } from "@/types/overstay";

/** Reuse existing analytics pipeline — summarize overstay charge ledger. */
export function summarizeOverstayAnalytics(
  charges: OverstayCharge[],
  asOfDate?: string
): {
  overstayRevenue: number;
  overstayCharges: number;
  waivedOverstayCharges: number;
  pendingOverstayCharges: number;
  longestOverstayNights: number;
  monthlyOverstayRevenue: number;
  averageOverstayNightsFromCharges: number;
} {
  const posted = charges.filter((c) => c.status === "posted");
  const waived = charges.filter((c) => c.status === "waived");
  const pending = charges.filter(
    (c) => c.status === "pending" || c.status === "approved"
  );

  const overstayRevenue = roundCurrency(
    posted.reduce((sum, c) => sum + c.amount, 0)
  );
  const monthPrefix = asOfDate?.slice(0, 7);
  const monthlyOverstayRevenue = monthPrefix
    ? roundCurrency(
        posted
          .filter((c) => c.businessDate.startsWith(monthPrefix))
          .reduce((sum, c) => sum + c.amount, 0)
      )
    : overstayRevenue;

  const longestOverstayNights = charges.reduce(
    (max, c) => Math.max(max, c.overstayDays),
    0
  );

  const nightSum = charges.reduce((sum, c) => sum + c.overstayDays, 0);

  return {
    overstayRevenue,
    overstayCharges: posted.length,
    waivedOverstayCharges: waived.length,
    pendingOverstayCharges: pending.length,
    longestOverstayNights,
    monthlyOverstayRevenue,
    averageOverstayNightsFromCharges:
      charges.length > 0
        ? Math.round((nightSum / charges.length) * 10) / 10
        : 0,
  };
}
