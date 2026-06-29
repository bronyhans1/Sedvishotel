import type { TransactionPaymentMethod } from "@/types/payment";

export const LATE_CHECKOUT_REASONS = [
  "Guest Request",
  "Flight Delay",
  "Transport Delay",
  "Special Approval",
  "VIP Courtesy",
  "Management Waiver",
  "Other",
] as const;

export type LateCheckOutReason = (typeof LATE_CHECKOUT_REASONS)[number];

export type LateCheckoutPolicyMode = "flat" | "hour_based";

export type LateCheckOutInput = {
  reason: LateCheckOutReason;
  notes?: string;
  actualCheckoutTime: string;
  paymentMethod: TransactionPaymentMethod;
  complimentary?: boolean;
};

export type LateCheckOutPreview = {
  reservationId: string;
  reservationNumber: string;
  guestName: string;
  guestId: string;
  roomNumber: string;
  scheduledCheckOutDate: string;
  policyCheckOutTime: string;
  actualCheckoutTime: string;
  lateCheckoutFee: number;
  hoursLate: number;
  policyType: LateCheckoutPolicyMode | "complimentary";
  policyLabel: string;
  roomRate: number;
  balance: number;
  totalAmount: number;
  complimentary: boolean;
};

export type CheckoutPolicy = {
  checkOutTime: string;
  lateCheckoutPolicyMode: LateCheckoutPolicyMode;
  lateCheckoutFee: number;
  hourFee1To2: number;
  hourFee2To4: number;
  hourFee4To6: number;
};
