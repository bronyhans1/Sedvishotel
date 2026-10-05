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

/** Navbar bell payload. Preview is a short newest-first list, not read history. */
export type NotificationBellData = {
  preview: Notification[];
  unreadCount: number;
};
