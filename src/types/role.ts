export type PermissionAction =
  | "view"
  | "create"
  | "edit"
  | "delete"
  | "manage"
  | "override_vat";

export type StaffRoleId = "admin" | "manager" | "receptionist" | "housekeeping";

export type PermissionModule =
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
  | "guest_folio";

export type RoleDefinition = {
  id: StaffRoleId;
  name: string;
  description: string;
  usersAssigned: number;
};

export type PermissionMatrix = Record<
  PermissionModule,
  Record<StaffRoleId, Record<PermissionAction, boolean>>
>;
