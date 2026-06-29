"use client";

import { SimpleBarChart } from "@/components/charts/SimpleBarChart";
import { PageContainer } from "@/components/shared/PageContainer";
import { StatCard } from "@/components/shared/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import type { AuditDashboardData } from "@/types/audit";
import {
  Activity,
  CalendarDays,
  CircleDollarSign,
  LogIn,
  LogOut,
  TrendingUp,
  Users,
} from "lucide-react";

type Props = {
  data: AuditDashboardData;
};

export function AuditPageContent({ data }: Props) {
  const { kpis, staffActivityChart, reservationsActivityChart, paymentActivityChart, insights } =
    data;

  return (
    <PageContainer
      title="Audit Dashboard"
      description={`Management oversight for ${siteConfig.name}.`}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard title="Reservations Today" value={kpis.reservationsToday} icon={CalendarDays} />
        <StatCard title="Payments Today" value={kpis.paymentsToday} icon={CircleDollarSign} />
        <StatCard
          title="Revenue Today"
          value={formatCurrency(kpis.revenueToday)}
          icon={TrendingUp}
          iconClassName="bg-emerald-500/10 text-emerald-600"
        />
        <StatCard title="Check-Ins Today" value={kpis.checkInsToday} icon={LogIn} />
        <StatCard title="Check-Outs Today" value={kpis.checkOutsToday} icon={LogOut} />
        <StatCard
          title="Staff Activity Score"
          value={`${kpis.staffActivityScore}%`}
          icon={Activity}
          iconClassName="bg-blue-500/10 text-blue-600"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Staff Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {staffActivityChart.length > 0 ? (
              <SimpleBarChart data={staffActivityChart} />
            ) : (
              <p className="text-sm text-muted-foreground">No staff activity recorded yet.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Reservations Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleBarChart data={reservationsActivityChart} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Payment Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleBarChart data={paymentActivityChart} monetary />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Operational Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {insights.operationalSummary}
            </p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold">Management Insights</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                Most active staff
              </div>
              <p className="mt-1 font-semibold">{insights.mostActiveStaff}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Highest revenue day</p>
              <p className="mt-1 font-semibold">{insights.highestRevenueDay}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Most occupied floor</p>
              <p className="mt-1 font-semibold">{insights.mostOccupiedFloor}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Most popular room type</p>
              <p className="mt-1 font-semibold">{insights.mostPopularRoomType}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Outstanding balances</p>
              <p className="mt-1 text-xl font-bold">
                {formatCurrency(insights.outstandingBalances)}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
