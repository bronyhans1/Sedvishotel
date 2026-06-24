export type InvoiceStatus = "paid" | "partial" | "outstanding" | "draft";

export type Invoice = {
  id: string;
  invoiceNumber: string;
  guestId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guestAddress: string;
  reservationId: string;
  reservationNumber: string;
  roomNumber: string;
  roomTypeName: string;
  floorLabel: string;
  invoiceDate: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfNights: number;
  roomRate: number;
  roomCharges: number;
  taxes: number;
  additionalCharges: number;
  discounts: number;
  totalAmount: number;
  amountPaid: number;
  balance: number;
  status: InvoiceStatus;
};

export type InvoiceStats = {
  generated: number;
  paid: number;
  outstanding: number;
  averageValue: number;
};
