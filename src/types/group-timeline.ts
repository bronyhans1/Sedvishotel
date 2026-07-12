export type GroupTimelineEventType =
  | "group_created"
  | "company_updated"
  | "reservation_added"
  | "reservation_removed"
  | "room_assigned"
  | "room_changed"
  | "guest_assigned"
  | "guest_checked_in"
  | "guest_checked_out"
  | "deposit_paid"
  | "invoice_generated"
  | "receipt_printed"
  | "payment_recorded"
  | "refund"
  | "pos_room_charge"
  | "minibar_charge"
  | "restaurant_charge"
  | "laundry_charge"
  | "issue_created"
  | "issue_closed"
  | "reservation_cancelled"
  | "group_closed"
  | "block_created"
  | "block_released"
  | "block_expired"
  | "group_confirmed"
  | "group_cancelled";

export type GroupTimelineEvent = {
  id: string;
  groupReservationId: string;
  eventType: GroupTimelineEventType;
  description: string;
  entityType: string | null;
  entityId: string | null;
  staffId: string | null;
  staffName: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type CreateGroupTimelineEventInput = {
  groupReservationId: string;
  eventType: GroupTimelineEventType;
  description: string;
  entityType?: string | null;
  entityId?: string | null;
  staffId?: string | null;
  staffName?: string | null;
  metadata?: Record<string, unknown>;
};

export const GROUP_TIMELINE_EVENT_LABELS: Record<GroupTimelineEventType, string> = {
  group_created: "Group Created",
  company_updated: "Company Updated",
  reservation_added: "Reservation Added",
  reservation_removed: "Reservation Removed",
  room_assigned: "Room Assigned",
  room_changed: "Room Changed",
  guest_assigned: "Guest Assigned",
  guest_checked_in: "Guest Checked In",
  guest_checked_out: "Guest Checked Out",
  deposit_paid: "Deposit Paid",
  invoice_generated: "Invoice Generated",
  receipt_printed: "Receipt Printed",
  payment_recorded: "Payment Recorded",
  refund: "Refund",
  pos_room_charge: "POS Room Charge",
  minibar_charge: "Mini Bar Charge",
  restaurant_charge: "Restaurant Charge",
  laundry_charge: "Laundry Charge",
  issue_created: "Issue Created",
  issue_closed: "Issue Closed",
  reservation_cancelled: "Reservation Cancelled",
  group_closed: "Group Closed",
  block_created: "Block Created",
  block_released: "Block Released",
  block_expired: "Block Expired",
  group_confirmed: "Group Confirmed",
  group_cancelled: "Group Cancelled",
};
