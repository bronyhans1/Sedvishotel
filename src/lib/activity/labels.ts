import { ActivityActionCodes } from "@/types/database/enums";
import {
  formatDisplayLabel,
  humanizeLabel,
  looksLikeInternalCode,
} from "@/lib/labels/humanize";

export function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-GB", { month: "short", day: "numeric" });
}

/** Curated labels — overrides auto-humanized defaults where copy should be sharper. */
const ACTION_LABEL_OVERRIDES: Record<string, string> = {
  [ActivityActionCodes.AUTH_LOGIN]: "Logged in",
  [ActivityActionCodes.PROFILE_UPDATED]: "Profile updated",
  [ActivityActionCodes.PROFILE_PASSWORD_CHANGED]: "Password changed",
  [ActivityActionCodes.PROFILE_PHOTO_UPDATED]: "Profile photo updated",
  [ActivityActionCodes.STAFF_PASSWORD_RESET]: "Staff password reset",
  [ActivityActionCodes.STAFF_ACCOUNT_CREATED]: "Staff account created",
  [ActivityActionCodes.STAFF_ACCOUNT_UPDATED]: "Staff account updated",
  [ActivityActionCodes.STAFF_SUSPENDED]: "Staff account suspended",
  [ActivityActionCodes.STAFF_ACTIVATED]: "Staff account activated",
  [ActivityActionCodes.RESERVATION_CREATED]: "Reservation created",
  [ActivityActionCodes.RESERVATION_UPDATED]: "Reservation updated",
  [ActivityActionCodes.RESERVATION_CANCELLED]: "Reservation cancelled",
  [ActivityActionCodes.RESERVATION_CHECKED_IN]: "Guest checked in",
  [ActivityActionCodes.RESERVATION_CHECKED_OUT]: "Guest checked out",
  [ActivityActionCodes.RESERVATION_EARLY_CHECKOUT]: "Early check-out processed",
  [ActivityActionCodes.RESERVATION_LATE_CHECKOUT]: "Late check-out processed",
  [ActivityActionCodes.RESERVATION_EXTEND_STAY]: "Stay extended",
  [ActivityActionCodes.RESERVATION_ROOM_MOVE]: "Room move completed",
  [ActivityActionCodes.PAYMENT_RECORDED]: "Payment recorded",
  [ActivityActionCodes.PAYMENT_UPDATED]: "Payment updated",
  [ActivityActionCodes.PAYMENT_REFUNDED]: "Payment refunded",
  [ActivityActionCodes.PAYMENT_VAT_OVERRIDDEN]: "VAT overridden on payment",
  [ActivityActionCodes.RECEIPT_GENERATED]: "Receipt generated",
  [ActivityActionCodes.PAYMENT_RECEIPT_PRINTED]: "Receipt printed",
  [ActivityActionCodes.PAYMENT_RECEIPT_REPRINTED]: "Receipt reprinted",
  [ActivityActionCodes.GUEST_CREATED]: "Guest profile created",
  [ActivityActionCodes.GUEST_UPDATED]: "Guest profile updated",
  [ActivityActionCodes.GUEST_ARCHIVED]: "Guest profile archived",
  [ActivityActionCodes.GUEST_CHECKED_IN]: "Guest checked in",
  [ActivityActionCodes.GUEST_CHECKED_OUT]: "Guest checked out",
  [ActivityActionCodes.ROOM_CREATED]: "Room created",
  [ActivityActionCodes.ROOM_UPDATED]: "Room updated",
  [ActivityActionCodes.ROOM_STATUS_CHANGED]: "Room status changed",
  [ActivityActionCodes.ROOM_STATUS_UPDATED]: "Room status updated",
  [ActivityActionCodes.ROOM_CLEANING_STARTED]: "Room cleaning started",
  [ActivityActionCodes.ROOM_CLEANING_COMPLETED]: "Room cleaning completed",
  [ActivityActionCodes.ROOM_READY]: "Room marked ready",
  [ActivityActionCodes.ROOM_MAINTENANCE]: "Room marked for maintenance",
  [ActivityActionCodes.ROOM_ARCHIVED]: "Room archived",
  [ActivityActionCodes.ROOM_PHOTO_UPLOADED]: "Uploaded room photo",
  [ActivityActionCodes.ROOM_PHOTO_DELETED]: "Deleted room photo",
  [ActivityActionCodes.ROOM_PHOTO_COVER_CHANGED]: "Changed room cover photo",
  [ActivityActionCodes.ROOM_TYPE_CREATED]: "Room type created",
  [ActivityActionCodes.ROOM_TYPE_UPDATED]: "Room type updated",
  [ActivityActionCodes.ROOM_TYPE_ARCHIVED]: "Room type archived",
  [ActivityActionCodes.ROOM_TYPE_PHOTO_UPLOADED]: "Uploaded room type photo",
  [ActivityActionCodes.ROOM_TYPE_PHOTO_DELETED]: "Deleted room type photo",
  [ActivityActionCodes.ROOM_TYPE_PHOTO_COVER_CHANGED]: "Changed room type cover photo",
  [ActivityActionCodes.FLOOR_CREATED]: "Floor created",
  [ActivityActionCodes.FLOOR_UPDATED]: "Floor updated",
  [ActivityActionCodes.FLOOR_ARCHIVED]: "Floor archived",
  [ActivityActionCodes.PRODUCT_CATEGORY_CREATED]: "Product category created",
  [ActivityActionCodes.PRODUCT_CATEGORY_UPDATED]: "Product category updated",
  [ActivityActionCodes.PRODUCT_CATEGORY_ARCHIVED]: "Product category archived",
  [ActivityActionCodes.PRODUCT_CATEGORY_RESTORED]: "Product category restored",
  [ActivityActionCodes.PRODUCT_CATEGORY_DELETED]: "Product category deleted",
  [ActivityActionCodes.PRODUCT_CREATED]: "Product created",
  [ActivityActionCodes.PRODUCT_UPDATED]: "Product updated",
  [ActivityActionCodes.PRODUCT_ARCHIVED]: "Product archived",
  [ActivityActionCodes.PRODUCT_RESTORED]: "Product restored",
  [ActivityActionCodes.PRODUCT_DELETED]: "Product deleted",
  [ActivityActionCodes.INVENTORY_OPENING_BALANCE]: "Inventory opening balance recorded",
  [ActivityActionCodes.INVENTORY_STOCK_IN]: "Stock in recorded",
  [ActivityActionCodes.INVENTORY_STOCK_OUT]: "Stock out recorded",
  [ActivityActionCodes.INVENTORY_ADJUSTMENT]: "Stock adjustment recorded",
  [ActivityActionCodes.INVENTORY_UPDATED]: "Inventory updated",
  [ActivityActionCodes.POS_SALE_STARTED]: "POS sale started",
  [ActivityActionCodes.POS_SALE_COMPLETED]: "POS sale completed",
  [ActivityActionCodes.POS_SALE_CANCELLED]: "POS sale cancelled",
  [ActivityActionCodes.POS_ROOM_CHARGE]: "Room charge recorded",
  [ActivityActionCodes.POS_RECEIPT_PRINTED]: "POS receipt printed",
  [ActivityActionCodes.POS_RECEIPT_REPRINTED]: "Receipt reprinted",
  [ActivityActionCodes.POS_INVENTORY_DEDUCTED]: "POS inventory deducted",
  [ActivityActionCodes.FOLIO_CREATED]: "Guest folio created",
  [ActivityActionCodes.FOLIO_CHARGE_POSTED]: "Folio charge posted",
  [ActivityActionCodes.FOLIO_CREDIT_POSTED]: "Folio credit posted",
  [ActivityActionCodes.FOLIO_PAYMENT_POSTED]: "Folio payment posted",
  [ActivityActionCodes.FOLIO_CLOSED]: "Guest folio closed",
  [ActivityActionCodes.NIGHT_AUDIT_CREATED]: "Night audit opened",
  [ActivityActionCodes.NIGHT_AUDIT_CLOSED]: "Night audit completed",
  [ActivityActionCodes.NIGHT_AUDIT_REOPENED]: "Night audit reopened",
  [ActivityActionCodes.NIGHT_AUDIT_CASH_VARIANCE]: "Night audit cash variance recorded",
  [ActivityActionCodes.SHIFT_OPENED]: "Shift opened",
  [ActivityActionCodes.SHIFT_CLOSED]: "Shift handover completed",
  [ActivityActionCodes.INVOICE_GENERATED]: "Invoice generated",
  [ActivityActionCodes.INVOICE_PAID]: "Invoice paid",
  [ActivityActionCodes.REPORT_GENERATED]: "Report generated",
  [ActivityActionCodes.HOUSEKEEPING_TASK_UPDATED]: "Housekeeping task updated",
  [ActivityActionCodes.SETTINGS_UPDATED]: "Settings updated",
  [ActivityActionCodes.NOTIFICATION_READ]: "Notification marked as read",
  [ActivityActionCodes.NOTIFICATION_READ_ALL]: "All notifications marked as read",
  [ActivityActionCodes.BOOKING_REQUEST_CREATED]: "Booking request received",
  [ActivityActionCodes.BOOKING_REQUEST_CONVERTED]: "Booking request converted",
  [ActivityActionCodes.BOOKING_REQUEST_REJECTED]: "Booking request rejected",
};

