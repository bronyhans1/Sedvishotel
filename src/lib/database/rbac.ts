import type { DbPermissionAction, DbPermissionModule, DbRoleId } from "@/types/database";

/** Mirrors frontend PERMISSION_MODULES */
export const PERMISSION_MODULES: { id: DbPermissionModule; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "rooms", label: "Rooms" },
  { id: "room_types", label: "Room Types" },
  { id: "floors", label: "Floors" },
  { id: "night_audit", label: "Night Audit" },
  { id: "shift_handover", label: "Shift Handover" },
  { id: "reservations", label: "Reservations" },
  { id: "guests", label: "Guests" },
  { id: "check_in", label: "Check-In" },
  { id: "check_out", label: "Check-Out" },
  { id: "active_stays", label: "Active Stays" },
  { id: "housekeeping", label: "Housekeeping" },
  { id: "payments", label: "Payments" },
  { id: "invoices", label: "Invoices" },
  { id: "revenue", label: "Revenue" },
  { id: "reports", label: "Reports" },
  { id: "walk_in", label: "Walk-In Booking" },
  { id: "staff", label: "Staff" },
  { id: "roles", label: "Roles" },
  { id: "settings", label: "Settings" },
  { id: "activity_logs", label: "Activity Logs" },
  { id: "notifications", label: "Notifications" },
  { id: "audit", label: "Audit" },
];

export const PERMISSION_ACTIONS: DbPermissionAction[] = [
  "view",
  "create",
  "edit",
  "delete",
  "manage",
];

export const SYSTEM_ROLES: { id: DbRoleId; name: string }[] = [
  { id: "admin", name: "Admin" },
  { id: "manager", name: "Manager" },
  { id: "receptionist", name: "Receptionist" },
  { id: "housekeeping", name: "Housekeeping" },
];

export function permissionCode(
  module: DbPermissionModule,
  action: DbPermissionAction
): string {
  return `${module}.${action}`;
}
