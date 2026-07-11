/**
 * Architecture preparation for SHMS v2.2.0 corporate & group reservations.
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
