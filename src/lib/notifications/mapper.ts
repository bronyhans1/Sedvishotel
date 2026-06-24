import type { DbNotification } from "@/types/database";
import type { Notification, NotificationType } from "@/types/notification";

const TYPE_MAP: Record<string, NotificationType> = {
  reservation_alert: "new_reservation",
  payment_alert: "payment_received",
  check_in_alert: "guest_checked_in",
  check_out_alert: "guest_checked_out",
  housekeeping_alert: "housekeeping_assigned",
  system_alert: "outstanding_balance",
};

export function mapDbNotificationToNotification(row: DbNotification): Notification {
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    type: TYPE_MAP[row.type] ?? "outstanding_balance",
    priority: row.priority,
    read: row.is_read,
    createdAt: row.created_at,
    module: row.module ?? "System",
  };
}
