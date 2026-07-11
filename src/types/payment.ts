export type PaymentStatus =
  | "paid"
  | "partial"
  | "pending"
  | "partially_refunded"
  | "refunded";

export type TransactionPaymentMethod =
  | "cash"
  | "mobile_money"
  | "card"
  | "bank_transfer"
  | "online"
  | "mixed";

export type PaymentMethod = TransactionPaymentMethod;

export type PaymentTimelineEntry = {
  id: string;
  kind: "payment" | "refund";
  sequenceNumber: number;
  receiptNumber: string | null;
  date: string;
  displayDate: string;
  time: string;
  method: TransactionPaymentMethod;
  amount: number;
  description: string;
  reason?: string;
  reference: string;
  vatApplied?: boolean;
  vatRate?: number;
  vatAmount?: number;
  vatExemptionReason?: string;
  vatExemptionNotes?: string;
  printCount?: number;
};

export type Payment = {
  id: string;
  reference: string;
  guestId: string;
  guestName: string;
  reservationId: string;
  reservationNumber: string;
  roomNumber: string;
  method: PaymentMethod;
  amount: number;
  totalPaid: number;
  totalRefunded: number;
  netPaid: number;
  maxRefundable: number;
  balance: number;
  totalDue: number;
  status: PaymentStatus;
  paymentDate: string;
  notes?: string;
  transactionCount: number;
  refundCount: number;
  firstPaymentDate: string;
  lastPaymentDate: string;
  methodsUsed: TransactionPaymentMethod[];
  timeline: PaymentTimelineEntry[];
  /** @deprecated Use timeline — positive payment entries only */
  transactionHistory: PaymentTransaction[];
};

export type PaymentTransaction = {
  id: string;
  date: string;
  time: string;
  receiptNumber: string | null;
  description: string;
  amount: number;
  method: TransactionPaymentMethod;
  reference: string;
};

export type PaymentStats = {
  totalPayments: number;
  revenueToday: number;
  revenueWeek: number;
  revenueMonth: number;
  outstandingBalances: number;
  refundedPayments: number;
};

export type PaymentFormValues = {
  guestId: string;
  reservationId: string;
  amount: number;
  method: PaymentMethod;
  referenceNumber: string;
  notes: string;
  vatApplied?: boolean;
  vatRate?: number;
  vatAmount?: number;
  vatExemptionReason?: VatExemptionReason | "";
  vatExemptionNotes?: string;
  /** Prevents duplicate submissions (double-click, network retry). */
  idempotencyKey?: string;
};

export type VatExemptionReason =
  | "VAT Exempt Customer"
  | "Government Institution"
  | "Diplomatic Mission"
  | "Corporate Agreement"
  | "Complimentary Stay"
  | "Other";

export const VAT_EXEMPTION_REASON_OPTIONS: VatExemptionReason[] = [
  "VAT Exempt Customer",
  "Government Institution",
  "Diplomatic Mission",
  "Corporate Agreement",
  "Complimentary Stay",
  "Other",
];

export type RefundFormValues = {
  amount: number;
  method: TransactionPaymentMethod;
  reason: string;
  notes: string;
  idempotencyKey?: string;
};

export const PAYMENT_STATUS_OPTIONS: { value: PaymentStatus; label: string }[] =
  [
    { value: "paid", label: "Paid" },
    { value: "partial", label: "Partial" },
    { value: "pending", label: "Pending" },
    { value: "partially_refunded", label: "Partially Refunded" },
    { value: "refunded", label: "Refunded" },
  ];

export const PAYMENT_METHOD_OPTIONS: {
  value: TransactionPaymentMethod;
  label: string;
}[] = [
    { value: "cash", label: "Cash" },
    { value: "card", label: "Card" },
    { value: "mobile_money", label: "Mobile Money" },
    { value: "bank_transfer", label: "Bank Transfer" },
    { value: "mixed", label: "Split Payment" },
    { value: "online", label: "Other" },
  ];

export const REFUND_REASON_OPTIONS = [
  "Guest Complaint",
  "Booking Cancellation",
  "Duplicate Payment",
  "Service Issue",
  "Other",
] as const;
