"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { PageContainer } from "@/components/shared/PageContainer";
import { StatCard } from "@/components/shared/StatCard";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { siteConfig } from "@/config/site";
import { formatLogStatusLabel } from "@/lib/activity/labels";
import type { ActivityLog, LogStats } from "@/types/log";
import {
  CalendarPlus,
  CircleDollarSign,
  ClipboardList,
  LogIn,
  LogOut,
} from "lucide-react";

function LogStatusBadge({ status }: { status: ActivityLog["status"] }) {
  const map: Record<ActivityLog["status"], string> = {
    success: "bg-emerald-500/15 text-emerald-700",
    warning: "bg-amber-500/15 text-amber-700",
    failed: "bg-red-500/15 text-red-700",
  };
  return (
    <Badge variant="secondary" className={map[status]}>
      {formatLogStatusLabel(status)}
    </Badge>
  );
}

type Props = {
  logs: ActivityLog[];
  stats: LogStats;
};

export function LogsPageContent({ logs, stats }: Props) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter(
      (l) =>
        l.user.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        l.module.toLowerCase().includes(q)
    );
  }, [logs, search]);

  return (
    <PageContainer
      title="Activity Logs"
      description={`System audit trail for ${siteConfig.name}.`}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Actions Today" value={stats.actionsToday} icon={ClipboardList} />
        <StatCard
          title="Reservations Created"
          value={stats.reservationsCreated}
          icon={CalendarPlus}
        />
        <StatCard
          title="Payments Recorded"
          value={stats.paymentsRecorded}
          icon={CircleDollarSign}
        />
        <StatCard title="Check-Ins" value={stats.checkIns} icon={LogIn} />
        <StatCard title="Check-Outs" value={stats.checkOuts} icon={LogOut} />
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search user, action, module..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 font-semibold">User</th>
                <th className="px-4 py-3 font-semibold">Action</th>
                <th className="px-4 py-3 font-semibold">Module</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Time</th>
                <th className="hidden px-4 py-3 font-semibold md:table-cell">IP Address</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    No activity logs found
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{log.user}</td>
                    <td className="px-4 py-3">{log.action}</td>
                    <td className="px-4 py-3 text-muted-foreground">{log.module}</td>
                    <td className="px-4 py-3">{log.date}</td>
                    <td className="px-4 py-3">{log.time}</td>
                    <td className="hidden px-4 py-3 font-mono text-xs md:table-cell">
                      {log.ipAddress}
                    </td>
                    <td className="px-4 py-3">
                      <LogStatusBadge status={log.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PageContainer>
  );
}
