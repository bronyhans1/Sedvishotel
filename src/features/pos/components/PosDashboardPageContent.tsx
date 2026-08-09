"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  Boxes,
  Package,
  Percent,
  Receipt,
  ShoppingBag,
  ShoppingCart,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { SimpleBarChart } from "@/components/charts/SimpleBarChart";
import { PageContainer } from "@/components/shared/PageContainer";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { siteConfig } from "@/config/site";
import type { PosAccess } from "@/lib/auth/pos-access.types";
import { formatCurrency } from "@/lib/utils";
import type { PosBusinessDaySummary } from "@/types/pos-dashboard";

type Props = {
  summary: PosBusinessDaySummary;
  access: PosAccess;
};

function ClickableStat({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="block rounded-xl transition hover:ring-2 hover:ring-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      {children}
    </Link>
  );
}

export function PosDashboardPageContent({ summary, access }: Props) {
  const { kpis, links } = summary;
  const hourlyChart = summary.hourlySales.map((row) => ({
    label: row.label,
    value: row.amount,
  }));
  const paymentChart = summary.paymentBreakdown.map((row) => ({
    label: row.label,
    value: row.amount,
  }));

  return (
    <PageContainer
      title="POS Dashboard"
      description={`Business Day ${summary.businessDate} · Retail sales for ${siteConfig.name}`}
      actions={
        access.canCreate ? (
          <Button asChild className="bg-brand-gold text-brand-navy hover:bg-brand-gold/90">
            <Link href={links.register}>
              <ShoppingCart className="h-4 w-4" />
              Go to Register
            </Link>
          </Button>
        ) : undefined
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <ClickableStat href={links.salesToday}>
          <StatCard
            title="Sales Today"
            value={formatCurrency(kpis.salesToday)}
            description={`Business Date ${summary.businessDate}`}
            icon={TrendingUp}
            iconClassName="bg-emerald-500/10 text-emerald-600"
          />
        </ClickableStat>
        <ClickableStat href={links.transactions}>
          <StatCard
            title="Transactions"
            value={kpis.transactions}
            description="Completed POS sales"
            icon={Receipt}
          />
        </ClickableStat>
        <StatCard
          title="Items Sold"
          value={kpis.itemsSold}
          description="Total quantity"
          icon={Package}
        />
        <StatCard
          title="Gross Profit"
          value={formatCurrency(kpis.grossProfit)}
          description="Sales − COGS"
          icon={Wallet}
          iconClassName="bg-brand-gold/15 text-brand-gold"
        />
        <StatCard
          title="Average Sale"
          value={formatCurrency(kpis.averageSale)}
          description="Sales ÷ transactions"
          icon={ShoppingBag}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s Top Selling Products</CardTitle>
          </CardHeader>
          <CardContent>
            {summary.topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No completed sales for this Business Date yet.
              </p>
            ) : (
              <ul className="divide-y">
                {summary.topProducts.map((product) => (
                  <li key={product.productId}>
                    <Link
                      href={product.href}
                      className="flex items-center justify-between gap-3 py-3 transition hover:bg-muted/40"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{product.productName}</p>
                        <p className="text-xs text-muted-foreground">
                          {product.quantitySold} Sold
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2 font-semibold">
                        {formatCurrency(product.revenue)}
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {summary.paymentBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payments recorded.</p>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  {summary.paymentBreakdown.map((slice) => (
                    <div
                      key={slice.method}
                      className="rounded-lg border px-3 py-3"
                    >
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        {slice.label}
                      </p>
                      <p className="mt-1 text-lg font-semibold">
                        {formatCurrency(slice.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">{slice.percent}%</p>
                    </div>
                  ))}
                </div>
                <SimpleBarChart data={paymentChart} monetary />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  ["Gross Sales", summary.revenueBreakdown.grossSales],
                  ["Discounts", summary.revenueBreakdown.discounts],
                  ["VAT Collected", summary.revenueBreakdown.vatCollected],
                  ["Net Sales", summary.revenueBreakdown.netSales],
                  ["Gross Profit", summary.revenueBreakdown.grossProfit],
                  ["COGS", summary.revenueBreakdown.cogs],
                ] as const
              ).map(([label, value]) => (
                <div key={label} className="rounded-lg border px-3 py-3">
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    {label}
                  </dt>
                  <dd className="mt-1 text-lg font-semibold">
                    {formatCurrency(value)}
                  </dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hourly Sales</CardTitle>
          </CardHeader>
          <CardContent>
            {hourlyChart.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hourly activity for this Business Date.
              </p>
            ) : (
              <SimpleBarChart data={hourlyChart} monetary />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Low Stock Snapshot</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href={links.lowStock}>View Inventory</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {summary.lowStock.length === 0 ? (
              <p className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
                <Boxes className="h-4 w-4" /> No low-stock products right now.
              </p>
            ) : (
              <ul className="divide-y">
                {summary.lowStock.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Qty {item.currentQty} · Min {item.minimumQty}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={item.href ?? links.lowStock}>
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Quick View
                      </Link>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {access.canCreate ? (
              <Button asChild>
                <Link href={links.register}>
                  <ShoppingCart className="h-4 w-4" />
                  Go to Register
                </Link>
              </Button>
            ) : null}
            <Button variant="outline" asChild>
              <Link href={links.salesHistory}>
                <Receipt className="h-4 w-4" />
                Sales History
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={links.inventory}>
                <Boxes className="h-4 w-4" />
                Inventory
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={links.products}>
                <Package className="h-4 w-4" />
                Products
              </Link>
            </Button>
            {access.canCreate ? (
              <Button variant="secondary" asChild>
                <Link href={links.register}>
                  <Banknote className="h-4 w-4" />
                  Open Register
                </Link>
              </Button>
            ) : null}
            <Button variant="ghost" asChild>
              <Link href={links.salesToday}>
                <Percent className="h-4 w-4" />
                Today&apos;s Sales
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
