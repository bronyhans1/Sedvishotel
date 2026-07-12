/** PostgreSQL enum mirrors — keep in sync with supabase/migrations */

export type DbPermissionAction =
  | "view"
  | "create"
  | "edit"
  | "delete"
  | "manage"
  | "override_vat";

export type DbPermissionModule =
  | "dashboard"
  | "rooms"
  | "room_types"
  | "floors"
  | "night_audit"
  | "shift_handover"
  | "reservations"
  | "guests"
  | "check_in"
  | "check_out"
  | "active_stays"
  | "housekeeping"
  | "payments"
  | "invoices"
  | "revenue"
  | "reports"
  | "walk_in"
  | "staff"
  | "roles"
  | "settings"
  | "activity_logs"
  | "notifications"
  | "audit"
  | "product_categories"
  | "products"
  | "inventory"
  | "pos"
  | "guest_folio"
  | "group_reservations"
  | "corporate_accounts";

export type DbRoleId = "admin" | "manager" | "receptionist" | "housekeeping";

export type DbUserStatus = "active" | "suspended" | "inactive";

export type DbFloorId = "ground" | "first" | "second" | "third";

export type DbRoomStatus =
  | "available"
  | "occupied"
  | "reserved"
  | "cleaning"
  | "maintenance";

export type DbRoomTypeStatus = "active" | "inactive";

export type DbNightAuditStatus = "open" | "closed";

export type DbShiftType = "morning" | "afternoon" | "night";

export type DbShiftHandoverStatus = "open" | "closed";

export type DbGuestStatus = "in_house" | "reserved" | "checked_out";

export type DbIdType = "passport" | "national_id" | "drivers_license" | "other";

export type DbReservationStatus =
  | "pending"
  | "confirmed"
  | "checked_in"
  | "checked_out"
  | "checked_out_early"
  | "cancelled"
  | "no_show"
  | "completed";

export type DbBookingSource =
  | "website"
  | "walk_in"
  | "phone"
  | "whatsapp"
  | "travel_agent";

export type DbPricingMode =
  | "standard"
  | "without_ac"
  | "corporate_rate"
  | "long_stay"
  | "promotion"
  | "vip"
  | "returning_guest"
  | "complimentary"
  | "staff_rate"
  | "manual_override";

export type DbPricingRuleStatus = "active" | "inactive" | "expired";

export type DbPricingSource =
  | "room_type_default"
  | "pricing_rule"
  | "manual_override"
  | "complimentary";

export type DbBookingRequestStatus =
  | "pending"
  | "reviewed"
  | "converted"
  | "rejected";

export type DbReservationGuestRole = "primary" | "additional";

export type DbPaymentStatus =
  | "pending"
  | "partial"
  | "paid"
  | "partially_refunded"
  | "refunded";

export type DbPaymentMethod =
  | "cash"
  | "mobile_money"
  | "card"
  | "bank_transfer"
  | "online"
  | "mixed";

export type DbInvoiceStatus =
  | "draft"
  | "outstanding"
  | "partial"
  | "paid"
  | "void";

export type DbHousekeepingStatus =
  | "pending_cleaning"
  | "cleaning"
  | "ready"
  | "maintenance";

export type DbNotificationType =
  | "reservation_alert"
  | "payment_alert"
  | "housekeeping_alert"
  | "system_alert"
  | "check_in_alert"
  | "check_out_alert"
  | "shift_handover_alert"
  | "group_alert"
  | "corporate_alert"
  | "block_alert";

export type DbNotificationPriority = "low" | "medium" | "high" | "critical";

export type DbActivityLogStatus = "success" | "warning" | "failed";

