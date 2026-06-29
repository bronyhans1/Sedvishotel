import { roundCurrency } from "@/lib/payments/currency";
import type { DbSalePayment } from "@/types/database";
import type { NightAuditSnapshot } from "@/types/night-audit";

export function aggregatePosPaymentTotals(
  payments: DbSalePayment[]
): Pick<
  NightAuditSnapshot,
  | "cashTotal"
  | "mobileMoneyTotal"
  | "cardTotal"
  | "otherTotal"
  | "grossRevenue"
  | "netRevenue"
> {
  let cashTotal = 0;
  let mobileMoneyTotal = 0;
  let cardTotal = 0;
  let otherTotal = 0;
  let grossRevenue = 0;

  for (const payment of payments) {
    const amount = roundCurrency(Number(payment.amount));
    if (amount <= 0) continue;
    grossRevenue = roundCurrency(grossRevenue + amount);
    switch (payment.payment_method) {
      case "cash":
        cashTotal = roundCurrency(cashTotal + amount);
        break;
      case "mobile_money":
        mobileMoneyTotal = roundCurrency(mobileMoneyTotal + amount);
        break;
      case "card":
        cardTotal = roundCurrency(cardTotal + amount);
        break;
      default:
        otherTotal = roundCurrency(otherTotal + amount);
        break;
    }
  }

  return {
    cashTotal,
    mobileMoneyTotal,
    cardTotal,
    otherTotal,
    grossRevenue,
    netRevenue: grossRevenue,
  };
}

export function mergeNightAuditTotals(
  accommodation: NightAuditSnapshot,
  pos: ReturnType<typeof aggregatePosPaymentTotals>,
  posVatCollected: number
): NightAuditSnapshot {
  return {
    ...accommodation,
    cashTotal: roundCurrency(accommodation.cashTotal + pos.cashTotal),
    mobileMoneyTotal: roundCurrency(
      accommodation.mobileMoneyTotal + pos.mobileMoneyTotal
    ),
    cardTotal: roundCurrency(accommodation.cardTotal + pos.cardTotal),
    otherTotal: roundCurrency(accommodation.otherTotal + pos.otherTotal),
    grossRevenue: roundCurrency(accommodation.grossRevenue + pos.grossRevenue),
    netRevenue: roundCurrency(accommodation.netRevenue + pos.netRevenue),
    vatCollected: roundCurrency(accommodation.vatCollected + posVatCollected),
  };
}
