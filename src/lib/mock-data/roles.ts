import type {
  PermissionAction,
  PermissionMatrix,
  PermissionModule,
  RoleDefinition,
  StaffRoleId,
} from "@/types/role";

export const PERMISSION_MODULES: { id: PermissionModule; label: string }[] = [
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

export const PERMISSION_ACTIONS: PermissionAction[] = [
  "view",
  "create",
  "edit",
  "delete",
  "manage",
  "override_vat",
];

export const ROLE_COLUMNS: StaffRoleId[] = [
  "admin",
  "manager",
  "receptionist",
  "housekeeping",
];

export const mockRoles: RoleDefinition[] = [
  {
    id: "admin",
    name: "Admin",
    description: "Full system access across all modules and configuration.",
    usersAssigned: 1,
  },
  {
    id: "manager",
    name: "Manager",
    description: "Operational oversight, finance, reports, and staff supervision.",
    usersAssigned: 2,
  },
  {
    id: "receptionist",
    name: "Receptionist",
    description: "Front desk operations, guests, reservations, and check-in/out.",
    usersAssigned: 3,
  },
  {
    id: "housekeeping",
    name: "Housekeeping",
    description: "Room status board and housekeeping task management.",
    usersAssigned: 4,
  },
];

function cell(
  view: boolean,
  create = false,
  edit = false,
  del = false,
  manage = false,
  overrideVat = false
): Record<PermissionAction, boolean> {
  return { view, create, edit, delete: del, manage, override_vat: overrideVat };
}

function buildMatrix(): PermissionMatrix {
  const all = (level: "full" | "ops" | "desk" | "hk") => {
    const modules = PERMISSION_MODULES.map((m) => m.id);
    const matrix = {} as PermissionMatrix;
    for (const mod of modules) {
      matrix[mod] = {
        admin: cell(true, true, true, true, true),
        manager:
          level === "full" || level === "ops"
            ? cell(
                true,
                true,
                true,
                false,
                mod !== "staff" && mod !== "settings" && mod !== "roles"
              )
            : cell(true, false, false, false, false),
        receptionist:
          level === "desk" || mod === "dashboard" || mod === "notifications"
            ? cell(
                true,
                ["reservations", "guests", "check_in", "check_out", "walk_in"].includes(mod),
                ["reservations", "guests", "check_in", "check_out"].includes(mod),
                false,
                false
              )
            : cell(false, false, false, false, false),
        housekeeping:
          level === "hk" ||
          mod === "housekeeping" ||
          mod === "dashboard" ||
          mod === "notifications"
            ? cell(
                true,
                mod === "housekeeping",
                mod === "housekeeping",
                false,
                false
              )
            : cell(false, false, false, false, false),
      };
    }
    return matrix;
  };
  return all("full");
}

const matrix = buildMatrix();

// RC2.2 / RC2.3 finance & shift permissions
matrix.night_audit.receptionist = cell(true, false, false, false, false);
matrix.night_audit.manager = cell(true, true, false, false, true);
matrix.shift_handover.receptionist = cell(true, true, true, false, false);
matrix.shift_handover.housekeeping = cell(true, false, false, false, false);
matrix.shift_handover.manager = cell(true, true, true, false, true);

matrix.payments.admin = cell(true, true, true, true, true, true);
matrix.payments.manager = cell(true, true, true, false, true, true);

export const mockPermissionMatrix: PermissionMatrix = matrix;

export function getRoleById(id: StaffRoleId): RoleDefinition | undefined {
  return mockRoles.find((r) => r.id === id);
}

export function countPermissionsForRole(roleId: StaffRoleId): number {
  let count = 0;
  for (const mod of PERMISSION_MODULES) {
    for (const action of PERMISSION_ACTIONS) {
      if (mockPermissionMatrix[mod.id][roleId][action]) count += 1;
    }
  }
  return count;
}
