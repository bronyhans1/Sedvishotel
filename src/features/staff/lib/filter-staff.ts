import type { StaffMember, StaffRole, StaffStatus } from "@/types/staff";

export function filterStaff(
  staff: StaffMember[],
  search: string,
  role: StaffRole | "all",
  status: StaffStatus | "all"
): StaffMember[] {
  const q = search.trim().toLowerCase();
  return staff.filter((s) => {
    if (role !== "all" && s.role !== role) return false;
    if (status !== "all" && s.status !== status) return false;
    if (!q) return true;
    return (
      s.fullName.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.phone.includes(q) ||
      s.department.toLowerCase().includes(q)
    );
  });
}
