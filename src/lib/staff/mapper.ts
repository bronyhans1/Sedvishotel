import type { DbStaffWithUser, DbUserStatus } from "@/types/database";
import type { StaffMember, StaffRole, StaffStats, StaffStatus } from "@/types/staff";

function formatLastLogin(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function mapUserStatus(status: DbUserStatus): StaffStatus {
  if (status === "suspended" || status === "inactive") {
    return "suspended";
  }
  return "active";
}

export function mapDbStaffToStaffMember(row: DbStaffWithUser): StaffMember {
  const notes = row.notes
    ? row.notes
        .split("\n")
        .map((n) => n.trim())
        .filter(Boolean)
    : [];

  return {
    id: row.id,
    userId: row.user_id,
    fullName: row.user.full_name,
    email: row.user.email,
    phone: row.phone ?? "—",
    role: row.role_id as StaffRole,
    department: row.department ?? "—",
    employeeId: row.employee_id ?? row.id.slice(0, 8).toUpperCase(),
    status: mapUserStatus(row.user.status),
    dateJoined: row.hire_date ?? row.created_at.slice(0, 10),
    lastLogin: formatLastLogin(row.user.last_login_at),
    avatarUrl: row.avatar_url ?? undefined,
    notes,
  };
}

export function computeStaffStats(staff: StaffMember[]): StaffStats {
  return {
    total: staff.length,
    active: staff.filter((s) => s.status === "active").length,
    managers: staff.filter((s) => s.role === "manager").length,
    receptionists: staff.filter((s) => s.role === "receptionist").length,
    housekeeping: staff.filter((s) => s.role === "housekeeping").length,
    suspended: staff.filter((s) => s.status === "suspended").length,
  };
}

export function generateTemporaryPassword(length = 12): string {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$";
  let result = "";
  for (let i = 0; i < length; i += 1) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
