import type { TransactionPaymentMethod } from "@/types/payment";

export type StayExtensionRecord = {
  fromCheckout: string;
  toCheckout: string;
  extraNights: number;
  extraAmount: number;
  notes?: string;
  extendedAt: string;
};

export type ExtendStayInput = {
  newCheckOutDate: string;
  notes?: string;
  paymentMethod?: TransactionPaymentMethod;
  recordPayment?: boolean;
};

export type ExtendStayPreview = {
  reservationId: string;
  reservationNumber: string;
  guestName: string;
  roomNumber: string;
  currentCheckOutDate: string;
  newCheckOutDate: string;
  currentNights: number;
  newNights: number;
  extraNights: number;
  currentTotal: number;
  newTotal: number;
  extraAmount: number;
  amountPaid: number;
  paymentRequired: number;
};
