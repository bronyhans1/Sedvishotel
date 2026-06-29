export const EARLY_CHECKOUT_REASONS = [
  "Guest Request",
  "Travel Change",
  "Medical Emergency",
  "Dissatisfied Guest",
  "Flight Schedule Change",
  "Other",
] as const;

export type EarlyCheckOutReason = (typeof EARLY_CHECKOUT_REASONS)[number];

export type EarlyCheckOutInput = {
  reason: EarlyCheckOutReason;
  notes?: string;
  actualCheckOutDate?: string;
};

export type EarlyCheckOutPreview = {
  reservationId: string;
  reservationNumber: string;
  guestName: string;
  roomNumber: string;
  originalCheckOutDate: string;
  actualCheckOutDate: string;
  originalNights: number;
  actualNights: number;
  unusedNights: number;
  refundAmount: number;
  roomRate: number;
  totalAmount: number;
  amountPaid: number;
};
