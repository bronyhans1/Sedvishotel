export type GroupReservationType =
  | "corporate"
  | "government"
  | "ngo"
  | "school"
  | "church"
  | "sports_team"
  | "conference"
  | "wedding"
  | "tour"
  | "other";

export type GroupReservationStatus =
  | "draft"
  | "confirmed"
  | "partially_checked_in"
  | "in_house"
  | "partially_checked_out"
  | "completed"
  | "closed"
  | "cancelled";

export type GroupBillingPolicy =
  | "company_pays_all"
  | "guest_pays_all"
  | "company_pays_accommodation"
  | "guest_pays_extras"
  | "mixed_billing"
  | "deposit"
  | "credit"
  | "complimentary"
  | "pay_at_check_out";

export type GroupReservation = {
  id: string;
  groupNumber: string;
  groupName: string;
  groupType: GroupReservationType;
  status: GroupReservationStatus;
  billingPolicy: GroupBillingPolicy;
  corporateAccountId: string | null;
  masterReservationId: string | null;
  arrivalDate: string;
  departureDate: string;
  expectedRooms: number;
  expectedGuests: number;
  actualRooms: number;
  actualGuests: number;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GroupReservationSummary = {
  group: GroupReservation;
  reservationCount: number;
  blockCount: number;
  checkedInCount: number;
  checkedOutCount: number;
  corporateAccountName: string | null;
};

export type GroupFinancialSummary = {
  groupId: string;
  totalCharges: number;
  totalPayments: number;
  outstandingBalance: number;
  masterFolioId: string | null;
  childFolioCount: number;
};

export type CreateGroupInput = {
  groupName: string;
  groupType: GroupReservationType;
  billingPolicy: GroupBillingPolicy;
  corporateAccountId?: string | null;
  arrivalDate: string;
  departureDate: string;
  expectedRooms?: number;
  expectedGuests?: number;
  notes?: string;
};

export type UpdateGroupInput = Partial<
  Omit<CreateGroupInput, "arrivalDate" | "departureDate">
> & {
  arrivalDate?: string;
  departureDate?: string;
  status?: GroupReservationStatus;
};

export type GroupSearchFilters = {
  query?: string;
  status?: GroupReservationStatus;
  groupType?: GroupReservationType;
  corporateAccountId?: string;
  arrivalFrom?: string;
  arrivalTo?: string;
};

export const GROUP_BILLING_POLICY_LABELS: Record<GroupBillingPolicy, string> = {
  company_pays_all: "Company Pays All",
  guest_pays_all: "Guest Pays All",
  company_pays_accommodation: "Company Pays Accommodation",
  guest_pays_extras: "Guest Pays Extras",
  mixed_billing: "Mixed Billing",
  deposit: "Deposit",
  credit: "Credit",
  complimentary: "Complimentary",
  pay_at_check_out: "Pay at Check-Out",
};

export const GROUP_TYPE_LABELS: Record<GroupReservationType, string> = {
  corporate: "Corporate",
  government: "Government",
  ngo: "NGO",
  school: "School",
  church: "Church",
  sports_team: "Sports Team",
  conference: "Conference",
  wedding: "Wedding",
  tour: "Tour",
  other: "Other",
};
