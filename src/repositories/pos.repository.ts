import type {
  DbPosPaymentMethod,
  DbSale,
  DbSaleCustomerType,
  DbSaleItem,
  DbSalePayment,
  DbSalePaymentStatus,
  DbSaleWithRelations,
} from "@/types/database";
import type { PaginatedResult, PaginationParams } from "@/repositories/types";

export type CreatePosSaleInput = {
  id: string;
  saleNumber: string;
  customerType: DbSaleCustomerType;
  reservationId?: string | null;
  guestId?: string | null;
  cashierId: string;
  subtotal: number;
  vatAmount: number;
  discount: number;
  total: number;
  paymentStatus: DbSalePaymentStatus;
  vatApplied: boolean;
  vatRate: number | null;
  notes?: string | null;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    vatApplicable: boolean;
    vatAmount: number;
    lineSubtotal: number;
    total: number;
  }>;
  payment?: {
    paymentMethod: DbPosPaymentMethod;
    amount: number;
    reference?: string | null;
    receiptNumber?: string | null;
  };
};

export type PosSaleListFilters = {
  search?: string;
  customerType?: DbSaleCustomerType;
  paymentMethod?: DbPosPaymentMethod;
  cashierId?: string;
  dateFrom?: string;
  dateTo?: string;
};

export type PosSaleCashierOption = {
  id: string;
  fullName: string;
};

export interface IPosRepository {
  getNextSaleNumber(): Promise<string>;
  getNextReceiptNumber(): Promise<string>;
  createSale(input: CreatePosSaleInput): Promise<DbSaleWithRelations>;
  getById(id: string): Promise<DbSaleWithRelations | null>;
  listPaymentsForBusinessDate(businessDate: string): Promise<DbSalePayment[]>;
  listSalesForBusinessDate(businessDate: string): Promise<DbSale[]>;
  findAll(
    filters?: PosSaleListFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResult<DbSaleWithRelations>>;
  listCashiers(): Promise<PosSaleCashierOption[]>;
  commitSaleAtomically(
    input: import("@/lib/pos/atomic-commit").PosAtomicCommitInput
  ): Promise<import("@/lib/pos/atomic-commit").PosAtomicCommitResult>;
}

export type { DbSale, DbSaleItem, DbSalePayment, DbSaleWithRelations };
