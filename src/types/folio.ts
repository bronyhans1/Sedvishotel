import type {
  DbFolioDebitCredit,
  DbFolioEntryType,
  DbGuestFolioStatus,
} from "@/types/database";

export type GuestFolioStatus = DbGuestFolioStatus;
export type FolioEntryType = DbFolioEntryType;
export type FolioDebitCredit = DbFolioDebitCredit;

export type FolioEntry = {
  id: string;
  folioId: string;
  entryType: FolioEntryType;
  sourceModule: string;
  sourceReference: string | null;
  description: string;
  quantity: number;
  unitAmount: number;
  subtotal: number;
  vatAmount: number;
  total: number;
  debitCredit: FolioDebitCredit;
  createdById: string | null;
  createdByName: string | null;
  createdAt: string;
  runningBalance?: number;
};

export type GuestFolio = {
  id: string;
  reservationId: string;
  guestId: string;
  roomId: string | null;
  folioNumber: string;
  status: GuestFolioStatus;
  openedAt: string;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  guestName: string | null;
  reservationNumber: string | null;
  roomNumber: string | null;
  checkInDate: string | null;
  checkOutDate: string | null;
  entries: FolioEntry[];
  outstandingBalance: number;
  summary: FolioSummary;
};

export type FolioSummary = {
  accommodation: number;
  posCharges: number;
  miscCharges: number;
  discounts: number;
  payments: number;
  vat: number;
  outstandingBalance: number;
};

export type PostFolioEntryInput = {
  folioId: string;
  entryType: FolioEntryType;
  sourceModule: string;
  sourceReference?: string | null;
  description: string;
  quantity?: number;
  unitAmount?: number;
  subtotal: number;
  vatAmount?: number;
  total: number;
  debitCredit: FolioDebitCredit;
};

export type CreateGuestFolioInput = {
  reservationId: string;
  guestId: string;
  roomId?: string | null;
};

export type ManualChargeInput = {
  folioId: string;
  description: string;
  amount: number;
  vatAmount?: number;
  reason?: string;
};

export type ManualCreditInput = {
  folioId: string;
  description: string;
  amount: number;
  reason?: string;
};

export type FolioListItem = {
  id: string;
  folioNumber: string;
  status: GuestFolioStatus;
  guestName: string;
  reservationNumber: string;
  roomNumber: string;
  checkInDate: string;
  checkOutDate: string;
  outstandingBalance: number;
  openedAt: string;
};

export type FolioStatusFilter = "all" | GuestFolioStatus;
export type FolioBalanceFilter = "all" | "outstanding" | "paid";

export const FOLIO_ENTRY_TYPE_LABELS: Record<FolioEntryType, string> = {
  accommodation: "Accommodation",
  retail_pos: "Retail POS",
  restaurant: "Restaurant",
  laundry: "Laundry",
  spa: "Spa",
  misc_charge: "Misc Charge",
  manual_charge: "Manual Charge",
  discount: "Discount",
  adjustment: "Adjustment",
  payment: "Payment",
  refund: "Refund",
};

/** Future module hooks — restaurant, laundry, spa post via GuestFolioService.postEntry(). */
export type FutureFolioSourceModule = "restaurant" | "laundry" | "spa";
