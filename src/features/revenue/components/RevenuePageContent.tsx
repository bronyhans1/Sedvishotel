"use client";

import { SimpleBarChart } from "@/components/charts/SimpleBarChart";
import { PageContainer } from "@/components/shared/PageContainer";
import { StatCard } from "@/components/shared/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import type { RevenueData } from "@/types/revenue";
import {
  TrendingUp,
  Calendar,
  BedDouble,
  Percent,
  Award,
  Star,
  AlertCircle,
  FileText,
} from "lucide-react";

type RevenuePageContentProps = {
  data: RevenueData;
};

export function RevenuePageContent({ data }: RevenuePageContentProps) {
  return (
    <PageContainer title="Revenue" description={`Financial analytics for ${siteConfig.name}.`}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard title="Revenue Today" value={formatCurrency(data.kpis.revenueToday)} icon={TrendingUp} iconClassName="bg-emerald-500/10 text-emerald-600" />
        <StatCard title="Revenue This Week" value={formatCurrency(data.kpis.revenueWeek)} icon={Calendar} />
        <StatCard title="Revenue This Month" value={formatCurrency(data.kpis.revenueMonth)} icon={Calendar} />
        <StatCard title="Revenue This Year" value={formatCurrency(data.kpis.revenueYear)} icon={TrendingUp} />
        <StatCard title="Outstanding Balances" value={formatCurrency(data.kpis.outstandingBalances)} icon={AlertCircle} iconClassName="bg-amber-500/10 text-amber-600" />
        <StatCard title="Occupancy Rate" value={`${data.kpis.occupancyRate}%`} icon={Percent} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Monthly Revenue Trend</CardTitle></CardHeader>
          <CardContent><SimpleBarChart data={data.monthlyTrend} monetary /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Weekly Revenue Trend</CardTitle></CardHeader>
          <CardContent><SimpleBarChart data={data.weeklyTrend} monetary /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Revenue by Room Type</CardTitle></CardHeader>
          <CardContent><SimpleBarChart data={data.byRoomType} monetary /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Revenue by Payment Method</CardTitle></CardHeader>
          <CardContent><SimpleBarChart data={data.byPaymentMethod} monetary /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Discount by Pricing Mode</CardTitle></CardHeader>
          <CardContent><SimpleBarChart data={data.discountByPricingMode} monetary /></CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Award className="h-4 w-4" /> Best performing</div>
            <p className="mt-1 font-semibold">{data.insights.bestPerformingRoomType}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Star className="h-4 w-4" /> Highest revenue day</div>
            <p className="mt-1 font-semibold">{data.insights.highestRevenueDay}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><BedDouble className="h-4 w-4" /> Average daily rate</div>
            <p className="mt-1 text-xl font-bold">{formatCurrency(data.kpis.averageDailyRate)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><FileText className="h-4 w-4" /> Invoices paid / unpaid</div>
            <p className="mt-1 font-semibold">{data.kpis.paidInvoices} paid · {data.kpis.unpaidInvoices} unpaid</p>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
