"use client";

import Link from "next/link";
import { UsersRound, Building2, BedDouble, AlertTriangle, Star, Activity } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/shared/StatCard";
import { Badge } from "@/components/ui/badge";
import type { GroupDashboardContract } from "@/types/group-dashboard";
import { formatCurrency } from "@/lib/utils";

type Props = {
  data: GroupDashboardContract;
};

export function GroupDashboardWidgets({ data }: Props) {
  const hasData =
    data.groupsInHouse.count > 0 ||
    data.groupsArrivingToday.count > 0 ||
    data.groupsDeparting.count > 0 ||
    data.corporateOutstanding.accountCount > 0 ||
    data.reservationBlocks.activeBlockCount > 0 ||
    data.groupHealthSummary.total > 0;

  if (!hasData) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Groups & Corporate Intelligence</h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <StatCard
          title="Groups In House"
          value={data.groupsInHouse.count}
          description={`${data.groupsInHouse.totalRooms} rooms · ${data.groupsInHouse.totalGuests} guests`}
          icon={UsersRound}
          iconClassName="bg-emerald-500/10 text-emerald-600"
        />
        <StatCard
          title="Today's Group Activity"
          value={data.groupsArrivingToday.count + data.groupsDeparting.count}
          description={`${data.groupsArrivingToday.count} arriving · ${data.groupsDeparting.count} departing`}
          icon={Activity}
          iconClassName="bg-blue-500/10 text-blue-600"
        />
        <StatCard
          title="Arriving Today"
          value={data.groupsArrivingToday.count}
          description={`${data.groupsArrivingToday.totalExpectedRooms} expected rooms`}
          icon={UsersRound}
        />
        <StatCard
          title="Departing Today"
          value={data.groupsDeparting.count}
          icon={UsersRound}
        />
        <StatCard
          title="Corporate Outstanding"
          value={formatCurrency(data.corporateOutstanding.totalOutstanding)}
          description={`${data.corporateOutstanding.accountCount} accounts`}
          icon={Building2}
          iconClassName="bg-amber-500/10 text-amber-600"
        />
        <StatCard
          title="Active Blocks"
          value={data.reservationBlocks.activeBlockCount}
          description={
            data.reservationBlocks.expiringWithin24h > 0
              ? `${data.reservationBlocks.expiringWithin24h} expiring`
              : undefined
          }
          icon={AlertTriangle}
          iconClassName="bg-rose-500/10 text-rose-600"
        />
        <StatCard
          title="VIP Arrivals"
          value={data.vipArrivals.count}
          icon={Star}
          iconClassName="bg-violet-500/10 text-violet-600"
        />
      </div>

      {data.groupHealthSummary.total > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Group Health Summary</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40">
              {data.groupHealthSummary.healthy} Healthy
            </Badge>
            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/40">
              {data.groupHealthSummary.attention} Attention
            </Badge>
            <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-900/40">
              {data.groupHealthSummary.critical} Critical
            </Badge>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {data.groupsArrivingToday.groups.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Groups Arriving Today</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.groupsArrivingToday.groups.map((g) => (
                <Link
                  key={g.groupId}
                  href={`/dashboard/group-reservations/${g.groupId}`}
                  className="flex items-center justify-between rounded-lg border p-3 text-sm hover:bg-muted/50"
                >
                  <span className="font-medium">{g.groupName}</span>
                  <span className="text-muted-foreground">{g.expectedRooms} rooms</span>
                </Link>
              ))}
            </CardContent>
          </Card>
        )}

        {data.vipArrivals.groups.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">VIP Arrivals Today</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.vipArrivals.groups.map((g) => (
                <Link
                  key={g.groupId}
                  href={`/dashboard/group-reservations/${g.groupId}`}
                  className="flex items-center justify-between rounded-lg border p-3 text-sm hover:bg-muted/50"
                >
                  <span className="font-medium">{g.groupName}</span>
                  <Badge variant="secondary">{g.vipCount} VIP</Badge>
                </Link>
              ))}
            </CardContent>
          </Card>
        )}

        {data.reservationBlocks.blocks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Expiring Blocks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.reservationBlocks.blocks.map((b) => (
                <div
                  key={b.blockId}
                  className="flex items-center justify-between rounded-lg border p-3 text-sm"
                >
                  <span>{b.groupNumber}</span>
                  <span className="text-muted-foreground">
                    <BedDouble className="mr-1 inline h-3 w-3" />
                    until {new Date(b.holdUntil).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {data.corporateOutstanding.accounts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Corporate Health</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.corporateOutstanding.accounts.map((a) => (
                <Link
                  key={a.corporateAccountId}
                  href={`/dashboard/corporate-accounts/${a.corporateAccountId}`}
                  className="flex items-center justify-between rounded-lg border p-3 text-sm hover:bg-muted/50"
                >
                  <span className="font-medium">{a.companyName}</span>
                  <span className="text-amber-600">{formatCurrency(a.outstandingBalance)}</span>
                </Link>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
