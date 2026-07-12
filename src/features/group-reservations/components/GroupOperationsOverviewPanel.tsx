"use client";

import {
  AlertCircle,
  BedDouble,
  Building2,
  Calendar,
  CreditCard,
  LogIn,
  LogOut,
  Users,
  Wallet,
} from "lucide-react";

import { GroupStatusBadge } from "@/components/group-reservations/GroupStatusBadge";
import { StatCard } from "@/components/shared/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { GroupOperationsOverview } from "@/lib/group-reservations/operations-overview";
import { formatCurrency } from "@/lib/utils";
import { GROUP_TIMELINE_EVENT_LABELS } from "@/types/group-timeline";

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

type Props = {
  overview: GroupOperationsOverview;
};

export function GroupOperationsOverviewPanel({ overview }: Props) {
  const creditBadge =
    overview.corporateCreditStatus === "exceeded"
      ? "destructive"
      : overview.corporateCreditStatus === "warning"
        ? "secondary"
        : "outline";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <GroupStatusBadge status={overview.group.status} />
        <Badge variant="outline" className="font-mono">
          {overview.group.groupNumber}
        </Badge>
        {overview.corporateAccountName && (
          <Badge variant="secondary">
            <Building2 className="mr-1 h-3 w-3" />
            {overview.corporateAccountName}
          </Badge>
        )}
        <span className="text-sm text-muted-foreground">
          {overview.group.arrivalDate} → {overview.group.departureDate}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        <StatCard title="Expected Guests" value={overview.expectedGuests} icon={Users} />
        <StatCard title="Checked In" value={overview.checkedInCount} icon={LogIn} iconClassName="bg-emerald-500/10 text-emerald-600" />
        <StatCard title="Checked Out" value={overview.checkedOutCount} icon={LogOut} />
        <StatCard title="Remaining Arrivals" value={overview.remainingArrivals} icon={Calendar} iconClassName="bg-amber-500/10 text-amber-600" />
        <StatCard title="Rooms Reserved" value={overview.roomsReserved} icon={BedDouble} />
        <StatCard title="Rooms Assigned" value={overview.roomsAssigned} icon={BedDouble} iconClassName="bg-blue-500/10 text-blue-600" />
        <StatCard title="Rooms Occupied" value={overview.roomsOccupied} icon={BedDouble} iconClassName="bg-violet-500/10 text-violet-600" />
        <StatCard title="Rooms Remaining" value={overview.roomsRemaining} icon={BedDouble} />
        <StatCard title="Adults" value={overview.adults} icon={Users} />
        <StatCard title="Children" value={overview.children} icon={Users} />
        <StatCard title="Occupancy" value={`${overview.occupancyPercent}%`} icon={BedDouble} />
        <StatCard title="Outstanding" value={formatCurrency(overview.outstandingBalance)} icon={Wallet} iconClassName="bg-amber-500/10 text-amber-600" />
        <StatCard title="Payments Received" value={formatCurrency(overview.paymentsReceived)} icon={CreditCard} iconClassName="bg-emerald-500/10 text-emerald-600" />
        <StatCard title="Master Folio Balance" value={formatCurrency(overview.masterFolioBalance)} icon={Wallet} />
        <StatCard title="Pending Check-Ins Today" value={overview.pendingCheckInsToday} icon={LogIn} iconClassName="bg-amber-500/10 text-amber-600" />
        <StatCard title="Pending Check-Outs Today" value={overview.pendingCheckOutsToday} icon={LogOut} />
        <StatCard title="Active Blocks" value={overview.activeBlockCount} icon={AlertCircle} />
        <StatCard title="Blocks Expiring (24h)" value={overview.expiringBlocks} icon={AlertCircle} iconClassName="bg-rose-500/10 text-rose-600" />
      </div>

      {overview.corporateCreditStatus !== "none" && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Corporate Credit Status</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3 text-sm">
            <Badge variant={creditBadge}>
              {overview.corporateCreditStatus === "exceeded"
                ? "Credit Limit Exceeded"
                : overview.corporateCreditStatus === "warning"
                  ? "Approaching Limit"
                  : "Within Limit"}
            </Badge>
            <span>
              Outstanding: {formatCurrency(overview.corporateOutstanding)}
            </span>
            {overview.corporateCreditLimit != null && (
              <span className="text-muted-foreground">
                Limit: {formatCurrency(overview.corporateCreditLimit)}
              </span>
            )}
          </CardContent>
        </Card>
      )}

      {overview.recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {overview.recentActivity.map((event) => (
              <div
                key={event.id}
                className="flex items-start justify-between gap-4 border-b pb-3 last:border-0 last:pb-0"
              >
                <div>
                  <p className="text-sm font-medium">
                    {GROUP_TIMELINE_EVENT_LABELS[event.eventType] ?? event.eventType}
                  </p>
                  <p className="text-sm text-muted-foreground">{event.description}</p>
                  {event.staffName && (
                    <p className="text-xs text-muted-foreground">{event.staffName}</p>
                  )}
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {relativeTime(event.createdAt)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
