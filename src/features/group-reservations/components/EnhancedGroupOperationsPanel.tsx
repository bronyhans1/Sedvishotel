"use client";

import Link from "next/link";
import { Building2 } from "lucide-react";

import { AttentionNeededPanel } from "@/features/group-reservations/components/AttentionNeededPanel";
import { GroupHealthWidget } from "@/features/group-reservations/components/GroupHealthWidget";
import { GroupManagerQuickActions } from "@/features/group-reservations/components/GroupManagerQuickActions";
import { GroupStatusBadge } from "@/components/group-reservations/GroupStatusBadge";
import { StatCard } from "@/components/shared/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GROUP_TIMELINE_EVENT_LABELS } from "@/types/group-timeline";
import type { GroupOperationsOverview } from "@/lib/group-reservations/operations-overview";
import type { GroupOperationalIntelligence } from "@/types/group-operational-intelligence";
import type { GroupFinancialSummary } from "@/types/group-reservation";
import { formatCurrency } from "@/lib/utils";
import {
  Users,
  Wallet,
  BedDouble,
  LogIn,
  LogOut,
  AlertCircle,
  CreditCard,
} from "lucide-react";

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

type Props = {
  overview: GroupOperationsOverview;
  intelligence: GroupOperationalIntelligence;
  financial: GroupFinancialSummary | null;
  groupId: string;
  canManage?: boolean;
  onTabChange?: (tab: string) => void;
};

export function EnhancedGroupOperationsPanel({
  overview,
  intelligence,
  financial,
  groupId,
  canManage,
  onTabChange,
}: Props) {
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

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AttentionNeededPanel
            alerts={intelligence.alerts}
            groupId={groupId}
            onTabChange={onTabChange}
          />
        </div>
        <GroupHealthWidget health={intelligence.health} />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Manager Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <GroupManagerQuickActions
            groupId={groupId}
            financial={financial}
            corporateAccountId={overview.group.corporateAccountId}
            onTabChange={onTabChange ?? (() => {})}
            canManage={canManage}
          />
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        <StatCard title="Outstanding" value={formatCurrency(overview.outstandingBalance)} icon={Wallet} iconClassName="bg-amber-500/10 text-amber-600" />
        <StatCard title="Payments" value={formatCurrency(overview.paymentsReceived)} icon={CreditCard} iconClassName="bg-emerald-500/10 text-emerald-600" />
        <StatCard title="Occupancy" value={`${overview.occupancyPercent}%`} icon={BedDouble} />
        <StatCard title="VIP Guests" value={overview.vipGuests} icon={Users} iconClassName="bg-violet-500/10 text-violet-600" />
        <StatCard title="Returning" value={overview.returningGuests} icon={Users} />
        <StatCard title="Active Blocks" value={overview.activeBlockCount} icon={AlertCircle} />
        <StatCard title="Pending Check-Ins" value={overview.pendingCheckInsToday} icon={LogIn} iconClassName="bg-amber-500/10 text-amber-600" />
        <StatCard title="Pending Check-Outs" value={overview.pendingCheckOutsToday} icon={LogOut} />
        <StatCard title="Open Tasks" value={overview.openTasks} icon={AlertCircle} />
        <StatCard title="Open Issues" value={overview.outstandingIssues} icon={AlertCircle} iconClassName="bg-rose-500/10 text-rose-600" />
      </div>

      {overview.corporateCreditStatus !== "none" && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Corporate Status</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3 text-sm">
            <Badge variant={creditBadge}>
              {overview.corporateCreditStatus === "exceeded"
                ? "Credit Limit Exceeded"
                : overview.corporateCreditStatus === "warning"
                  ? "Approaching Limit"
                  : "Within Limit"}
            </Badge>
            <span>Outstanding: {formatCurrency(overview.corporateOutstanding)}</span>
            {overview.corporateCreditLimit != null && (
              <span className="text-muted-foreground">
                Limit: {formatCurrency(overview.corporateCreditLimit)}
              </span>
            )}
            {overview.group.corporateAccountId && (
              <Link
                href={`/dashboard/corporate-accounts/${overview.group.corporateAccountId}`}
                className="text-primary text-sm hover:underline"
              >
                View company →
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {overview.recentActivity.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Recent Activity</CardTitle>
              <button
                type="button"
                onClick={() => onTabChange?.("timeline")}
                className="text-xs text-primary hover:underline"
              >
                View all
              </button>
            </CardHeader>
            <CardContent className="space-y-3">
              {overview.recentActivity.slice(0, 5).map((event) => (
                <div
                  key={event.id}
                  className="flex items-start justify-between gap-4 border-b pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {GROUP_TIMELINE_EVENT_LABELS[event.eventType] ?? event.eventType}
                    </p>
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {relativeTime(event.createdAt)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Timeline Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>{overview.recentActivity.length} recent event(s) on this group.</p>
            <button
              type="button"
              onClick={() => onTabChange?.("timeline")}
              className="text-primary hover:underline"
            >
              Open full timeline →
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
