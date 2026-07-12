import type { DbSaleWithRelations } from "@/types/database";
import type { SalePaymentStatus } from "@/types/pos";

export type FolioSettlementForSaleStatus = {
  totalAmount: number;
  outstandingBalance: number;
} | null;

/**
 * Canonical POS sale payment status resolver.
 * Room-charge sales derive status from folio settlement; all other sales use the DB column.
 */
export function resolveSalePaymentStatus(
  sale: Pick<
    DbSaleWithRelations,
    "payment_status" | "customer_type" | "reservation_id"
  >,
  settlement: FolioSettlementForSaleStatus
): SalePaymentStatus {
  if (
    sale.payment_status === "void" ||
    sale.customer_type !== "room_charge" ||
    !sale.reservation_id
  ) {
    return sale.payment_status;
  }

  if (!settlement || settlement.totalAmount <= 0) {
    return sale.payment_status;
  }

  return settlement.outstandingBalance <= 0 ? "paid" : "pending";
}

/**
 * Batch-resolve payment statuses for a list of sales, deduplicating folio lookups
 * by reservation_id for room-charge rows.
 */
export async function resolveSalePaymentStatuses(
  sales: Array<
    Pick<DbSaleWithRelations, "payment_status" | "customer_type" | "reservation_id">
  >,
  getSettlement: (reservationId: string) => Promise<FolioSettlementForSaleStatus>
): Promise<SalePaymentStatus[]> {
  const settlementByReservation = new Map<
    string,
    Promise<FolioSettlementForSaleStatus>
  >();

  return Promise.all(
    sales.map((sale) => {
      if (
        sale.customer_type !== "room_charge" ||
        sale.payment_status === "void" ||
        !sale.reservation_id
      ) {
        return Promise.resolve(resolveSalePaymentStatus(sale, null));
      }

      const existing = settlementByReservation.get(sale.reservation_id);
      if (existing) {
        return existing.then((settlement) =>
          resolveSalePaymentStatus(sale, settlement)
        );
      }

      const settlementPromise = getSettlement(sale.reservation_id);
      settlementByReservation.set(sale.reservation_id, settlementPromise);
      return settlementPromise.then((settlement) =>
        resolveSalePaymentStatus(sale, settlement)
      );
    })
  );
}
