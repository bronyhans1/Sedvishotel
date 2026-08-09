export type PosDashboardPaymentSlice = {
  method: "cash" | "mobile_money" | "card" | "other";
  label: string;
  amount: number;
  percent: number;
};

export type PosDashboardTopProduct = {
  productId: string;
  productName: string;
  quantitySold: number;
  revenue: number;
  href: string;
};

export type PosDashboardHourlyPoint = {
  hour: number;
  label: string;
  amount: number;
};

export type PosDashboardLowStockItem = {
  id: string;
  name: string;
  sku: string;
  currentQty: number;
  minimumQty: number;
  href?: string;
};

export type PosBusinessDayKpis = {
  salesToday: number;
  transactions: number;
  itemsSold: number;
  grossProfit: number;
  averageSale: number;
  cogs: number;
  discounts: number;
  vatCollected: number;
  netSales: number;
  grossSales: number;
};

export type PosBusinessDaySummary = {
  businessDate: string;
  kpis: PosBusinessDayKpis;
  topProducts: PosDashboardTopProduct[];
  paymentBreakdown: PosDashboardPaymentSlice[];
  revenueBreakdown: {
    grossSales: number;
    discounts: number;
    vatCollected: number;
    netSales: number;
    grossProfit: number;
    cogs: number;
  };
  hourlySales: PosDashboardHourlyPoint[];
  lowStock: PosDashboardLowStockItem[];
  links: {
    salesToday: string;
    transactions: string;
    lowStock: string;
    register: string;
    salesHistory: string;
    inventory: string;
    products: string;
  };
};

/** Compact strip for the Register page (cashier-focused). */
export type PosRegisterDayStrip = {
  businessDate: string;
  salesToday: number;
  transactions: number;
};
