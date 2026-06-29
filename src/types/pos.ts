import type {
  DbSaleCustomerType,
  DbSalePaymentStatus,
  DbPosPaymentMethod,
} from "@/types/database";

export type SaleCustomerType = DbSaleCustomerType;
export type SalePaymentStatus = DbSalePaymentStatus;
export type PosPaymentMethod = DbPosPaymentMethod;

export type PosCartLine = {
  productId: string;
  name: string;
  barcode: string;
  sku: string;
  categoryName: string;
  imageUrl: string | null;
  unitPrice: number;
  vatApplicable: boolean;
  currentStock: number;
  unit: string;
  quantity: number;
};

export type PosCartSettlement = {
  subtotal: number;
  vatAmount: number;
  discount: number;
  total: number;
  vatRate: number;
  vatApplied: boolean;
  lines: PosCartLineSettlement[];
};

export type PosCartLineSettlement = {
  productId: string;
  lineSubtotal: number;
  vatAmount: number;
  total: number;
};

export type PosSaleItem = {
  id: string;
  saleId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  vatApplicable: boolean;
  vatAmount: number;
  lineSubtotal: number;
  total: number;
};

export type PosSalePayment = {
  id: string;
  saleId: string;
  paymentMethod: PosPaymentMethod;
  amount: number;
  reference: string | null;
  receiptNumber: string | null;
  createdAt: string;
};

export type PosSale = {
  id: string;
  saleNumber: string;
  customerType: SaleCustomerType;
  reservationId: string | null;
  guestId: string | null;
  guestName: string | null;
  reservationNumber: string | null;
  roomNumber: string | null;
  cashierId: string;
  cashierName: string | null;
  subtotal: number;
  vatAmount: number;
  discount: number;
  total: number;
  paymentStatus: SalePaymentStatus;
  vatApplied: boolean;
  vatRate: number | null;
  notes: string | null;
  createdAt: string;
  items: PosSaleItem[];
  payments: PosSalePayment[];
};

export type PosSaleCompletionResult = {
  sale: PosSale;
  idempotentReplay: boolean;
};

export type CompletePosSaleInput = {
  customerType: SaleCustomerType;
  reservationId?: string | null;
  guestId?: string | null;
  lines: PosCartLine[];
  discount?: number;
  vatApplied?: boolean;
  vatRate: number;
  paymentMethod: PosPaymentMethod;
  paymentReference?: string;
  notes?: string;
  idempotencyKey?: string;
};

export type PosVatOverride = {
  vatApplied: boolean;
  exemptionReason?: string;
  exemptionNotes?: string;
};

export type PosSaleHistoryItem = {
  id: string;
  saleNumber: string;
  createdAt: string;
  cashierId: string;
  cashierName: string | null;
  customerType: SaleCustomerType;
  guestName: string | null;
  roomNumber: string | null;
  saleTypeLabel: "Walk-In" | "Charge To Room";
  paymentMethod: PosPaymentMethod | null;
  paymentMethodLabel: string;
  total: number;
  paymentStatus: SalePaymentStatus;
  receiptNumber: string | null;
};

export type PosSaleListFilters = {
  search?: string;
  customerType?: SaleCustomerType | "all";
  paymentMethod?: PosPaymentMethod | "all";
  cashierId?: string;
  dateFrom?: string;
  dateTo?: string;
};

export const POS_SALE_HISTORY_PAGE_SIZE = 20;

export const POS_PAYMENT_METHOD_OPTIONS: {
  value: PosPaymentMethod;
  label: string;
}[] = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "mobile_money", label: "Mobile Money" },
  { value: "room_charge", label: "Charge To Room" },
];

export const POS_CUSTOMER_TYPE_OPTIONS: {
  value: SaleCustomerType;
  label: string;
}[] = [
  { value: "walk_in", label: "Walk-In Customer" },
  { value: "room_charge", label: "Charge To Room" },
];

/** Future reporting hooks — not implemented in Stage 4 UI. */
export type PosReportDimensions =
  | "product"
  | "category"
  | "cashier"
  | "payment_method"
  | "room_charge"
  | "walk_in"
  | "vat"
  | "revenue";
