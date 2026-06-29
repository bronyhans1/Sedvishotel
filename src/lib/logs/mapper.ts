import type { DbActivityLog } from "@/types/database";
import type { ActivityLog, LogStats } from "@/types/log";
import {
  formatActivityAction,
  formatModuleLabel,
  formatRelativeTime,
} from "@/lib/activity/labels";

export function mapDbActivityLogToActivityLog(row: DbActivityLog): ActivityLog {
  const created = new Date(row.created_at);
  return {
    id: row.id,
    user: row.user_name ?? "System",
    userId: row.user_id ?? "",
    action: formatActivityAction(row.action_code, row.action),
    module: formatModuleLabel(row.module),
    date: created.toLocaleDateString("en-GB"),
    time: created.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    ipAddress: row.ip_address ?? "—",
    status: row.status,
    actionCode: row.action_code,
    createdAt: row.created_at,
    relativeTime: formatRelativeTime(row.created_at),
  };
}

export function computeLogStats(logs: DbActivityLog[]): LogStats {
  const today = new Date().toISOString().slice(0, 10);
  const todayLogs = logs.filter((l) => l.created_at.startsWith(today));

  return {
    actionsToday: todayLogs.length,
    reservationsCreated: todayLogs.filter((l) =>
      l.action_code.includes("reservation.created")
    ).length,
    paymentsRecorded: todayLogs.filter((l) =>
      l.action_code.includes("payment.recorded")
    ).length,
    checkIns: todayLogs.filter((l) =>
      l.action_code.includes("checked_in")
    ).length,
    checkOuts: todayLogs.filter((l) =>
      l.action_code.includes("checked_out")
    ).length,
  };
}
