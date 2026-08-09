import { buildPosBusinessDaySummary } from "@/lib/pos/business-day-summary";
import { aggregatePosPaymentTotals } from "@/lib/night-audit/pos-totals";
import { roundCurrency } from "@/lib/payments/currency";
import type { IInventoryRepository } from "@/repositories/inventory.repository";
import type { IPosRepository } from "@/repositories/pos.repository";
import type { IProductRepository } from "@/repositories/product.repository";
import type { AuthSession } from "@/services/auth.service";
import { ServiceError } from "@/services/types";
import type { ServiceContext } from "@/services/types";
import { sessionHasPermission } from "@/lib/auth/permissions";
import type {
  PosBusinessDaySummary,
  PosRegisterDayStrip,
} from "@/types/pos-dashboard";

export interface IPosDashboardService {
  getBusinessDaySummary(
    ctx: ServiceContext,
    session: AuthSession,
    businessDate: string
  ): Promise<PosBusinessDaySummary>;
  getRegisterDayStrip(
    ctx: ServiceContext,
    session: AuthSession,
    businessDate: string
  ): Promise<PosRegisterDayStrip>;
}

export class PosDashboardService implements IPosDashboardService {
  constructor(
    private readonly pos: IPosRepository,
    private readonly products: IProductRepository,
    private readonly inventory: IInventoryRepository
  ) {}

  private requireView(session: AuthSession) {
    if (!sessionHasPermission(session, "pos", "view")) {
      throw new ServiceError("Forbidden", "FORBIDDEN", 403);
    }
  }

  async getBusinessDaySummary(
    _ctx: ServiceContext,
    session: AuthSession,
    businessDate: string
  ): Promise<PosBusinessDaySummary> {
    this.requireView(session);

    const [sales, lowStockRows, allProducts] = await Promise.all([
      this.pos.listSalesWithItemsForBusinessDate(businessDate),
      this.inventory.getLowStockProducts(),
      this.products.list(true),
    ]);

    const neededIds = new Set(
      sales.flatMap((sale) => (sale.items ?? []).map((item) => item.product_id))
    );
    const productCosts = allProducts
      .filter((product) => neededIds.has(product.id))
      .map((product) => ({
        id: product.id,
        costPrice:
          product.cost_price != null ? Number(product.cost_price) : null,
      }));

    return buildPosBusinessDaySummary({
      businessDate,
      sales,
      productCosts,
      lowStock: lowStockRows.map((row) => ({
        id: row.id,
        name: row.name,
        sku: row.sku,
        currentQty: Number(row.current_stock),
        minimumQty: Number(row.minimum_stock),
      })),
    });
  }

  async getRegisterDayStrip(
    _ctx: ServiceContext,
    session: AuthSession,
    businessDate: string
  ): Promise<PosRegisterDayStrip> {
    this.requireView(session);
    const [sales, payments] = await Promise.all([
      this.pos.listSalesForBusinessDate(businessDate),
      this.pos.listPaymentsForBusinessDate(businessDate),
    ]);
    const completed = sales.filter((s) => s.payment_status !== "void");
    const paymentTotals = aggregatePosPaymentTotals(payments);
    const salesFromSales = roundCurrency(
      completed.reduce((sum, s) => sum + Number(s.total), 0)
    );
    const salesToday =
      paymentTotals.grossRevenue > 0
        ? paymentTotals.grossRevenue
        : salesFromSales;

    return {
      businessDate,
      salesToday,
      transactions: completed.length,
    };
  }
}
