/**
 * Converts internal snake_case / dotted codes into human-readable labels.
 */

const MODULE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  rooms: "Rooms",
  room_types: "Room Types",
  floors: "Floors",
  night_audit: "Night Audit",
  shift_handover: "Shift Handover",
  reservations: "Reservations",
  guests: "Guests",
  check_in: "Check-In",
  check_out: "Check-Out",
  active_stays: "Active Stays",
  housekeeping: "Housekeeping",
  payments: "Payments",
  invoices: "Invoices",
  revenue: "Revenue",
  reports: "Reports",
  walk_in: "Walk-In",
  staff: "Staff",
  roles: "Roles",
  settings: "Settings",
  activity_logs: "Activity Logs",
  notifications: "Notifications",
  audit: "Audit",
  profile: "Profile",
};

const LOG_STATUS_LABELS: Record<string, string> = {
  success: "Success",
  warning: "Warning",
  failed: "Failed",
};

const INVOICE_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  outstanding: "Outstanding",
  partial: "Partially Paid",
  paid: "Paid",
  void: "Void",
};

const USER_STATUS_LABELS: Record<string, string> = {
  active: "Active",
  suspended: "Suspended",
  inactive: "Inactive",
};

/** Detects values like `room.photo_uploaded` or `checked_out_early`. */
export function looksLikeInternalCode(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.includes(".")) {
    return /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/i.test(trimmed);
  }
  return /^[a-z]+(_[a-z0-9]+)+$/i.test(trimmed);
}

/** `mobile_money` → `Mobile Money`, `night_audit` → `Night Audit` */
export function humanizeLabel(value: string): string {
  if (!value?.trim()) return "";

  const key = value.trim().toLowerCase();
  if (MODULE_LABELS[key]) return MODULE_LABELS[key];
  if (LOG_STATUS_LABELS[key]) return LOG_STATUS_LABELS[key];
  if (INVOICE_STATUS_LABELS[key]) return INVOICE_STATUS_LABELS[key];
  if (USER_STATUS_LABELS[key]) return USER_STATUS_LABELS[key];

  return value
    .replace(/\./g, " ")
    .replace(/_/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function formatModuleLabel(module: string): string {
  return MODULE_LABELS[module] ?? humanizeLabel(module);
}

export function formatLogStatusLabel(status: string): string {
  return LOG_STATUS_LABELS[status] ?? humanizeLabel(status);
}

export function formatInvoiceStatusLabel(status: string): string {
  return INVOICE_STATUS_LABELS[status] ?? humanizeLabel(status);
}

export function formatUserStatusLabel(status: string): string {
  return USER_STATUS_LABELS[status] ?? humanizeLabel(status);
}

/** Prefer friendly text; never return raw internal codes to users. */
export function formatDisplayLabel(
  value: string,
  overrides?: Record<string, string>
): string {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return "";
  const key = trimmed.toLowerCase();
  if (overrides?.[key]) return overrides[key];
  if (overrides?.[trimmed]) return overrides[trimmed];
  if (looksLikeInternalCode(trimmed)) return humanizeLabel(trimmed);
  return trimmed;
}
