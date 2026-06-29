import Link from "next/link";
import {
  AlertTriangle,
  Bell,
  ClipboardList,
  ListTodo,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  DashboardAlertItem,
  DashboardStaffLogItem,
  DashboardTaskItem,
} from "@/types/dashboard-home";

type Props = {
  staffLogs: DashboardStaffLogItem[];
  outstandingTasks: DashboardTaskItem[];
  operationalAlerts: DashboardAlertItem[];
};

export function AdminQuickAccess({
  staffLogs,
  outstandingTasks,
  operationalAlerts,
}: Props) {
  return (
    <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4 w-4" />
            Recent Notifications
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/notifications">View all</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Live notification feed available on the notifications page.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            Recent Staff Activity
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/logs">View logs</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {staffLogs.length === 0 ? (
            <p className="text-muted-foreground">No recent staff activity</p>
          ) : (
            staffLogs.map((log) => (
              <div key={log.id} className="flex justify-between gap-2 border-b pb-2 last:border-0">
                <span>
                  <span className="font-medium">{log.user}</span>
                  <span className="text-muted-foreground"> — {log.action}</span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">{log.time}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <ListTodo className="h-4 w-4" />
            Outstanding Tasks
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/housekeeping">Tasks</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {outstandingTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No outstanding tasks</p>
          ) : (
            outstandingTasks.map((t) => (
              <Link
                key={t.id}
                href={t.href}
                className="block rounded-md border px-3 py-2 text-sm transition-colors hover:bg-muted/50"
              >
                {t.label}
              </Link>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            Operational Alerts
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/audit">Audit</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {operationalAlerts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active alerts</p>
          ) : (
            operationalAlerts.map((a) => (
              <div
                key={a.id}
                className="flex items-start gap-2 rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-sm"
              >
                <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <span>{a.message}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
