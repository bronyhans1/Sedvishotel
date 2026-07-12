"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Building2,
  Calendar,
  CreditCard,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

import { StatCard } from "@/components/shared/StatCard";
import { SimpleBarChart } from "@/components/charts/SimpleBarChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency } from "@/lib/utils";
import type { CorporateOperationalIntelligence } from "@/types/group-operational-intelligence";

const HEALTH_BADGE = {
  healthy: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40",
  attention: "bg-amber-100 text-amber-800 dark:bg-amber-900/40",
  critical: "bg-rose-100 text-rose-800 dark:bg-rose-900/40",
};

const TIMELINE_FILTERS = [
  "all",
  "financial",
  "operational",
  "guests",
  "rooms",
  "documents",
] as const;

type Props = {
  data: CorporateOperationalIntelligence;
};

export function CorporateExecutiveDashboard({ data }: Props) {
  const { metrics, trends, timeline, health, account } = data;
  const [filter, setFilter] = useState<string>("all");

  const filteredTimeline = useMemo(() => {
    if (filter === "all") return timeline;
    return timeline.filter((e) => e.category === filter);
  }, [timeline, filter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Badge className={cn("border-0 capitalize", HEALTH_BADGE[health])}>
          Corporate Health: {health}
        </Badge>
        <span className="font-mono text-sm text-muted-foreground">{account.accountNumber}</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        <StatCard title="Total Reservations" value={metrics.totalReservations} icon={Calendar} />
        <StatCard title="Active Groups" value={metrics.activeGroups} icon={Users} iconClassName="bg-emerald-500/10 text-emerald-600" />
        <StatCard title="Annual Revenue" value={formatCurrency(metrics.annualRevenue)} icon={TrendingUp} />
        <StatCard title="Monthly Revenue" value={formatCurrency(metrics.monthlyRevenue)} icon={TrendingUp} iconClassName="bg-blue-500/10 text-blue-600" />
        <StatCard title="Outstanding" value={formatCurrency(metrics.outstandingBalance)} icon={Wallet} iconClassName="bg-amber-500/10 text-amber-600" />
        <StatCard title="Credit Used" value={formatCurrency(metrics.creditUsed)} icon={CreditCard} />
        <StatCard
          title="Credit Remaining"
          value={metrics.creditRemaining != null ? formatCurrency(metrics.creditRemaining) : "—"}
          icon={Building2}
        />
        <StatCard title="Avg Stay (nights)" value={metrics.averageStay} icon={Calendar} />
        <StatCard title="Avg Group Size" value={metrics.averageGroupSize} icon={Users} />
        <StatCard title="Avg Spend" value={formatCurrency(metrics.averageSpend)} icon={Wallet} />
        <StatCard title="Current Groups" value={metrics.currentGroups} icon={Users} iconClassName="bg-blue-500/10 text-blue-600" />
        <StatCard title="Upcoming Groups" value={metrics.upcomingGroups} icon={Calendar} />
        <StatCard title="Completed" value={metrics.completedGroups} icon={Users} />
        <StatCard title="Cancelled" value={metrics.cancelledGroups} icon={Users} />
        <StatCard title="VIP Guests" value={metrics.vipGuests} icon={Users} iconClassName="bg-violet-500/10 text-violet-600" />
        <StatCard title="Returning Guests" value={metrics.returningGuests} icon={Users} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Stay Intelligence</CardTitle></CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <p><span className="text-muted-foreground">Last Stay:</span> {metrics.lastStay ?? "—"}</p>
            <p><span className="text-muted-foreground">Next Arrival:</span> {metrics.nextArrival ?? "—"}</p>
            <p><span className="text-muted-foreground">Most Used Room Type:</span> {metrics.mostUsedRoomType ?? "—"}</p>
            <p><span className="text-muted-foreground">Most Frequent Guest:</span> {metrics.mostFrequentGuest ?? "—"}</p>
          </CardContent>
        </Card>

        {trends.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Revenue Trend</CardTitle></CardHeader>
            <CardContent>
              <SimpleBarChart
                data={trends.map((t) => ({ label: t.label, value: t.revenue }))}
                monetary
              />
            </CardContent>
          </Card>
        )}
      </div>

      {trends.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-base">Reservations Trend</CardTitle></CardHeader>
            <CardContent>
              <SimpleBarChart data={trends.map((t) => ({ label: t.label, value: t.reservations }))} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Outstanding Trend</CardTitle></CardHeader>
            <CardContent>
              <SimpleBarChart
                data={trends.map((t) => ({ label: t.label, value: t.outstanding }))}
                monetary
              />
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Corporate Timeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {TIMELINE_FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors",
                  filter === f
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            {filteredTimeline.length === 0 ? (
              <p className="text-sm text-muted-foreground">No timeline events in this category.</p>
            ) : (
              filteredTimeline.slice(0, 15).map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start justify-between gap-4 rounded-lg border p-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{entry.label}</p>
                    <p className="text-muted-foreground">{entry.description}</p>
                    <Badge variant="outline" className="mt-1 capitalize text-xs">
                      {entry.category}
                    </Badge>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleString()}
                    </p>
                    {entry.href && (
                      <Link href={entry.href} className="text-xs text-primary hover:underline">
                        Open
                      </Link>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
