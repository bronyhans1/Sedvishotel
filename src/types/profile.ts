import type { StaffRole, StaffStatus } from "@/types/staff";

export type UserProfile = {
  profileId: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  emergencyContact: string;
  nextOfKin: string;
  nationality: string;
  idNumber: string;
  role: StaffRole;
  department: string;
  employeeId: string;
  status: StaffStatus;
  dateJoined: string;
  lastLogin: string;
  avatarUrl?: string;
};

export type UpdateOwnProfileInput = {
  fullName: string;
  phone: string;
  email: string;
  address?: string;
  emergencyContact?: string;
  nextOfKin?: string;
  nationality?: string;
  idNumber?: string;
};

export type ChangeOwnPasswordInput = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};
