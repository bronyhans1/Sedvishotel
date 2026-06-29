import { PERMISSION_MODULES } from "@/lib/database/rbac";
import { humanizeLabel } from "@/lib/labels/humanize";

const MODULE_LABELS = Object.fromEntries(
  PERMISSION_MODULES.map((m) => [m.id, m.label])
) as Record<string, string>;

const ACTION_LABELS: Record<string, string> = {
  view: "View",
  create: "Create",
  edit: "Edit",
  delete: "Delete",
  manage: "Manage",
};

/** Human-friendly verbs for specific module + action pairs */
const PERMISSION_PHRASES: Record<string, string> = {
  "dashboard.view": "View Dashboard",
  "dashboard.create": "Create Dashboard Records",
  "dashboard.edit": "Edit Dashboard",
  "dashboard.delete": "Delete Dashboard Records",
  "dashboard.manage": "Manage Dashboard",
  "rooms.view": "View Rooms",
  "rooms.create": "Create Rooms",
  "rooms.edit": "Edit Rooms",
  "rooms.delete": "Delete Rooms",
  "rooms.manage": "Manage Rooms",
  "room_types.view": "View Room Types",
  "room_types.create": "Create Room Types",
  "room_types.edit": "Edit Room Types",
  "room_types.delete": "Delete Room Types",
  "room_types.manage": "Manage Room Types",
  "floors.view": "View Floors",
  "floors.create": "Create Floors",
  "floors.edit": "Edit Floors",
  "floors.delete": "Delete Floors",
  "floors.manage": "Manage Floors",
  "product_categories.view": "View Product Categories",
  "product_categories.create": "Create Product Categories",
  "product_categories.edit": "Edit Product Categories",
  "product_categories.delete": "Delete Product Categories",
  "product_categories.manage": "Manage Product Categories",
  "products.view": "View Products",
  "products.create": "Create Products",
  "products.edit": "Edit Products",
  "products.delete": "Delete Products",
  "products.manage": "Manage Products",
  "inventory.view": "View Inventory",
  "inventory.create": "Create Stock Movements",
  "inventory.edit": "Edit Stock Movements",
  "inventory.delete": "Delete Stock Movements",
  "inventory.manage": "Manage Inventory",
  "pos.view": "View POS",
  "pos.create": "Create POS Sales",
  "pos.edit": "Edit POS Sales",
  "pos.delete": "Delete POS Sales",
  "pos.manage": "Manage POS",
  "guest_folio.view": "View Guest Folio",
  "guest_folio.create": "Post Folio Charges",
  "guest_folio.edit": "Edit Guest Folio",
  "guest_folio.delete": "Delete Guest Folio",
  "guest_folio.manage": "Manage Guest Folio",
  "reservations.view": "View Reservations",
  "reservations.create": "Create Reservations",
  "reservations.edit": "Edit Reservations",
  "reservations.delete": "Delete Reservations",
  "reservations.manage": "Manage Reservations",
  "guests.view": "View Guests",
  "guests.create": "Create Guests",
  "guests.edit": "Edit Guests",
  "guests.delete": "Delete Guests",
  "guests.manage": "Manage Guests",
  "check_in.view": "View Check-In",
  "check_in.create": "Process Check-In",
  "check_in.edit": "Edit Check-In",
  "check_in.delete": "Delete Check-In Records",
  "check_in.manage": "Manage Check-In",
  "check_out.view": "View Check-Out",
  "check_out.create": "Process Check-Out",
  "check_out.edit": "Edit Check-Out",
  "check_out.delete": "Delete Check-Out Records",
  "check_out.manage": "Manage Check-Out",
  "active_stays.view": "View Active Stays",
  "active_stays.create": "Create Active Stays",
  "active_stays.edit": "Edit Active Stays",
  "active_stays.delete": "Delete Active Stays",
  "active_stays.manage": "Manage Active Stays",
  "housekeeping.view": "View Housekeeping",
  "housekeeping.create": "Create Housekeeping Tasks",
  "housekeeping.edit": "Edit Housekeeping",
  "housekeeping.delete": "Delete Housekeeping Tasks",
  "housekeeping.manage": "Manage Housekeeping",
  "payments.view": "View Payments",
  "payments.create": "Record Payments",
  "payments.edit": "Edit Payments",
  "payments.delete": "Delete Payments",
  "payments.manage": "Manage Payments",
  "payments.override_vat": "Override VAT on Transactions",
  "invoices.view": "View Invoices",
  "invoices.create": "Create Invoices",
  "invoices.edit": "Edit Invoices",
  "invoices.delete": "Delete Invoices",
  "invoices.manage": "Manage Invoices",
  "revenue.view": "View Revenue",
  "revenue.create": "Create Revenue Records",
  "revenue.edit": "Edit Revenue",
  "revenue.delete": "Delete Revenue Records",
  "revenue.manage": "Manage Revenue",
  "night_audit.view": "View Night Audit",
  "night_audit.create": "Create Night Audit",
  "night_audit.edit": "Edit Night Audit",
  "night_audit.delete": "Delete Night Audit",
  "night_audit.manage": "Manage Night Audit",
  "shift_handover.view": "View Shift Handover",
  "shift_handover.create": "Create Shift Handover",
  "shift_handover.edit": "Edit Shift Handover",
  "shift_handover.delete": "Delete Shift Handover",
  "shift_handover.manage": "Manage Shift Handover",
  "reports.view": "View Reports",
  "reports.create": "Create Reports",
  "reports.edit": "Edit Reports",
  "reports.delete": "Delete Reports",
  "reports.manage": "Manage Reports",
  "walk_in.view": "View Walk-In Booking",
  "walk_in.create": "Create Walk-In Bookings",
  "walk_in.edit": "Edit Walk-In Bookings",
  "walk_in.delete": "Delete Walk-In Bookings",
  "walk_in.manage": "Manage Walk-In Booking",
  "staff.view": "View Staff",
  "staff.create": "Create Staff",
  "staff.edit": "Edit Staff",
  "staff.delete": "Delete Staff",
  "staff.manage": "Manage Staff",
  "roles.view": "View Roles",
  "roles.create": "Create Roles",
  "roles.edit": "Edit Roles",
  "roles.delete": "Delete Roles",
  "roles.manage": "Manage Roles",
  "settings.view": "View Settings",
  "settings.create": "Create Settings",
  "settings.edit": "Edit Settings",
  "settings.delete": "Delete Settings",
  "settings.manage": "Manage Settings",
  "activity_logs.view": "View Activity Logs",
  "activity_logs.create": "Create Activity Logs",
  "activity_logs.edit": "Edit Activity Logs",
  "activity_logs.delete": "Delete Activity Logs",
  "activity_logs.manage": "Manage Activity Logs",
  "notifications.view": "View Notifications",
  "notifications.create": "Create Notifications",
  "notifications.edit": "Edit Notifications",
  "notifications.delete": "Delete Notifications",
  "notifications.manage": "Manage Notifications",
  "audit.view": "View Audit",
  "audit.create": "Create Audit Records",
  "audit.edit": "Edit Audit",
  "audit.delete": "Delete Audit Records",
  "audit.manage": "Manage Audit",
};

