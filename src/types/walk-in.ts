import type { IdType } from "@/types/guest";
import type { TransactionPaymentMethod } from "@/types/payment";

export type WalkInFormValues = {
  fullName: string;
  phone: string;
  email: string;
  nationality: string;
  idType: IdType;
  idNumber: string;
  roomNumber: string;
  checkInDate: string;
  checkOutDate: string;
  paymentMethod: TransactionPaymentMethod;
  amountPaid: number;
};

export type WalkInRoomOption = {
  id: string;
  roomNumber: string;
  roomType: string;
  price: number;
  floorLabel: string;
};

export type WalkInResult = {
  guestId: string;
  reservationId: string;
  paymentId?: string;
};
