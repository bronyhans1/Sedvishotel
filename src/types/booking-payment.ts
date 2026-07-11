/** Reception / booking wizard payment policy — drives lifecycle before commit. */
export type BookingPaymentPolicy =
  | "collect_now"
  | "pay_at_check_out"
  | "company_billing"
  | "complimentary";

/** Lifecycle status for draft bookings and reception workflows (SHMS 2.1.0+). */
export type BookingPaymentLifecycleStatus =
  | "not_started"
  | "awaiting_payment"
  | "partially_paid"
  | "paid"
  | "pay_at_check_out"
  | "company_billing"
  | "complimentary";

export const BOOKING_PAYMENT_POLICY_OPTIONS: {
  value: BookingPaymentPolicy;
  label: string;
  description: string;
}[] = [
  {
    value: "collect_now",
    label: "Collect Payment Now",
    description: "Record full, partial, or no payment at the desk.",
  },
  {
    value: "pay_at_check_out",
    label: "Pay at Check-Out",
    description: "Defer collection until departure.",
  },
  {
    value: "company_billing",
    label: "Company Billing",
    description: "Invoice to company account (future AR integration).",
  },
  {
    value: "complimentary",
    label: "Complimentary",
    description: "No charge — complimentary stay.",
  },
];

export const BOOKING_PAYMENT_LIFECYCLE_LABELS: Record<
  BookingPaymentLifecycleStatus,
  string
> = {
  not_started: "Not Started",
  awaiting_payment: "Awaiting Payment",
  partially_paid: "Partially Paid",
  paid: "Paid",
  pay_at_check_out: "Pay at Check-Out",
  company_billing: "Company Billing",
  complimentary: "Complimentary",
};
