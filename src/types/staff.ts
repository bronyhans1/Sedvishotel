export type StaffRole = "admin" | "manager" | "receptionist" | "housekeeping";

export type StaffStatus = "active" | "suspended";

export type StaffMember = {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  role: StaffRole;
  department: string;
  employeeId: string;
  status: StaffStatus;
  dateJoined: string;
  lastLogin: string;
  avatarUrl?: string;
  notes: string[];
};

export type StaffStats = {
  total: number;
  active: number;
  managers: number;
  receptionists: number;
  housekeeping: number;
  suspended: number;
};

export type StaffFormValues = {
  fullName: string;
  email: string;
  phone: string;
  role: StaffRole;
  department: string;
  status: StaffStatus;
};

export const STAFF_ROLE_OPTIONS: { value: StaffRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "receptionist", label: "Receptionist" },
  { value: "housekeeping", label: "Housekeeping" },
];

export const STAFF_STATUS_OPTIONS: { value: StaffStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
];

export type CreateStaffFormValues = StaffFormValues & {
  employeeId: string;
  temporaryPassword: string;
};

export type CreateStaffInput = {
  fullName: string;
  email: string;
  phone: string;
  role: StaffRole;
  department: string;
  employeeId: string;
  temporaryPassword: string;
};

export type UpdateStaffInput = {
  fullName: string;
  email: string;
  phone: string;
  role: StaffRole;
  department: string;
  status: StaffStatus;
};
