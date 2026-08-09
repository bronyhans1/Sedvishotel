import { roundCurrency } from "@/lib/payments/currency";
import { aggregatePosPaymentTotals } from "@/lib/night-audit/pos-totals";
import type { DbSaleWithRelations } from "@/types/database";
import type {
  PosBusinessDaySummary,
  PosDashboardHourlyPoint,
  PosDashboardLowStockItem,
  PosDashboardPaymentSlice,
  PosDashboardTopProduct,
} from "@/types/pos-dashboard";

type ProductCostRow = {
  id: string;
  costPrice: number | null;
};

/**
 * Pure Business Day POS aggregation — no wall-clock dates.
 * Reuses Night Audit payment totals helper for payment method breakdown.
 */
export function buildPosBusinessDaySummary(input: {
  businessDate: string;
  sales: DbSaleWithRelations[];
  productCosts: ProductCostRow[];
  lowStock: PosDashboardLowStockItem[];
}): PosBusinessDaySummary {
  const costByProduct = new Map(
    input.productCosts.map((p) => [p.id, Number(p.costPrice ?? 0)])
  );

  const completed = input.sales.filter((s) => s.payment_status !== "void");
  const payments = completed.flatMap((s) => s.payments ?? []);
  const paymentTotals = aggregatePosPaymentTotals(payments);

  let itemsSold = 0;
  let cogs = 0;
  let discounts = 0;
  let vatCollected = 0;
  let grossSales = 0;

  const productAgg = new Map<
    string,
    { productId: string; productName: string; quantitySold: number; revenue: number }
  >();

  const hourly = new Map<number, number>();

  for (const sale of completed) {
    grossSales = roundCurrency(grossSales + Number(sale.total));
    discounts = roundCurrency(discounts + Number(sale.discount ?? 0));
    vatCollected = roundCurrency(vatCollected + Number(sale.vat_amount ?? 0));

    const hour = new Date(sale.created_at).getUTCHours();
    hourly.set(
      hour,
      roundCurrency((hourly.get(hour) ?? 0) + Number(sale.total))
    );

    for (const item of sale.items ?? []) {
      const qty = Number(item.quantity);
      const lineTotal = Number(item.total);
      itemsSold += qty;
      const unitCost = costByProduct.get(item.product_id) ?? 0;
      cogs = roundCurrency(cogs + unitCost * qty);

      const existing = productAgg.get(item.product_id) ?? {
        productId: item.product_id,
        productName: item.product_name,
        quantitySold: 0,
        revenue: 0,
      };
      existing.quantitySold += qty;
      existing.revenue = roundCurrency(existing.revenue + lineTotal);
      productAgg.set(item.product_id, existing);
    }
  }

  const transactions = completed.length;
  const netSales = roundCurrency(grossSales - discounts);
  // Prefer payment-gross when payments exist (aligned with Night Audit POS cash totals);
  // fall back to sale totals for room-charge / unpaid edge cases.
  const salesToday =
    paymentTotals.grossRevenue > 0 ? paymentTotals.grossRevenue : grossSales;
  const grossProfit = roundCurrency(salesToday - cogs);
  const averageSale =
    transactions > 0 ? roundCurrency(salesToday / transactions) : 0;

  const topProducts: PosDashboardTopProduct[] = [...productAgg.values()]
    .sort((a, b) => b.quantitySold - a.quantitySold || b.revenue - a.revenue)
    .slice(0, 5)
    .map((row) => ({
      productId: row.productId,
      productName: row.productName,
      quantitySold: row.quantitySold,
      revenue: row.revenue,
      href: `/dashboard/pos/history?dateFrom=${input.businessDate}&dateTo=${input.businessDate}&search=${encodeURIComponent(row.productName)}`,
    }));

  const paymentGross = paymentTotals.grossRevenue || 1;
  const paymentBreakdown: PosDashboardPaymentSlice[] = (
    [
      { method: "cash" as const, label: "Cash", amount: paymentTotals.cashTotal },
      {
        method: "mobile_money" as const,
        label: "Mobile Money",
        amount: paymentTotals.mobileMoneyTotal,
      },
      { method: "card" as const, label: "Card", amount: paymentTotals.cardTotal },
      {
        method: "other" as const,
        label: "Other / Room Charge",
        amount: paymentTotals.otherTotal,
      },
    ] as const
  )
    .filter((row) => row.amount > 0)
    .map((row) => ({
      ...row,
      percent: Math.round((row.amount / paymentGross) * 1000) / 10,
    }));

  const hourlySales: PosDashboardHourlyPoint[] = [...hourly.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([hour, amount]) => ({
      hour,
      label: `${String(hour).padStart(2, "0")}:00`,
      amount,
    }));

  const historyHref = `/dashboard/pos/history?dateFrom=${input.businessDate}&dateTo=${input.businessDate}`;

  return {
    businessDate: input.businessDate,
    kpis: {
      salesToday,
      transactions,
      itemsSold,
      grossProfit,
      averageSale,
      cogs,
      discounts,
      vatCollected,
      netSales,
      grossSales: salesToday,
    },
    topProducts,
    paymentBreakdown,
    revenueBreakdown: {
      grossSales: salesToday,
      discounts,
      vatCollected,
      netSales,
      grossProfit,
      cogs,
    },
    hourlySales,
    lowStock: input.lowStock.slice(0, 5).map((item) => ({
      ...item,
      href: `/dashboard/inventory/stock?filter=low_stock`,
    })),
    links: {
      salesToday: historyHref,
      transactions: historyHref,
      lowStock: `/dashboard/inventory/stock?filter=low_stock`,
      register: `/dashboard/pos/register`,
      salesHistory: `/dashboard/pos/history`,
      inventory: `/dashboard/inventory/stock`,
      products: `/dashboard/inventory/products`,
    },
  };
}
