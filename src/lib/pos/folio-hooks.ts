/**
 * Stage 5 Guest Folio integration point.
 * Room-charge POS sales post debits via GuestFolioService.integratePosRoomCharge()
 * → postEntry() with entry_type retail_pos. Inventory logic is unchanged.
 */
import type { PosSale } from "@/types/pos";

/** All folio financial posting must go through GuestFolioService.postEntry(). */
export const GUEST_FOLIO_POST_ENTRY = "GuestFolioService.postEntry" as const;

export type GuestFolioCharge = {
  saleId: string;
  saleNumber: string;
  reservationId: string;
  guestId: string | null;
  total: number;
  createdAt: string;
};

export function mapSaleToFolioCharge(sale: PosSale): GuestFolioCharge | null {
  if (sale.customerType !== "room_charge" || !sale.reservationId) {
    return null;
  }
  return {
    saleId: sale.id,
    saleNumber: sale.saleNumber,
    reservationId: sale.reservationId,
    guestId: sale.guestId,
    total: sale.total,
    createdAt: sale.createdAt,
  };
}

/** DB filter for room-charge sales only. Do not filter by payment_status — use resolveSalePaymentStatus(). */
export const GUEST_FOLIO_SALE_QUERY = {
  customerType: "room_charge" as const,
};