export type PermissionGroup = {
  moduleId: string;
  moduleLabel: string;
  permissions: { code: string; label: string }[];
};

export function formatPermissionLabel(code: string): string {
  if (PERMISSION_PHRASES[code]) {
    return PERMISSION_PHRASES[code];
  }
  const [permissionModule, action] = code.split(".");
  if (!permissionModule || !action) return humanizeLabel(code);
  const moduleLabel = MODULE_LABELS[permissionModule] ?? humanizeLabel(permissionModule);
  const actionLabel = ACTION_LABELS[action] ?? humanizeLabel(action);
  return `${actionLabel} ${moduleLabel}`;
}

export function groupPermissionsByModule(codes: string[]): PermissionGroup[] {
  const grouped = new Map<string, { code: string; label: string }[]>();

  for (const code of codes) {
    const permissionModule = code.split(".")[0] ?? "other";
    const list = grouped.get(permissionModule) ?? [];
    list.push({ code, label: formatPermissionLabel(code) });
    grouped.set(permissionModule, list);
  }

  const moduleOrder = PERMISSION_MODULES.map((m) => m.id);

  return [...grouped.entries()]
    .sort(([a], [b]) => {
      const ai = moduleOrder.indexOf(a as (typeof moduleOrder)[number]);
      const bi = moduleOrder.indexOf(b as (typeof moduleOrder)[number]);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    })
    .map(([moduleId, permissions]) => ({
      moduleId,
      moduleLabel: MODULE_LABELS[moduleId] ?? moduleId,
      permissions: permissions.sort((a, b) => a.label.localeCompare(b.label)),
    }));
}

/** Module groups for administration section in UI */
export const PERMISSION_GROUP_SECTIONS: { title: string; modules: string[] }[] = [
  {
    title: "Operations",
    modules: [
      "dashboard",
      "rooms",
      "room_types",
      "floors",
      "reservations",
      "guests",
      "check_in",
      "check_out",
      "active_stays",
      "walk_in",
      "housekeeping",
      "product_categories",
    ],
  },
  {
    title: "Inventory",
    modules: ["product_categories", "products", "inventory", "pos", "guest_folio"],
  },
  {
    title: "Finance",
    modules: [
      "payments",
      "invoices",
      "revenue",
      "night_audit",
      "shift_handover",
      "reports",
    ],
  },
  {
    title: "Administration",
    modules: [
      "staff",
      "roles",
      "settings",
      "activity_logs",
      "notifications",
      "audit",
    ],
  },
];
