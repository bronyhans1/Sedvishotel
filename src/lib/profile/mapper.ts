import type { DbStaffWithUser } from "@/types/database";
import type { UserProfile } from "@/types/profile";
import type { StaffRole, StaffStatus } from "@/types/staff";

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

function mapUserStatus(status: string): StaffStatus {
  if (status === "suspended" || status === "inactive") return "suspended";
  return "active";
}

export function mapDbStaffToUserProfile(row: DbStaffWithUser): UserProfile {
  return {
    profileId: row.id,
    userId: row.user_id,
    fullName: row.user.full_name,
    email: row.user.email,
    phone: row.phone ?? "",
    address: row.address ?? "",
    emergencyContact: row.emergency_contact ?? "",
    nextOfKin: row.next_of_kin ?? "",
    nationality: row.nationality ?? "",
    idNumber: row.id_number ?? "",
    role: row.role_id as StaffRole,
    department: row.department ?? "—",
    employeeId: row.employee_id ?? row.id.slice(0, 8).toUpperCase(),
    status: mapUserStatus(row.user.status),
    dateJoined: row.hire_date ?? row.created_at.slice(0, 10),
    lastLogin: formatLastLogin(row.user.last_login_at),
    avatarUrl: row.avatar_url ?? undefined,
  };
}
