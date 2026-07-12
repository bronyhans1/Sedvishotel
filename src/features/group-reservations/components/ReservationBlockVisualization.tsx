"use client";

import { BedDouble, Clock, AlertTriangle } from "lucide-react";

import { StatCard } from "@/components/shared/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ReservationBlockInsights } from "@/types/group-operational-intelligence";

const STRIP_SEGMENTS = [
  { key: "blocked", label: "Blocked", color: "bg-amber-500" },
  { key: "allocated", label: "Allocated", color: "bg-blue-500" },
  { key: "checkedIn", label: "Checked In", color: "bg-emerald-500" },
  { key: "released", label: "Released", color: "bg-slate-400" },
  { key: "expired", label: "Expired", color: "bg-rose-400" },
  { key: "remaining", label: "Remaining", color: "bg-muted-foreground/30" },
] as const;

function formatCountdown(ms: number | null): string {
  if (ms == null || ms <= 0) return "Expired";
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const mins = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  return `${hours}h ${mins}m`;
}

type Props = {
  insights: ReservationBlockInsights;
};

export function ReservationBlockVisualization({ insights }: Props) {
  const { strip } = insights;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <StatCard title="Rooms Requested" value={insights.roomsRequested} icon={BedDouble} />
        <StatCard title="Rooms Allocated" value={insights.roomsAllocated} icon={BedDouble} iconClassName="bg-blue-500/10 text-blue-600" />
        <StatCard title="Rooms Remaining" value={insights.roomsRemaining} icon={BedDouble} iconClassName="bg-amber-500/10 text-amber-600" />
        <StatCard title="Rooms Released" value={insights.roomsReleased} icon={BedDouble} />
        <StatCard title="Expiring Today" value={insights.blocksExpiringToday} icon={AlertTriangle} iconClassName="bg-rose-500/10 text-rose-600" />
        <StatCard title="Allocation Rate" value={`${insights.averageAllocationRate}%`} icon={BedDouble} />
        <StatCard title="Occupancy Impact" value={`${insights.occupancyContribution}%`} icon={BedDouble} iconClassName="bg-violet-500/10 text-violet-600" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Block Occupancy Strip</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex h-4 overflow-hidden rounded-full bg-muted">
            {STRIP_SEGMENTS.map((seg) => {
              const value = strip[seg.key as keyof typeof strip.percentages];
              const pct = typeof value === "number" ? value : 0;
              if (pct <= 0) return null;
              return (
                <div
                  key={seg.key}
                  className={cn("h-full transition-all", seg.color)}
                  style={{ width: `${pct}%` }}
                  title={`${seg.label}: ${pct}%`}
                />
              );
            })}
          </div>
          <div className="flex flex-wrap gap-4 text-xs">
            {STRIP_SEGMENTS.map((seg) => (
              <div key={seg.key} className="flex items-center gap-1.5">
                <span className={cn("h-2.5 w-2.5 rounded-full", seg.color)} />
                <span className="text-muted-foreground">{seg.label}</span>
                <span className="font-medium">
                  {strip[seg.key as keyof typeof strip.percentages]}%
                </span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-sm sm:grid-cols-6">
            <div><p className="font-bold">{strip.blocked}</p><p className="text-muted-foreground">Blocked</p></div>
            <div><p className="font-bold">{strip.allocated}</p><p className="text-muted-foreground">Allocated</p></div>
            <div><p className="font-bold">{strip.checkedIn}</p><p className="text-muted-foreground">Checked In</p></div>
            <div><p className="font-bold">{strip.released}</p><p className="text-muted-foreground">Released</p></div>
            <div><p className="font-bold">{strip.expired}</p><p className="text-muted-foreground">Expired</p></div>
            <div><p className="font-bold">{strip.remaining}</p><p className="text-muted-foreground">Remaining</p></div>
          </div>
        </CardContent>
      </Card>

      {insights.blocks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Active Blocks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {insights.blocks
              .filter((b) => b.status === "blocked" || b.status === "allocated")
              .map((b) => (
                <div
                  key={b.id}
                  className={cn(
                    "flex items-center justify-between rounded-lg border p-3 text-sm",
                    b.expiringSoon && "border-amber-300 bg-amber-50/50 dark:bg-amber-950/20"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">{b.status}</Badge>
                    <span className="text-muted-foreground">
                      Hold until {new Date(b.holdUntil).toLocaleString()}
                    </span>
                  </div>
                  {b.status === "blocked" && (
                    <span className="flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400">
                      <Clock className="h-3 w-3" />
                      {formatCountdown(b.countdownMs)}
                    </span>
                  )}
                </div>
              ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
