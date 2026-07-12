/**
 * Architecture preparation for SHMS v2.3.0 corporate & group reservations.
 * No UI or workflow — types and metadata contracts only.
 */

export type CorporateAccountRef = {
  companyId: string;
  companyName: string;
  accountNumber?: string;
  creditLimit?: number;
  billingContactEmail?: string;
};

export type MasterFolioRef = {
  masterFolioId: string;
  groupReservationId: string;
  label: string;
  subsidiaryFolioIds: string[];
};

export type GroupBillingContext = {
  groupReservationId: string;
  masterFolioId?: string;
  corporateAccount?: CorporateAccountRef;
  billingMode: "guest_pays" | "company_billing" | "split_billing";
  installmentPlanId?: string;
  depositRequired?: number;
};

export type BulkPaymentAllocation = {
  bulkPaymentId: string;
  totalAmount: number;
  allocations: Array<{
    reservationId: string;
    folioId?: string;
    amount: number;
    receiptNumber?: string;
  }>;
};

export type InstallmentScheduleEntry = {
  installmentNumber: number;
  dueDate: string;
  amountDue: number;
  amountPaid: number;
  status: "pending" | "partial" | "paid" | "overdue";
  receiptNumber?: string;
};

export type DepositHold = {
  depositId: string;
  reservationId: string;
  amount: number;
  status: "held" | "applied" | "refunded" | "forfeited";
  receiptNumber?: string;
  appliedAt?: string;
};

export type GroupInvoiceRef = {
  groupInvoiceId: string;
  groupReservationId: string;
  invoiceNumber: string;
  subsidiaryInvoiceIds: string[];
  corporateAccountId?: string;
};

export type PaymentReversalMetadata = {
  canReverse: boolean;
  reversalReason?: string | null;
  reversedBy?: string | null;
  reversedAt?: string | null;
  reversalReference?: string | null;
};

/** v2.3.0 group reservation contracts — schema/UI not yet implemented. */

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
  | "cancelled";

export type GroupBillingPolicy =
  | "company_pays_all"
  | "guest_pays_all"
  | "company_pays_accommodation"
  | "guest_pays_extras"
  | "mixed_billing"
  | "pay_at_check_out"
  | "deposit"
  | "credit"
  | "complimentary";

export type GroupReservationRef = {
  groupReservationId: string;
  groupNumber: string;
  groupName: string;
  groupType: GroupReservationType;
  status: GroupReservationStatus;
  masterReservationId?: string;
  masterFolioId?: string;
  corporateAccount?: CorporateAccountRef;
  billingPolicy: GroupBillingPolicy;
  arrivalDate: string;
  departureDate: string;
  expectedGuests: number;
  expectedRooms: number;
  childReservationIds: string[];
};