const ACTION_LABELS: Record<string, string> = Object.fromEntries(
  Object.values(ActivityActionCodes).map((code) => [
    code,
    ACTION_LABEL_OVERRIDES[code] ?? humanizeLabel(code),
  ])
);

export function formatActivityAction(actionCode: string, fallback?: string): string {
  if (ACTION_LABELS[actionCode]) return ACTION_LABELS[actionCode];

  const safeFallback = fallback?.trim() ?? "";
  if (safeFallback && !looksLikeInternalCode(safeFallback)) {
    return safeFallback;
  }

  return humanizeLabel(actionCode);
}

export function formatActivityMetadata(
  metadata: Record<string, unknown> | null | undefined
): string | null {
  if (!metadata) return null;

  const fileName = metadata.file_name;
  if (typeof fileName === "string" && fileName.trim()) {
    return fileName.trim();
  }

  const roomNumber = metadata.room_number;
  if (typeof roomNumber === "string" && roomNumber.trim()) {
    return `Room ${roomNumber.trim()}`;
  }

  const reservationNumber = metadata.reservation_number;
  if (typeof reservationNumber === "string" && reservationNumber.trim()) {
    return `Reservation ${reservationNumber.trim()}`;
  }

  return null;
}

export { formatModuleLabel, formatLogStatusLabel } from "@/lib/labels/humanize";
