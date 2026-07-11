export type NotificationPriority = "low" | "medium" | "high" | "critical";

export type NotificationType =
  | "new_reservation"
  | "payment_received"
  | "guest_checked_in"
  | "guest_checked_out"
  | "room_ready"
  | "housekeeping_assigned"
  | "outstanding_balance"
  | "shift_handover_alert";

export type Notification = {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  read: boolean;
  createdAt: string;
  module: string;
  entityId: string | null;
  entityType: string | null;
};
