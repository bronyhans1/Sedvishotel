export type GuestStatus = "in_house" | "reserved" | "checked_out";

export type IdType =
  | "passport"
  | "national_id"
  | "drivers_license"
  | "other";

export type Guest = {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  nationality: string;
  idType: IdType;
  idNumber: string;
  address: string;
  guestStatus: GuestStatus;
  totalVisits: number;
  totalSpent: number;
  vipStatus: boolean;
  notes: string[];
};

export type GuestStats = {
  totalGuests: number;
  currentGuests: number;
  returningGuests: number;
  vipGuests: number;
  checkInsToday: number;
  checkOutsToday: number;
};

export type GuestStayRecord = {
  reservationId: string;
  reservationNumber: string;
  roomNumber: string;
  checkInDate: string;
  checkOutDate: string;
  amountPaid: number;
  status: string;
  nights: number;
};

export type GuestProfileStats = {
  totalVisits: number;
  totalNights: number;
  totalSpent: number;
  averageStayDuration: number;
};

export type GuestFormValues = {
  fullName: string;
  phone: string;
  email: string;
  nationality: string;
  idType: IdType;
  idNumber: string;
  address: string;
  vipStatus: boolean;
  notes: string;
};

export const GUEST_STATUS_OPTIONS: { value: GuestStatus; label: string }[] = [
  { value: "in_house", label: "In House" },
  { value: "reserved", label: "Reserved" },
  { value: "checked_out", label: "Checked Out" },
];

export const ID_TYPE_OPTIONS: { value: IdType; label: string }[] = [
  { value: "national_id", label: "National ID" },
  { value: "passport", label: "Passport" },
  { value: "drivers_license", label: "Driver's License" },
  { value: "other", label: "Other" },
];
