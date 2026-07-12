"use client";

import { useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { PageContainer } from "@/components/shared/PageContainer";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminQuickAccess } from "@/features/dashboard/components/AdminQuickAccess";
import { DashboardStatsGrid } from "@/features/dashboard/components/DashboardStats";
import { HotelSummaryCard } from "@/features/dashboard/components/HotelSummaryCard";
import { PendingWebsiteReservationsWidget } from "@/features/dashboard/components/PendingWebsiteReservationsWidget";
import { RecentActivity } from "@/features/dashboard/components/RecentActivity";
import { PaymentStatusBadge } from "@/components/payments/PaymentStatusBadge";
import { ReservationStatusBadge } from "@/components/reservations/ReservationStatusBadge";
import { SHMS_MUTATION_EVENT } from "@/hooks/use-live-refresh";
import { useSyncedProp } from "@/hooks/use-synced-prop";
import { siteConfig } from "@/config/site";
import { formatCurrency } from "@/lib/utils";
import { GroupDashboardWidgets } from "@/features/dashboard/components/GroupDashboardWidgets";
import type { DashboardHomeData } from "@/types/dashboard-home";
import type { GroupDashboardContract } from "@/types/group-dashboard";
import {
  CircleDollarSign,
  Percent,
  LogIn,
  LogOut,
  AlertCircle,
  Wallet,
  BedDouble,
  Calendar,
} from "lucide-react";

type DashboardHomeContentProps = {
  data: DashboardHomeData;
  groupWidgets?: GroupDashboardContract;
};

export function DashboardHomeContent({
  data: initialData,
  groupWidgets,
}: DashboardHomeContentProps) {
  const [data] = useSyncedProp(initialData);
  const router = useRouter();
  const [, startTransition] = useTransition();

  useEffect(() => {
    const onMutation = () => {
      startTransition(() => router.refresh());
    };
    window.addEventListener(SHMS_MUTATION_EVENT, onMutation);
    return () => window.removeEventListener(SHMS_MUTATION_EVENT, onMutation);
  }, [router]);

  const {
    stats,
    occupancy,
    paymentStats,
    revenueMonth,
    pendingCheckIns,
    pendingCheckOuts,
    activeStays,
    recentPayments,
    recentReservations,
    pendingWebsiteReservations,
    recentActivity,
    staffLogs,
    outstandingTasks,
    operationalAlerts,
    showFinancials,
  } = data;

  return (
    <PageContainer
      title="Dashboard"
      description={`Overview of ${siteConfig.name} operations for today.`}
      actions={
        <>
          <StatusBadge status="live" label="Live Data" />
          <Button size="sm" asChild>
            <Link href="/dashboard/reservations">
              <Plus className="h-4 w-4" />
              Reservations
            </Link>
          </Button>
        </>
      }
    >
      <DashboardStatsGrid stats={stats} />

      <div className="grid gap-6 lg:grid-cols-3">
        <HotelSummaryCard occupancy={occupancy} />

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Occupancy Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Current occupancy</span>
                <span className="font-semibold">{stats.occupancyRate}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${stats.occupancyRate}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 text-center text-sm sm:grid-cols-3 lg:grid-cols-5">
                <div>
                  <p className="text-2xl font-bold text-emerald-600">{stats.availableRooms}</p>
                  <p className="text-muted-foreground">Available</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">{stats.occupiedRooms}</p>
                  <p className="text-muted-foreground">Occupied</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-600">{stats.reservedRooms}</p>
                  <p className="text-muted-foreground">Reserved</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-violet-600">{stats.cleaningRooms}</p>
                  <p className="text-muted-foreground">Cleaning</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-600">{stats.maintenanceRooms}</p>
                  <p className="text-muted-foreground">Maintenance</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {showFinancials && (
          <>
            <StatCard title="Revenue Today" value={formatCurrency(paymentStats.revenueToday)} icon={CircleDollarSign} iconClassName="bg-emerald-500/10 text-emerald-600" />
            <StatCard title="Revenue Month" value={formatCurrency(revenueMonth)} icon={Calendar} />
            <StatCard title="Outstanding Balances" value={formatCurrency(paymentStats.outstandingBalances)} icon={AlertCircle} iconClassName="bg-amber-500/10 text-amber-600" />
          </>
        )}
        <StatCard title="Occupancy" value={`${stats.occupancyRate}%`} icon={Percent} />
        <StatCard title="Pending Check-Ins" value={pendingCheckIns} icon={LogIn} iconClassName="bg-amber-500/10 text-amber-600" />
        <StatCard title="Pending Check-Outs" value={pendingCheckOuts} icon={LogOut} />
        <StatCard title="Active Stays" value={activeStays} icon={BedDouble} iconClassName="bg-blue-500/10 text-blue-600" />
        {showFinancials && (
          <StatCard title="Payments Today" value={paymentStats.revenueToday > 0 ? formatCurrency(paymentStats.revenueToday) : "0"} icon={Wallet} />
        )}
      </div>

      <PendingWebsiteReservationsWidget reservations={pendingWebsiteReservations} />

      {groupWidgets && <GroupDashboardWidgets data={groupWidgets} />}

      <RecentActivity items={recentActivity} />

      <AdminQuickAccess
        staffLogs={staffLogs}
        outstandingTasks={outstandingTasks}
        operationalAlerts={operationalAlerts}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Reservations</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/reservations">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Booking</th>
                    <th className="pb-2 font-medium">Guest</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {recentReservations.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-4 text-muted-foreground">No reservations yet</td>
                    </tr>
                  ) : (
                    recentReservations.map((r) => (
                      <tr key={r.id}>
                        <td className="py-2 font-mono text-xs">
                          <Link href={`/dashboard/reservations/${r.id}`} className="text-primary hover:underline">
                            {r.reservationNumber}
                          </Link>
                        </td>
                        <td className="py-2">{r.guestName}</td>
                        <td className="py-2"><ReservationStatusBadge status={r.status} /></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {showFinancials && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Recent Payments</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/payments">View all</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 font-medium">Reference</th>
                      <th className="pb-2 font-medium">Guest</th>
                      <th className="pb-2 font-medium">Amount</th>
                      <th className="pb-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {recentPayments.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-4 text-muted-foreground">No payments yet</td>
                      </tr>
                    ) : (
                      recentPayments.map((p) => (
                        <tr key={p.id}>
                          <td className="py-2 font-mono text-xs">
                            <Link href={`/dashboard/payments/${p.id}`} className="text-primary hover:underline">
                              {p.reference}
                            </Link>
                          </td>
                          <td className="py-2">{p.guestName}</td>
                          <td className="py-2">{formatCurrency(p.amount)}</td>
                          <td className="py-2"><PaymentStatusBadge status={p.status} /></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