/** Standard activity action codes for logging */
export const ActivityActionCodes = {
  RESERVATION_CREATED: "reservation.created",
  RESERVATION_UPDATED: "reservation.updated",
  RESERVATION_CANCELLED: "reservation.cancelled",
  RESERVATION_CHECKED_IN: "reservation.checked_in",
  RESERVATION_CHECKED_OUT: "reservation.checked_out",
  RESERVATION_EARLY_CHECKOUT: "reservation.early_checkout",
  RESERVATION_LATE_CHECKOUT: "reservation.late_checkout",
  RESERVATION_EXTEND_STAY: "reservation.extend_stay",
  RESERVATION_ROOM_MOVE: "reservation.room_move",
  RESERVATION_RATE_OVERRIDE: "reservation.rate_override",
  PAYMENT_RECORDED: "payment.recorded",
  PAYMENT_UPDATED: "payment.updated",
  PAYMENT_REFUNDED: "payment.refunded",
  PAYMENT_VAT_OVERRIDDEN: "payment.vat_overridden",
  RECEIPT_GENERATED: "payment.receipt_generated",
  PAYMENT_RECEIPT_PRINTED: "payment.receipt_printed",
  PAYMENT_RECEIPT_REPRINTED: "payment.receipt_reprinted",
  GUEST_CHECKED_IN: "guest.checked_in",
  GUEST_CHECKED_OUT: "guest.checked_out",
  ROOM_STATUS_UPDATED: "room.status_updated",
  STAFF_ACCOUNT_CREATED: "staff.created",
  STAFF_ACCOUNT_UPDATED: "staff.updated",
  STAFF_SUSPENDED: "staff.suspended",
  STAFF_ACTIVATED: "staff.activated",
  STAFF_PASSWORD_RESET: "staff.password_reset",
  PROFILE_UPDATED: "profile.updated",
  PROFILE_PASSWORD_CHANGED: "profile.password_changed",
  PROFILE_PHOTO_UPDATED: "profile.photo_updated",
  AUTH_LOGIN: "auth.login",
  NOTIFICATION_READ: "notification.read",
  NOTIFICATION_READ_ALL: "notification.read_all",
  INVOICE_GENERATED: "invoice.generated",
  INVOICE_PAID: "invoice.paid",
  REPORT_GENERATED: "report.generated",
  HOUSEKEEPING_TASK_UPDATED: "housekeeping.updated",
  SETTINGS_UPDATED: "settings.updated",
  BOOKING_REQUEST_CREATED: "booking_request.created",
  BOOKING_REQUEST_CONVERTED: "booking_request.converted",
  BOOKING_REQUEST_REJECTED: "booking_request.rejected",
  ROOM_TYPE_CREATED: "room_type.created",
  ROOM_TYPE_UPDATED: "room_type.updated",
  ROOM_TYPE_ARCHIVED: "room_type.archived",
  FLOOR_CREATED: "floor.created",
  FLOOR_UPDATED: "floor.updated",
  FLOOR_ARCHIVED: "floor.archived",
  PRODUCT_CATEGORY_CREATED: "product_category.created",
  PRODUCT_CATEGORY_UPDATED: "product_category.updated",
  PRODUCT_CATEGORY_ARCHIVED: "product_category.archived",
  PRODUCT_CATEGORY_RESTORED: "product_category.restored",
  PRODUCT_CATEGORY_DELETED: "product_category.deleted",
  PRODUCT_CREATED: "product.created",
  PRODUCT_UPDATED: "product.updated",
  PRODUCT_ARCHIVED: "product.archived",
  PRODUCT_RESTORED: "product.restored",
  PRODUCT_DELETED: "product.deleted",
  INVENTORY_OPENING_BALANCE: "inventory.opening_balance",
  INVENTORY_STOCK_IN: "inventory.stock_in",
  INVENTORY_STOCK_OUT: "inventory.stock_out",
  INVENTORY_ADJUSTMENT: "inventory.adjustment",
  INVENTORY_UPDATED: "inventory.updated",
  POS_SALE_STARTED: "pos.sale_started",
  POS_SALE_COMPLETED: "pos.sale_completed",
  POS_SALE_CANCELLED: "pos.sale_cancelled",
  POS_ROOM_CHARGE: "pos.room_charge",
  POS_RECEIPT_PRINTED: "pos.receipt_printed",
  POS_RECEIPT_REPRINTED: "pos.receipt_reprinted",
  POS_INVENTORY_DEDUCTED: "pos.inventory_deducted",
  FOLIO_CREATED: "folio.created",
  FOLIO_CHARGE_POSTED: "folio.charge_posted",
  FOLIO_CREDIT_POSTED: "folio.credit_posted",
  FOLIO_PAYMENT_POSTED: "folio.payment_posted",
  FOLIO_CLOSED: "folio.closed",
  NIGHT_AUDIT_CREATED: "night_audit.created",
  NIGHT_AUDIT_CLOSED: "night_audit.closed",
  NIGHT_AUDIT_REOPENED: "night_audit.reopened",
  NIGHT_AUDIT_CASH_VARIANCE: "night_audit.cash_variance",
  SHIFT_OPENED: "shift.opened",
  SHIFT_CLOSED: "shift.closed",
  SHIFT_ACKNOWLEDGED: "shift.acknowledged",
  SHIFT_TASK_COMPLETED: "shift.task_completed",
  SHIFT_ISSUE_RESOLVED: "shift.issue_resolved",
  ROOM_CREATED: "room.created",
  ROOM_UPDATED: "room.updated",
  ROOM_STATUS_CHANGED: "room.status_changed",
  ROOM_CLEANING_STARTED: "room.cleaning_started",
  ROOM_CLEANING_COMPLETED: "room.cleaning_completed",
  ROOM_READY: "room.ready",
  ROOM_MAINTENANCE: "room.maintenance",
  ROOM_ARCHIVED: "room.archived",
  ROOM_PHOTO_UPLOADED: "room.photo_uploaded",
  ROOM_PHOTO_DELETED: "room.photo_deleted",
  ROOM_PHOTO_COVER_CHANGED: "room.photo_cover_changed",
  ROOM_TYPE_PHOTO_UPLOADED: "room_type.photo_uploaded",
  ROOM_TYPE_PHOTO_DELETED: "room_type.photo_deleted",
  ROOM_TYPE_PHOTO_COVER_CHANGED: "room_type.photo_cover_changed",
  GUEST_CREATED: "guest.created",
  GUEST_UPDATED: "guest.updated",
  GUEST_ARCHIVED: "guest.archived",
  GROUP_CREATED: "group.created",
  GROUP_UPDATED: "group.updated",
  GROUP_CANCELLED: "group.cancelled",
  GROUP_CLOSED: "group.closed",
  GROUP_ROOM_ADDED: "group.room_added",
  GROUP_ROOM_REMOVED: "group.room_removed",
  GROUP_ROOM_ASSIGNED: "group.room_assigned",
  GROUP_GUEST_ADDED: "group.guest_added",
  GROUP_CHECKIN: "group.checkin",
  GROUP_CHECKOUT: "group.checkout",
  GROUP_PAYMENT: "group.payment",
  GROUP_INVOICE: "group.invoice",
  GROUP_RECEIPT: "group.receipt",
  CORPORATE_CREATED: "corporate.created",
  CORPORATE_UPDATED: "corporate.updated",
  CORPORATE_ARCHIVED: "corporate.archived",
} as const;

export type ActivityActionCode =
  (typeof ActivityActionCodes)[keyof typeof ActivityActionCodes];
